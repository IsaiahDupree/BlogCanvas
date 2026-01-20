'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

interface Mention {
  id: string;
  name: string;
  position: number;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string, mentions: Mention[]) => void;
  placeholder?: string;
  className?: string;
  workspaceId?: string;
  onSubmit?: () => void;
}

export default function MentionInput({
  value,
  onChange,
  placeholder = 'Type @ to mention someone...',
  className = '',
  workspaceId,
  onSubmit
}: MentionInputProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUsers();
  }, [workspaceId]);

  const fetchUsers = async () => {
    try {
      const supabase = createClient();

      // Fetch vendors and clients
      const { data: vendors } = await supabase
        .from('vendors')
        .select('id, name, email, avatar_url');

      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, email');

      const allUsers: User[] = [
        ...(vendors || []),
        ...(clients || [])
      ];

      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    setCursorPosition(cursorPos);
    onChange(newValue, mentions);

    // Check for @ mention
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const searchText = textBeforeCursor.slice(lastAtIndex + 1);

      // Only show suggestions if @ is not part of an email or URL
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      if (charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtIndex === 0) {
        if (searchText.length >= 0 && !searchText.includes(' ')) {
          const filtered = users.filter(user =>
            user.name.toLowerCase().includes(searchText.toLowerCase()) ||
            user.email.toLowerCase().includes(searchText.toLowerCase())
          );

          setFilteredUsers(filtered);
          setShowSuggestions(filtered.length > 0);
          setSelectedIndex(0);
        } else {
          setShowSuggestions(false);
        }
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const insertMention = (user: User) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    const mentionText = `@${user.name}`;
    const newValue =
      textBeforeCursor.slice(0, lastAtIndex) +
      mentionText +
      ' ' +
      textAfterCursor;

    const newMentions = [
      ...mentions,
      {
        id: user.id,
        name: user.name,
        position: lastAtIndex
      }
    ];

    setMentions(newMentions);
    onChange(newValue, newMentions);
    setShowSuggestions(false);

    // Move cursor after mention
    const newCursorPos = lastAtIndex + mentionText.length + 1;
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions) {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onSubmit?.();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredUsers.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;

      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (filteredUsers[selectedIndex]) {
          insertMention(filteredUsers[selectedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        break;
    }
  };

  const highlightMentions = (text: string) => {
    let result = text;
    mentions.forEach((mention) => {
      const mentionText = `@${mention.name}`;
      result = result.replace(
        mentionText,
        `<span class="bg-blue-100 text-blue-700 px-1 rounded">${mentionText}</span>`
      );
    });
    return result;
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${className}`}
        rows={3}
      />

      {showSuggestions && filteredUsers.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {filteredUsers.map((user, index) => (
            <div
              key={user.id}
              onClick={() => insertMention(user)}
              className={`px-4 py-2 cursor-pointer flex items-center gap-3 ${
                index === selectedIndex
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {mentions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {mentions.map((mention, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
            >
              @{mention.name}
              <button
                onClick={() => {
                  const newMentions = mentions.filter((_, i) => i !== index);
                  setMentions(newMentions);
                  onChange(value.replace(`@${mention.name}`, ''), newMentions);
                }}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {onSubmit && (
        <div className="mt-2 text-xs text-gray-500">
          Press Cmd/Ctrl + Enter to submit
        </div>
      )}
    </div>
  );
}
