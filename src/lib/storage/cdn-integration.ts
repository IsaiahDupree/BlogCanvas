/**
 * S3/Storage CDN Integration
 * Asset upload, transformation, and CDN delivery
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Asset types
 */
export enum AssetType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  OTHER = 'other',
}

/**
 * Image transformation options
 */
export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: 'center' | 'top' | 'right' | 'bottom' | 'left';
}

/**
 * Upload options
 */
export interface UploadOptions {
  bucket?: string;
  path?: string;
  cacheControl?: string;
  contentType?: string;
  upsert?: boolean;
}

/**
 * Asset metadata
 */
export interface AssetMetadata {
  id: string;
  filename: string;
  path: string;
  url: string;
  cdn_url?: string;
  asset_type: AssetType;
  mime_type: string;
  size_bytes: number;
  width?: number;
  height?: number;
  duration?: number;
  uploaded_by?: string;
  uploaded_at: string;
}

/**
 * Default bucket for assets
 */
const DEFAULT_BUCKET = 'assets';

/**
 * CDN domain (configured in environment)
 */
const CDN_DOMAIN = process.env.NEXT_PUBLIC_CDN_DOMAIN || supabaseUrl.replace('https://', 'https://cdn.');

/**
 * Upload file to storage
 */
export async function uploadAsset(
  file: File,
  options: UploadOptions = {}
): Promise<AssetMetadata> {
  const {
    bucket = DEFAULT_BUCKET,
    path: customPath,
    cacheControl = '3600',
    contentType,
    upsert = false,
  } = options;

  // Generate unique filename
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(7);
  const ext = file.name.split('.').pop();
  const filename = `${timestamp}-${randomStr}.${ext}`;
  const storagePath = customPath || `uploads/${filename}`;

  // Upload file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file, {
      cacheControl,
      contentType: contentType || file.type,
      upsert,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  // Determine asset type
  const assetType = getAssetType(file.type);

  // Get file dimensions if image
  let width: number | undefined;
  let height: number | undefined;

  if (assetType === AssetType.IMAGE) {
    const dimensions = await getImageDimensions(file);
    width = dimensions.width;
    height = dimensions.height;
  }

  // Create asset metadata
  const metadata: AssetMetadata = {
    id: data.path,
    filename: file.name,
    path: data.path,
    url: urlData.publicUrl,
    cdn_url: getCDNUrl(data.path, bucket),
    asset_type: assetType,
    mime_type: file.type,
    size_bytes: file.size,
    width,
    height,
    uploaded_at: new Date().toISOString(),
  };

  // Store metadata in database
  await supabase.from('assets').insert({
    path: data.path,
    filename: file.name,
    asset_type: assetType,
    mime_type: file.type,
    size_bytes: file.size,
    width,
    height,
    storage_bucket: bucket,
    public_url: urlData.publicUrl,
    cdn_url: metadata.cdn_url,
  });

  return metadata;
}

/**
 * Get CDN URL for an asset
 */
export function getCDNUrl(
  path: string,
  bucket: string = DEFAULT_BUCKET,
  transform?: ImageTransformOptions
): string {
  let url = `${CDN_DOMAIN}/storage/v1/object/public/${bucket}/${path}`;

  // Add transformation parameters for images
  if (transform) {
    const params = new URLSearchParams();

    if (transform.width) params.append('width', transform.width.toString());
    if (transform.height) params.append('height', transform.height.toString());
    if (transform.quality) params.append('quality', transform.quality.toString());
    if (transform.format) params.append('format', transform.format);
    if (transform.fit) params.append('fit', transform.fit);
    if (transform.position) params.append('position', transform.position);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }
  }

  return url;
}

/**
 * Get optimized image URL with transformations
 */
export function getOptimizedImageUrl(
  path: string,
  options: ImageTransformOptions = {}
): string {
  const defaults: ImageTransformOptions = {
    format: 'webp',
    quality: 80,
    fit: 'cover',
  };

  return getCDNUrl(path, DEFAULT_BUCKET, { ...defaults, ...options });
}

