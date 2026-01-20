// Client Portal - Messages Page
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { Send, Paperclip } from 'lucide-react';
import type { VendorMessage } from '@/types/portal';

export default function MessagesPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [messages, setMessages] = useState<VendorMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();

    // Set up real-time subscription
    const channel = supabase
      .channel(`messages:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendor_messages',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function loadMessages() {
    try {
      const { data, error } = await supabase
        .from('vendor_messages')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);

      // Mark vendor messages as read
      const unreadVendorMessages = data?.filter(
        (m) => m.sender_type === 'vendor' && !m.is_read
      );

      if (unreadVendorMessages && unreadVendorMessages.length > 0) {
        await supabase
          .from('vendor_messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('workspace_id', workspaceId)
          .eq('sender_type', 'vendor')
          .eq('is_read', false);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || sending) return;

    setSending(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error('No user found');
        return;
      }

      // Get vendor_id from workspace
      const { data: workspace } = await supabase
        .from('vendor_workspaces')
        .select('vendor_id')
        .eq('id', workspaceId)
        .single();

      if (!workspace) {
        console.error('Workspace not found');
        return;
      }

      const { error } = await supabase.from('vendor_messages').insert({
        workspace_id: workspaceId,
        vendor_id: workspace.vendor_id,
        sender_id: user.id,
        sender_type: 'client',
        content: newMessage.trim(),
        attachments: [],
        is_read: false,
      });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setNewMessage('');
      loadMessages();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSending(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (loading) {
    return <div>Loading messages...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="mt-2 text-muted-foreground">
          Communicate with your vendor about your project
        </p>
      </div>

      {/* Messages Container */}
      <Card className="flex flex-1 flex-col overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle>Conversation</CardTitle>
          <CardDescription>All messages are private and secure</CardDescription>
        </CardHeader>

        {/* Messages List */}
        <CardContent className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => {
                const isVendor = message.sender_type === 'vendor';

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isVendor ? 'flex-row' : 'flex-row-reverse'}`}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <div className="flex h-full w-full items-center justify-center bg-gray-200 text-sm font-medium">
                        {isVendor ? 'V' : 'C'}
                      </div>
                    </Avatar>

                    <div className={`flex-1 max-w-[70%] ${isVendor ? '' : 'flex flex-col items-end'}`}>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          isVendor
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Button variant="outline" size="icon" disabled>
              <Paperclip className="h-4 w-4" />
            </Button>
            <Textarea
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="min-h-[60px] resize-none"
              disabled={sending}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
