/**
 * Mux Video Integration
 * Handles video encoding, streaming, and processing via Mux
 *
 * Setup:
 * 1. Sign up at https://mux.com
 * 2. Get API credentials from dashboard
 * 3. Add to .env.local:
 *    MUX_TOKEN_ID=your_token_id
 *    MUX_TOKEN_SECRET=your_token_secret
 */

import Mux from '@mux/mux-node';

// Initialize Mux client
const mux = process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET
  ? new Mux({
      tokenId: process.env.MUX_TOKEN_ID,
      tokenSecret: process.env.MUX_TOKEN_SECRET
    })
  : null;

export interface MuxAsset {
  id: string;
  playback_id?: string;
  status: 'preparing' | 'ready' | 'errored';
  duration?: number;
  aspect_ratio?: string;
  created_at: string;
}

export interface MuxUpload {
  id: string;
  url: string;
  status: 'waiting' | 'asset_created' | 'errored' | 'cancelled' | 'timed_out';
}

/**
 * Create a direct upload URL for client-side uploads
 */
export async function createDirectUpload(
  corsOrigin: string = '*',
  timeout: number = 3600
): Promise<MuxUpload> {
  if (!mux) {
    throw new Error('Mux credentials not configured');
  }

  const upload = await mux.video.uploads.create({
    cors_origin: corsOrigin,
    new_asset_settings: {
      playback_policy: ['public'],
      mp4_support: 'standard'
    },
    timeout
  });

  return {
    id: upload.id,
    url: upload.url,
    status: upload.status as any
  };
}

/**
 * Create asset from a URL
 */
export async function createAssetFromUrl(
  url: string,
  passthrough?: string
): Promise<MuxAsset> {
  if (!mux) {
    throw new Error('Mux credentials not configured');
  }

  const asset = await mux.video.assets.create({
    input: [{ url }],
    playback_policy: ['public'],
    mp4_support: 'standard',
    passthrough
  });

  return {
    id: asset.id,
    playback_id: asset.playback_ids?.[0]?.id,
    status: asset.status as any,
    duration: asset.duration,
    aspect_ratio: asset.aspect_ratio,
    created_at: asset.created_at
  };
}

/**
 * Get asset details
 */
export async function getAsset(assetId: string): Promise<MuxAsset> {
  if (!mux) {
    throw new Error('Mux credentials not configured');
  }

  const asset = await mux.video.assets.retrieve(assetId);

  return {
    id: asset.id,
    playback_id: asset.playback_ids?.[0]?.id,
    status: asset.status as any,
    duration: asset.duration,
    aspect_ratio: asset.aspect_ratio,
    created_at: asset.created_at
  };
}

/**
 * Delete an asset
 */
export async function deleteAsset(assetId: string): Promise<void> {
  if (!mux) {
    throw new Error('Mux credentials not configured');
  }

  await mux.video.assets.delete(assetId);
}

/**
 * Get upload details
 */
export async function getUpload(uploadId: string): Promise<MuxUpload> {
  if (!mux) {
    throw new Error('Mux credentials not configured');
  }

  const upload = await mux.video.uploads.retrieve(uploadId);

  return {
    id: upload.id,
    url: upload.url,
    status: upload.status as any
  };
}

/**
 * Cancel an upload
 */
export async function cancelUpload(uploadId: string): Promise<void> {
  if (!mux) {
    throw new Error('Mux credentials not configured');
  }

  await mux.video.uploads.cancel(uploadId);
}

/**
 * Generate a thumbnail URL for a playback ID
 */
export function getThumbnailUrl(
  playbackId: string,
  options: {
    time?: number;
    width?: number;
    height?: number;
    fit_mode?: 'preserve' | 'crop' | 'smartcrop';
  } = {}
): string {
  const params = new URLSearchParams();

  if (options.time !== undefined) params.append('time', options.time.toString());
  if (options.width) params.append('width', options.width.toString());
  if (options.height) params.append('height', options.height.toString());
  if (options.fit_mode) params.append('fit_mode', options.fit_mode);

  return `https://image.mux.com/${playbackId}/thumbnail.jpg?${params.toString()}`;
}

/**
 * Generate an animated GIF URL
 */
export function getAnimatedGifUrl(
  playbackId: string,
  options: {
    start?: number;
    end?: number;
    width?: number;
    height?: number;
    fps?: number;
  } = {}
): string {
  const params = new URLSearchParams();

  if (options.start !== undefined) params.append('start', options.start.toString());
  if (options.end !== undefined) params.append('end', options.end.toString());
  if (options.width) params.append('width', options.width.toString());
  if (options.height) params.append('height', options.height.toString());
  if (options.fps) params.append('fps', options.fps.toString());

  return `https://image.mux.com/${playbackId}/animated.gif?${params.toString()}`;
}

/**
 * Get HLS stream URL
 */
export function getStreamUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

/**
 * Get MP4 URL (if MP4 support is enabled)
 */
export function getMp4Url(playbackId: string, quality: 'low' | 'medium' | 'high' = 'high'): string {
  return `https://stream.mux.com/${playbackId}/${quality}.mp4`;
}

/**
 * Verify Mux webhook signature
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!mux) {
    throw new Error('Mux credentials not configured');
  }

  try {
    return Mux.webhooks.verifyHeader(rawBody, signature, secret);
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return false;
  }
}

/**
 * Check if Mux is configured
 */
export function isMuxConfigured(): boolean {
  return mux !== null;
}
