/**
 * Presence System
 * Real-time user presence tracking using Supabase Realtime
 */

import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface PresenceState {
  user_id: string;
  user_name: string;
  user_email: string;
  user_avatar?: string;
  online_at: string;
  status?: 'online' | 'away' | 'busy';
  current_page?: string;
}

export class PresenceManager {
  private channel: RealtimeChannel | null = null;
  private presenceState: Map<string, PresenceState> = new Map();
  private listeners: Set<(users: PresenceState[]) => void> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize presence tracking for a workspace or page
   */
  async init(
    roomId: string,
    userId: string,
    userName: string,
    userEmail: string,
    userAvatar?: string,
    currentPage?: string
  ): Promise<void> {
    const supabase = createClient();

    // Clean up existing channel if any
    if (this.channel) {
      await this.leave();
    }

    // Create presence channel
    this.channel = supabase.channel(`presence:${roomId}`, {
      config: {
        presence: {
          key: userId
        }
      }
    });

    // Track presence state
    this.channel
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel!.presenceState();
        this.updatePresenceState(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
        const state = this.channel!.presenceState();
        this.updatePresenceState(state);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        const state = this.channel!.presenceState();
        this.updatePresenceState(state);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this user's presence
          await this.channel!.track({
            user_id: userId,
            user_name: userName,
            user_email: userEmail,
            user_avatar: userAvatar,
            online_at: new Date().toISOString(),
            status: 'online',
            current_page: currentPage
          });

          // Send heartbeat every 30 seconds
          this.startHeartbeat();
        }
      });
  }

  /**
   * Update presence state and notify listeners
   */
  private updatePresenceState(state: Record<string, any>): void {
    this.presenceState.clear();

    Object.values(state).forEach((presences: any) => {
      presences.forEach((presence: PresenceState) => {
        this.presenceState.set(presence.user_id, presence);
      });
    });

    this.notifyListeners();
  }

  /**
   * Start heartbeat to keep presence alive
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.channel) {
        this.channel.track({
          online_at: new Date().toISOString()
        });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Subscribe to presence updates
   */
  subscribe(callback: (users: PresenceState[]) => void): () => void {
    this.listeners.add(callback);

    // Immediately call with current state
    callback(Array.from(this.presenceState.values()));

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of presence changes
   */
  private notifyListeners(): void {
    const users = Array.from(this.presenceState.values());
    this.listeners.forEach((callback) => callback(users));
  }

  /**
   * Update current user's status
   */
  async updateStatus(status: 'online' | 'away' | 'busy'): Promise<void> {
    if (this.channel) {
      await this.channel.track({
        status,
        online_at: new Date().toISOString()
      });
    }
  }

  /**
   * Update current page
   */
  async updateCurrentPage(page: string): Promise<void> {
    if (this.channel) {
      await this.channel.track({
        current_page: page,
        online_at: new Date().toISOString()
      });
    }
  }

  /**
   * Get list of online users
   */
  getOnlineUsers(): PresenceState[] {
    return Array.from(this.presenceState.values());
  }

  /**
   * Check if a specific user is online
   */
  isUserOnline(userId: string): boolean {
    return this.presenceState.has(userId);
  }

  /**
   * Get count of online users
   */
  getOnlineCount(): number {
    return this.presenceState.size;
  }

  /**
   * Leave the presence channel
   */
  async leave(): Promise<void> {
    this.stopHeartbeat();

    if (this.channel) {
      await this.channel.untrack();
      await this.channel.unsubscribe();
      this.channel = null;
    }

    this.presenceState.clear();
    this.listeners.clear();
  }
}

// Singleton instance
let presenceManager: PresenceManager | null = null;

/**
 * Get or create presence manager instance
 */
export function getPresenceManager(): PresenceManager {
  if (!presenceManager) {
    presenceManager = new PresenceManager();
  }
  return presenceManager;
}

/**
 * Hook for React components to use presence
 */
export function usePresence(
  roomId: string,
  userId: string,
  userName: string,
  userEmail: string,
  userAvatar?: string,
  currentPage?: string
) {
  const manager = getPresenceManager();

  // Initialize on mount
  if (typeof window !== 'undefined') {
    manager.init(roomId, userId, userName, userEmail, userAvatar, currentPage);
  }

  // Cleanup on unmount
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      manager.leave();
    });
  }

  return manager;
}
