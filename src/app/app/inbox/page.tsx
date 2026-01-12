'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, RefreshCw, Search, Link as LinkIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface EmailThread {
  id: string
  gmail_thread_id: string
  subject: string | null
  snippet: string | null
  last_message_at: string
  message_count: number
  labels: string[]
  participants: string[]
  client?: { id: string; name: string } | null
  project?: { id: string; name: string } | null
}

interface EmailMessage {
  id: string
  from_address: string
  to_addresses: string[]
  subject: string | null
  body_text: string | null
  body_html: string | null
  sent_at: string
}

export default function InboxPage() {
  const [loading, setLoading] = useState(true)
  const [threads, setThreads] = useState<EmailThread[]>([])
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null)
  const [messages, setMessages] = useState<EmailMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchThreads()
  }, [])

  const fetchThreads = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/gmail/threads?limit=100')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch threads')
      }

      setThreads(data.threads || [])
    } catch (err: any) {
      console.error('Error fetching threads:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (threadId: string) => {
    try {
      setLoadingMessages(true)

      const res = await fetch(`/api/gmail/threads/${threadId}/messages`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch messages')
      }

      setMessages(data.messages || [])
    } catch (err: any) {
      console.error('Error fetching messages:', err)
      setError(err.message)
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleThreadClick = (thread: EmailThread) => {
    setSelectedThread(thread)
    fetchMessages(thread.id)
  }

  const filteredThreads = threads.filter(thread => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      thread.subject?.toLowerCase().includes(query) ||
      thread.snippet?.toLowerCase().includes(query) ||
      thread.participants.some(p => p.toLowerCase().includes(query))
    )
  })

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Thread List Sidebar */}
      <div className="w-96 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <Link
            href="/app"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Gmail Inbox</h1>
            <Button
              onClick={fetchThreads}
              variant="ghost"
              size="sm"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-8 text-center">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No emails found</p>
              <p className="text-sm text-gray-500 mt-1">
                <Link href="/app/settings/gmail" className="text-blue-600 hover:underline">
                  Connect Gmail
                </Link>
                {' '}to sync your emails
              </p>
            </div>
          ) : (
            filteredThreads.map(thread => (
              <div
                key={thread.id}
                onClick={() => handleThreadClick(thread)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedThread?.id === thread.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">
                    {thread.subject || '(No subject)'}
                  </h3>
                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                    {new Date(thread.last_message_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                  {thread.snippet}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {thread.message_count} {thread.message_count === 1 ? 'message' : 'messages'}
                  </Badge>
                  {thread.client && (
                    <Badge variant="default" className="text-xs">
                      {thread.client.name}
                    </Badge>
                  )}
                  {thread.project && (
                    <Badge variant="outline" className="text-xs">
                      {thread.project.name}
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message View */}
      <div className="flex-1 flex flex-col">
        {!selectedThread ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select an email thread to view messages</p>
            </div>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="p-6 bg-white border-b">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedThread.subject || '(No subject)'}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{selectedThread.message_count} messages</span>
                <span>
                  Last updated: {new Date(selectedThread.last_message_at).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                {selectedThread.client ? (
                  <Link href={`/app/clients/${selectedThread.client.id}`}>
                    <Badge variant="default" className="cursor-pointer">
                      <LinkIcon className="h-3 w-3 mr-1" />
                      {selectedThread.client.name}
                    </Badge>
                  </Link>
                ) : (
                  <Badge variant="outline" className="cursor-pointer">
                    <LinkIcon className="h-3 w-3 mr-1" />
                    Link to Client
                  </Badge>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingMessages ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : messages.length === 0 ? (
                <p className="text-gray-600 text-center">No messages found</p>
              ) : (
                messages.map(message => (
                  <Card key={message.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-semibold text-gray-900">{message.from_address}</p>
                        <p className="text-sm text-gray-600">
                          To: {message.to_addresses.join(', ')}
                        </p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(message.sent_at).toLocaleString()}
                      </span>
                    </div>
                    {message.subject && (
                      <p className="font-medium text-gray-900 mb-3">{message.subject}</p>
                    )}
                    <div className="prose max-w-none">
                      {message.body_html ? (
                        <div dangerouslySetInnerHTML={{ __html: message.body_html }} />
                      ) : (
                        <p className="whitespace-pre-wrap">{message.body_text}</p>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
