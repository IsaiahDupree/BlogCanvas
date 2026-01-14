/**
 * WordPress REST API Client
 * Supports both WordPress.com and self-hosted WordPress with REST API
 */

export interface WordPressCredentials {
  siteUrl: string;
  username: string;
  applicationPassword: string; // WordPress Application Password (not regular password)
}

export interface WordPressPost {
  id?: number;
  title: string;
  content: string;
  status: 'publish' | 'draft' | 'pending' | 'private' | 'future';
  slug?: string;
  excerpt?: string;
  featured_media?: number;
  categories?: number[];
  tags?: number[];
  meta?: {
    _yoast_wpseo_title?: string;
    _yoast_wpseo_metadesc?: string;
    _yoast_wpseo_focuskw?: string;
  };
  date?: string; // ISO 8601 format for scheduling
}

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
}

export interface WordPressTag {
  id: number;
  name: string;
  slug: string;
}

export interface PublishResult {
  success: boolean;
  postId?: number;
  postUrl?: string;
  error?: string;
}

export class WordPressClient {
  private siteUrl: string;
  private authHeader: string;

  constructor(credentials: WordPressCredentials) {
    // Normalize URL - remove trailing slash
    this.siteUrl = credentials.siteUrl.replace(/\/$/, '');
    
    // Create Basic Auth header with Application Password
    const auth = Buffer.from(`${credentials.username}:${credentials.applicationPassword}`).toString('base64');
    this.authHeader = `Basic ${auth}`;
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: object
  ): Promise<T> {
    const url = `${this.siteUrl}/wp-json/wp/v2${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `WordPress API error: ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Test connection to WordPress site
   */
  async testConnection(): Promise<{ success: boolean; siteName?: string; error?: string }> {
    try {
      const response = await fetch(`${this.siteUrl}/wp-json/wp/v2/users/me`, {
        headers: {
          'Authorization': this.authHeader,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Invalid credentials. Make sure you are using an Application Password.' };
        }
        return { success: false, error: `Connection failed: ${response.status}` };
      }

      const user = await response.json();
      
      // Get site info
      const siteResponse = await fetch(`${this.siteUrl}/wp-json`);
      const siteInfo = await siteResponse.json();

      return { 
        success: true, 
        siteName: siteInfo.name || 'WordPress Site'
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to connect to WordPress' 
      };
    }
  }

  /**
   * Create a new post
   */
  async createPost(post: WordPressPost): Promise<PublishResult> {
    try {
      const wpPost: any = {
        title: post.title,
        content: post.content,
        status: post.status,
      };

      if (post.slug) wpPost.slug = post.slug;
      if (post.excerpt) wpPost.excerpt = post.excerpt;
      if (post.featured_media) wpPost.featured_media = post.featured_media;
      if (post.categories?.length) wpPost.categories = post.categories;
      if (post.tags?.length) wpPost.tags = post.tags;
      if (post.date) wpPost.date = post.date;
      
      // Yoast SEO meta fields
      if (post.meta) {
        wpPost.meta = post.meta;
      }

      const result = await this.request<any>('/posts', 'POST', wpPost);

      return {
        success: true,
        postId: result.id,
        postUrl: result.link,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update an existing post
   */
  async updatePost(postId: number, post: Partial<WordPressPost>): Promise<PublishResult> {
    try {
      const result = await this.request<any>(`/posts/${postId}`, 'PUT', post);

      return {
        success: true,
        postId: result.id,
        postUrl: result.link,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<WordPressCategory[]> {
    return this.request<WordPressCategory[]>('/categories?per_page=100');
  }

  /**
   * Create a category if it doesn't exist
   */
  async getOrCreateCategory(name: string): Promise<number> {
    const categories = await this.getCategories();
    const existing = categories.find(
      c => c.name.toLowerCase() === name.toLowerCase() || c.slug === name.toLowerCase().replace(/\s+/g, '-')
    );

    if (existing) {
      return existing.id;
    }

    const newCategory = await this.request<WordPressCategory>('/categories', 'POST', { name });
    return newCategory.id;
  }

  /**
   * Get all tags
   */
  async getTags(): Promise<WordPressTag[]> {
    return this.request<WordPressTag[]>('/tags?per_page=100');
  }

  /**
   * Create a tag if it doesn't exist
   */
  async getOrCreateTag(name: string): Promise<number> {
    const tags = await this.getTags();
    const existing = tags.find(
      t => t.name.toLowerCase() === name.toLowerCase() || t.slug === name.toLowerCase().replace(/\s+/g, '-')
    );

    if (existing) {
      return existing.id;
    }

    const newTag = await this.request<WordPressTag>('/tags', 'POST', { name });
    return newTag.id;
  }

  /**
   * Upload media (featured image)
   */
  async uploadMedia(
    imageUrl: string,
    filename: string,
    altText?: string
  ): Promise<{ success: boolean; mediaId?: number; error?: string }> {
    try {
      // Fetch the image
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

      // Upload to WordPress
      const url = `${this.siteUrl}/wp-json/wp/v2/media`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
        body: imageBuffer,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload media: ${response.status}`);
      }

      const media = await response.json();

      // Update alt text if provided
      if (altText && media.id) {
        await this.request(`/media/${media.id}`, 'PUT', { alt_text: altText });
      }

      return {
        success: true,
        mediaId: media.id,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get post by ID
   */
  async getPost(postId: number): Promise<any> {
    return this.request<any>(`/posts/${postId}`);
  }

  /**
   * Delete a post
   */
  async deletePost(postId: number): Promise<{ success: boolean; error?: string }> {
    try {
      await this.request(`/posts/${postId}?force=true`, 'DELETE');
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

/**
 * Helper to generate a slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 200);
}

/**
 * Convert HTML content to WordPress-compatible format
 */
export function prepareContentForWordPress(htmlContent: string): string {
  // WordPress handles most HTML well, but we can do some cleanup
  return htmlContent
    .replace(/\n\s*\n/g, '\n\n') // Normalize line breaks
    .trim();
}
