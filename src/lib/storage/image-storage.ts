/**
 * Image Storage Service
 * Handles uploading and managing images in Supabase Storage
 * PRD Epic 5: AI Pipeline - feat-039
 */

import { createClient } from '@/lib/supabase/server';
import { downloadImage } from '@/lib/ai/image-generator';

const STORAGE_BUCKET = 'blog-post-images';

/**
 * Upload an image to Supabase Storage
 * @param imageUrl - URL of the image to download and upload
 * @param postId - Blog post ID (for organizing in storage)
 * @param fileName - Optional custom file name
 * @returns Storage path
 */
export async function uploadImageToStorage(
  imageUrl: string,
  postId: string,
  fileName?: string
): Promise<string> {
  const supabase = await createClient();

  try {
    // Download image from URL
    const imageBuffer = await downloadImage(imageUrl);

    // Generate file name if not provided
    const timestamp = Date.now();
    const finalFileName =
      fileName || `${postId}-${timestamp}.png`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(`posts/${postId}/${finalFileName}`, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    return data.path;
  } catch (error: any) {
    console.error('Error uploading image to storage:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Get public URL for a stored image
 * @param storagePath - Path in Supabase Storage
 * @returns Public URL
 */
export async function getImagePublicUrl(storagePath: string): Promise<string> {
  const supabase = await createClient();

  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

/**
 * Delete an image from Supabase Storage
 * @param storagePath - Path in Supabase Storage
 */
export async function deleteImageFromStorage(
  storagePath: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([storagePath]);

  if (error) {
    console.error('Error deleting image from storage:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

/**
 * Ensure storage bucket exists and is properly configured
 * This should be run during app initialization or deployment
 */
export async function ensureStorageBucketExists(): Promise<void> {
  const supabase = await createClient();

  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();

    const bucketExists = buckets?.some((b) => b.name === STORAGE_BUCKET);

    if (!bucketExists) {
      // Create bucket if it doesn't exist
      const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
      });

      if (error) {
        console.error('Error creating storage bucket:', error);
      } else {
        console.log(`Storage bucket "${STORAGE_BUCKET}" created successfully`);
      }
    }
  } catch (error) {
    console.error('Error ensuring storage bucket exists:', error);
  }
}
