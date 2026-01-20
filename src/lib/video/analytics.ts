/**
 * Video Analytics System
 * Tracks video views, watch time, engagement, and completion rates
 */

import { createClient } from '@/lib/supabase/client';

export interface VideoView {
  id: string;
  video_id: string;
  viewer_id?: string;
  viewer_type?: 'vendor' | 'client' | 'anonymous';
  session_id: string;
  started_at: string;
  ended_at?: string;
  watch_time: number; // seconds
  completion_rate: number; // 0-100
  max_position_reached: number; // seconds
  device_type?: string;
  browser?: string;
  country?: string;
  referrer?: string;
}

export interface VideoAnalytics {
  video_id: string;
  total_views: number;
  unique_viewers: number;
  total_watch_time: number; // seconds
  average_watch_time: number; // seconds
  average_completion_rate: number; // 0-100
  completion_rates: {
    '25%': number;
    '50%': number;
    '75%': number;
    '100%': number;
  };
  engagement_over_time: Array<{
    timestamp: string;
    concurrent_viewers: number;
  }>;
  top_drop_off_points: Array<{
    timestamp: number;
    percentage: number;
  }>;
}

export interface VideoEvent {
  type: 'play' | 'pause' | 'seek' | 'ended' | 'progress';
  video_id: string;
  session_id: string;
  timestamp: number;
  current_time: number;
  duration: number;
  metadata?: Record<string, any>;
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Get or create session ID for current viewer
 */
function getSessionId(videoId: string): string {
  const storageKey = `video_session_${videoId}`;
  let sessionId = sessionStorage.getItem(storageKey);

  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(storageKey, sessionId);
  }

  return sessionId;
}

/**
 * Track video event
 */
export async function trackVideoEvent(event: VideoEvent): Promise<void> {
  try {
    const response = await fetch('/api/video/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      console.error('Failed to track video event');
    }
  } catch (error) {
    console.error('Error tracking video event:', error);
  }
}

/**
 * Start tracking a video view
 */
export async function startVideoView(
  videoId: string,
  viewerId?: string,
  viewerType?: 'vendor' | 'client' | 'anonymous'
): Promise<string> {
  const sessionId = getSessionId(videoId);

  try {
    const response = await fetch('/api/video/analytics/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_id: videoId,
        viewer_id: viewerId,
        viewer_type: viewerType || 'anonymous',
        session_id: sessionId,
        device_type: getDeviceType(),
        browser: getBrowser(),
        referrer: document.referrer
      })
    });

    if (!response.ok) {
      console.error('Failed to start video view tracking');
    }
  } catch (error) {
    console.error('Error starting video view:', error);
  }

  return sessionId;
}

/**
 * Update video view progress
 */
export async function updateVideoProgress(
  sessionId: string,
  watchTime: number,
  maxPositionReached: number,
  duration: number
): Promise<void> {
  const completionRate = duration > 0 ? (maxPositionReached / duration) * 100 : 0;

  try {
    await fetch('/api/video/analytics/views', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        watch_time: watchTime,
        max_position_reached: maxPositionReached,
        completion_rate: Math.min(100, completionRate)
      })
    });
  } catch (error) {
    console.error('Error updating video progress:', error);
  }
}

/**
 * End video view
 */
export async function endVideoView(sessionId: string): Promise<void> {
  try {
    await fetch('/api/video/analytics/views', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        ended_at: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Error ending video view:', error);
  }
}

/**
 * Get analytics for a video
 */
export async function getVideoAnalytics(videoId: string): Promise<VideoAnalytics | null> {
  try {
    const response = await fetch(`/api/video/analytics/${videoId}`);

    if (!response.ok) {
      console.error('Failed to fetch video analytics');
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching video analytics:', error);
    return null;
  }
}

/**
 * Get device type
 */
function getDeviceType(): string {
  const ua = navigator.userAgent;

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Get browser name
 */
function getBrowser(): string {
  const ua = navigator.userAgent;

  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
  if (ua.includes('Opera/') || ua.includes('OPR/')) return 'Opera';

  return 'Unknown';
}

/**
 * Video tracker class for easy integration
 */
export class VideoTracker {
  private videoId: string;
  private sessionId: string | null = null;
  private startTime: number = 0;
  private watchTime: number = 0;
  private maxPosition: number = 0;
  private duration: number = 0;
  private lastUpdateTime: number = 0;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(videoId: string) {
    this.videoId = videoId;
  }

  async start(viewerId?: string, viewerType?: 'vendor' | 'client' | 'anonymous') {
    this.sessionId = await startVideoView(this.videoId, viewerId, viewerType);
    this.startTime = Date.now();
    this.lastUpdateTime = this.startTime;

    // Update every 5 seconds
    this.updateInterval = setInterval(() => {
      this.sendUpdate();
    }, 5000);
  }

  onPlay(currentTime: number, duration: number) {
    this.duration = duration;
    this.lastUpdateTime = Date.now();

    trackVideoEvent({
      type: 'play',
      video_id: this.videoId,
      session_id: this.sessionId || '',
      timestamp: Date.now(),
      current_time: currentTime,
      duration
    });
  }

  onPause(currentTime: number, duration: number) {
    this.updateWatchTime();

    trackVideoEvent({
      type: 'pause',
      video_id: this.videoId,
      session_id: this.sessionId || '',
      timestamp: Date.now(),
      current_time: currentTime,
      duration
    });
  }

  onSeek(currentTime: number, duration: number) {
    trackVideoEvent({
      type: 'seek',
      video_id: this.videoId,
      session_id: this.sessionId || '',
      timestamp: Date.now(),
      current_time: currentTime,
      duration
    });
  }

  onEnded(currentTime: number, duration: number) {
    this.updateWatchTime();

    trackVideoEvent({
      type: 'ended',
      video_id: this.videoId,
      session_id: this.sessionId || '',
      timestamp: Date.now(),
      current_time: currentTime,
      duration
    });

    this.stop();
  }

  onProgress(currentTime: number, duration: number) {
    this.duration = duration;
    this.maxPosition = Math.max(this.maxPosition, currentTime);

    // Track milestone completions
    const milestones = [0.25, 0.5, 0.75, 1.0];
    const completionRate = currentTime / duration;

    milestones.forEach(milestone => {
      const key = `milestone_${milestone}`;
      if (completionRate >= milestone && !sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, 'true');

        trackVideoEvent({
          type: 'progress',
          video_id: this.videoId,
          session_id: this.sessionId || '',
          timestamp: Date.now(),
          current_time: currentTime,
          duration,
          metadata: { milestone: milestone * 100 }
        });
      }
    });
  }

  private updateWatchTime() {
    const now = Date.now();
    const elapsed = (now - this.lastUpdateTime) / 1000;
    this.watchTime += elapsed;
    this.lastUpdateTime = now;
  }

  private sendUpdate() {
    if (!this.sessionId) return;

    this.updateWatchTime();
    updateVideoProgress(
      this.sessionId,
      Math.round(this.watchTime),
      Math.round(this.maxPosition),
      this.duration
    );
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.sessionId) {
      this.sendUpdate();
      endVideoView(this.sessionId);
    }
  }
}