/**
 * Get responsive image URLs
 */
export function getResponsiveImageUrls(path: string): {
  thumbnail: string;
  small: string;
  medium: string;
  large: string;
  original: string;
} {
  return {
    thumbnail: getOptimizedImageUrl(path, { width: 150, height: 150 }),
    small: getOptimizedImageUrl(path, { width: 640 }),
    medium: getOptimizedImageUrl(path, { width: 1024 }),
    large: getOptimizedImageUrl(path, { width: 1920 }),
    original: getCDNUrl(path),
  };
}

/**
 * Delete asset
 */
export async function deleteAsset(
  path: string,
  bucket: string = DEFAULT_BUCKET
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }

  // Remove from database
  await supabase.from('assets').delete().eq('path', path);
}

/**
 * Get asset metadata
 */
export async function getAssetMetadata(path: string): Promise<AssetMetadata | null> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('path', path)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.path,
    filename: data.filename,
    path: data.path,
    url: data.public_url,
    cdn_url: data.cdn_url,
    asset_type: data.asset_type,
    mime_type: data.mime_type,
    size_bytes: data.size_bytes,
    width: data.width,
    height: data.height,
    duration: data.duration,
    uploaded_by: data.uploaded_by,
    uploaded_at: data.created_at,
  };
}

/**
 * List assets
 */
export async function listAssets(
  bucket: string = DEFAULT_BUCKET,
  path?: string
): Promise<AssetMetadata[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('storage_bucket', bucket)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data.map(item => ({
    id: item.path,
    filename: item.filename,
    path: item.path,
    url: item.public_url,
    cdn_url: item.cdn_url,
    asset_type: item.asset_type,
    mime_type: item.mime_type,
    size_bytes: item.size_bytes,
    width: item.width,
    height: item.height,
    duration: item.duration,
    uploaded_by: item.uploaded_by,
    uploaded_at: item.created_at,
  }));
}

/**
 * Determine asset type from MIME type
 */
function getAssetType(mimeType: string): AssetType {
  if (mimeType.startsWith('image/')) {
    return AssetType.IMAGE;
  } else if (mimeType.startsWith('video/')) {
    return AssetType.VIDEO;
  } else if (mimeType.startsWith('audio/')) {
    return AssetType.AUDIO;
  } else if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('text')
  ) {
    return AssetType.DOCUMENT;
  } else {
    return AssetType.OTHER;
  }
}

/**
 * Get image dimensions from File
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(path: string, widths: number[] = [640, 1024, 1920]): string {
  return widths
    .map(width => `${getOptimizedImageUrl(path, { width })} ${width}w`)
    .join(', ');
}

/**
 * Get storage usage statistics
 */
export async function getStorageStats(bucket: string = DEFAULT_BUCKET): Promise<{
  totalFiles: number;
  totalSize: number;
  byType: Record<AssetType, { count: number; size: number }>;
}> {
  const { data, error } = await supabase
    .from('assets')
    .select('asset_type, size_bytes')
    .eq('storage_bucket', bucket);

  if (error) {
    throw error;
  }

  const stats = {
    totalFiles: data.length,
    totalSize: 0,
    byType: {} as Record<AssetType, { count: number; size: number }>,
  };

  // Initialize by type
  Object.values(AssetType).forEach(type => {
    stats.byType[type] = { count: 0, size: 0 };
  });

  // Calculate stats
  data.forEach(item => {
    stats.totalSize += item.size_bytes;
    stats.byType[item.asset_type as AssetType].count += 1;
    stats.byType[item.asset_type as AssetType].size += item.size_bytes;
  });

  return stats;
}

/**
 * Purge CDN cache for a path (if using external CDN like Cloudflare)
 */
export async function purgeCDNCache(path: string): Promise<void> {
  // Implementation depends on CDN provider
  // For Cloudflare: https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache
  // For now, this is a placeholder
  console.log(`Purging CDN cache for: ${path}`);
}
