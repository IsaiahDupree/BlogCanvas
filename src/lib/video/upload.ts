/**
 * Video Upload System
 * Handles video uploads to Mux or fallback to Supabase Storage
 */

import { createClient } from '@/lib/supabase/client';
import {
  createDirectUpload,
  createAssetFromUrl,
  getAsset,
  type MuxAsset,
  type MuxUpload,
  isMuxConfigured
} from './mux';

export interface VideoUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface VideoUploadResult {
  id: string;
  playback_id?: string;
  url?: string;
  thumbnail_url?: string;
  provider: 'mux' | 'supabase';
  status: 'uploading' | 'processing' | 'ready' | 'error';
}

/**
 * Upload video using Mux Direct Upload
 */
export async function uploadVideoWithMux(
  file: File,
  onProgress?: (progress: VideoUploadProgress) => void
): Promise<VideoUploadResult> {
  if (!isMuxConfigured()) {
    throw new Error('Mux is not configured. Please add MUX_TOKEN_ID and MUX_TOKEN_SECRET to .env.local');
  }

  // Step 1: Create direct upload URL
  const upload: MuxUpload = await fetch('/api/video/upload/mux', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      corsOrigin: window.location.origin
    })
  }).then(res => res.json());

  // Step 2: Upload file to Mux
  const xhr = new XMLHttpRequest();

  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({
          loaded: e.loaded,
          total: e.total,
          percentage: Math.round((e.loaded / e.total) * 100)
        });
      }
    });

    xhr.addEventListener('load', async () => {
      if (xhr.status === 200) {
        try {
          // Poll for asset creation
          let attempts = 0;
          const maxAttempts = 30;

          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const response = await fetch(`/api/video/upload/mux/${upload.id}`);
            const data = await response.json();

            if (data.asset_id) {
              const asset = await fetch(`/api/video/asset/${data.asset_id}`).then(r => r.json());

              resolve({
                id: asset.id,
                playback_id: asset.playback_id,
                thumbnail_url: asset.playback_id
                  ? `https://image.mux.com/${asset.playback_id}/thumbnail.jpg`
                  : undefined,
                provider: 'mux',
                status: asset.status === 'ready' ? 'ready' : 'processing'
              });
              return;
            }

            attempts++;
          }

          reject(new Error('Timeout waiting for video processing'));
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.open('PUT', upload.url);
    xhr.send(file);
  });
}

/**
 * Upload video to Supabase Storage (fallback)
 */
export async function uploadVideoToSupabase(
  file: File,
  bucket: string = 'videos',
  onProgress?: (progress: VideoUploadProgress) => void
): Promise<VideoUploadResult> {
  const supabase = createClient();

  // Generate unique file name
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${fileName}`;

  // Upload file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw error;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return {
    id: filePath,
    url: urlData.publicUrl,
    provider: 'supabase',
    status: 'ready'
  };
}

/**
 * Upload video (auto-selects best provider)
 */
export async function uploadVideo(
  file: File,
  onProgress?: (progress: VideoUploadProgress) => void
): Promise<VideoUploadResult> {
  // Validate file
  if (!file.type.startsWith('video/')) {
    throw new Error('File must be a video');
  }

  // Check file size (max 5GB)
  const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
  if (file.size > maxSize) {
    throw new Error('File size must be less than 5GB');
  }

  // Try Mux first, fallback to Supabase
  try {
    if (isMuxConfigured()) {
      return await uploadVideoWithMux(file, onProgress);
    } else {
      console.warn('Mux not configured, falling back to Supabase Storage');
      return await uploadVideoToSupabase(file, 'videos', onProgress);
    }
  } catch (error) {
    console.error('Mux upload failed, falling back to Supabase:', error);
    return await uploadVideoToSupabase(file, 'videos', onProgress);
  }
}

/**
 * Delete video
 */
export async function deleteVideo(
  videoId: string,
  provider: 'mux' | 'supabase'
): Promise<void> {
  if (provider === 'mux') {
    await fetch(`/api/video/asset/${videoId}`, {
      method: 'DELETE'
    });
  } else {
    const supabase = createClient();
    await supabase.storage.from('videos').remove([videoId]);
  }
}
