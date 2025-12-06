import { supabaseAdmin } from '@/lib/supabase';

export interface WordPressPost {
    title: string;
    content: string;
    excerpt?: string;
    status: 'draft' | 'publish' | 'pending' | 'future';
    slug?: string;
    date?: string; // For scheduling
    categories?: number[];
    tags?: number[];
    featured_media?: number;
    meta?: {
        [key: string]: any;
    };
    yoast_meta?: {
        yoast_wpseo_title?: string;
        yoast_wpseo_metadesc?: string;
        yoast_wpseo_focuskw?: string;
    };
}

export interface WordPressPublishResult {
    success: boolean;
    wordpress_id?: number;
    url?: string;
    error?: string;
    error_details?: any;
}

/**
 * Mock WordPress API - simulates real WordPress REST API
 * Replace with real calls when credentials available
 */
const MOCK_MODE = process.env.WORDPRESS_MOCK === 'true' || !process.env.WORDPRESS_API_URL;

/**
 * Get CMS connection for a client/website
 */
export async function getCMSConnection(clientId: string): Promise<{
    base_url: string;
    credentials: { username: string; password: string };
} | null> {
    const { data: connection, error } = await supabaseAdmin
        .from('cms_connections')
        .select('base_url, auth_payload, cms_type')
        .eq('client_id', clientId)
        .eq('cms_type', 'wordpress')
        .single();

    if (error || !connection) {
        return null;
    }

    const authPayload = connection.auth_payload as any;
    return {
        base_url: connection.base_url,
        credentials: {
            username: authPayload.username || authPayload.user,
            password: authPayload.password || authPayload.app_password
        }
    };
}

/**
 * Publish blog post to WordPress
 */
export async function publishToWordPress(
    postId: string,
    websiteUrl?: string,
    credentials?: {
        username: string;
        password: string; // Application password
    },
    options?: {
        status?: 'draft' | 'publish' | 'pending';
        scheduleDate?: Date;
        clientId?: string;
    }
): Promise<WordPressPublishResult> {

    // Fetch blog post from database with related data
    const { data: post, error: postError } = await supabaseAdmin
        .from('blog_posts')
        .select(`
            *,
            client:clients(id),
            content_batch:content_batches(website:websites(url))
        `)
        .eq('id', postId)
        .single();

    if (postError || !post) {
        return {
            success: false,
            error: 'Post not found',
            error_details: postError
        };
    }

    // Get content from final_html or draft
    const content = post.final_html || (post.draft as any)?.content || '';
    if (!content) {
        return {
            success: false,
            error: 'Post has no content to publish'
        };
    }

    // Get CMS connection if clientId provided
    let cmsConnection = null;
    if (options?.clientId) {
        cmsConnection = await getCMSConnection(options.clientId);
    }

    // Use provided credentials or from CMS connection
    const finalCredentials = credentials || cmsConnection?.credentials;
    const finalUrl = websiteUrl || cmsConnection?.base_url || 
                     (post.content_batch as any)?.website?.url;

    if (!finalUrl) {
        return {
            success: false,
            error: 'Website URL not found. Please provide websiteUrl or ensure CMS connection is configured.'
        };
    }

    // Extract title and meta from content
    const { title, excerpt, htmlContent } = parseMarkdownContent(content);

    // Get SEO metadata
    const seoMetadata = post.seo_metadata as any || {};
    const slug = seoMetadata.slug || generateSlug(title || post.topic);

    // Prepare WordPress post
    const wpPost: WordPressPost = {
        title: title || post.topic,
        content: htmlContent,
        excerpt: excerpt || seoMetadata.meta_description || post.seo_notes || '',
        slug: slug,
        status: options?.status || 'draft',
        meta: {
            seo_score: post.seo_quality_score,
            target_keyword: post.target_keyword,
            generated_by: 'BlogCanvas AI',
            blogcanvas_post_id: postId
        },
        yoast_meta: {
            yoast_wpseo_title: seoMetadata.title_tag || title || post.topic,
            yoast_wpseo_metadesc: seoMetadata.meta_description || excerpt,
            yoast_wpseo_focuskw: post.target_keyword || ''
        }
    };

    // Handle scheduling
    if (options?.scheduleDate) {
        wpPost.status = 'future';
        wpPost.date = options.scheduleDate.toISOString();
    }

    // Publish to WordPress
    let result: WordPressPublishResult;
    if (MOCK_MODE || !finalCredentials) {
        // Mock API call
        result = await mockWordPressPublish(wpPost);
    } else {
        // Real WordPress API call
        result = await realWordPressPublish(finalUrl, wpPost, finalCredentials);
    }

    // Update database with publish info
    if (result.success) {
        const publishedAt = options?.scheduleDate ? options.scheduleDate : new Date();
        
        await supabaseAdmin
            .from('blog_posts')
            .update({
                status: options?.scheduleDate ? 'scheduled' : 'published',
                cms_publish_info: {
                    post_id: result.wordpress_id,
                    url: result.url,
                    published_at: publishedAt.toISOString(),
                    cms_type: 'wordpress',
                    status: wpPost.status
                },
                updated_at: new Date().toISOString()
            })
            .eq('id', postId);

        // Schedule check-backs if post is published (not scheduled)
        if (!options?.scheduleDate && result.url) {
            try {
                const { scheduleCheckBacks } = await import('@/lib/analytics/check-back-scheduler');
                await scheduleCheckBacks(postId, publishedAt);
            } catch (error) {
                console.error('Failed to schedule check-backs:', error);
                // Don't fail the publish if check-back scheduling fails
            }
        }
    } else {
        // Log error
        await supabaseAdmin
            .from('blog_posts')
            .update({
                cms_publish_info: {
                    error: result.error,
                    error_details: result.error_details,
                    last_attempt: new Date().toISOString()
                }
            })
            .eq('id', postId);
    }

    return result;
}

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 100);
}

/**
 * Parse markdown content to extract title, excerpt, and convert to HTML
 */
function parseMarkdownContent(markdown: string): {
    title: string;
    excerpt: string;
    htmlContent: string;
} {
    // Extract title (first H1)
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : 'Untitled Post';

    // Extract meta description
    const metaMatch = markdown.match(/<!--\s*Meta:\s*(.+?)\s*-->/);
    const excerpt = metaMatch ? metaMatch[1] : '';

    // Convert markdown to HTML (simple conversion)
    let html = markdown
        // Remove meta comments
        .replace(/<!--\s*Meta:.*?-->/g, '')
        // H1-H6
        .replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
        .replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
        .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
        .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
        .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
        .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
        // Bold and italic
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Links
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
        // Paragraphs
        .split('\n\n')
        .map(p => p.trim() ? `<p>${p}</p>` : '')
        .join('\n');

    return { title, excerpt, htmlContent: html };
}

/**
 * Mock WordPress publish - simulates API behavior
 */
async function mockWordPressPublish(post: WordPressPost): Promise<WordPressPublishResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate 95% success rate
    if (Math.random() < 0.95) {
        const mockId = Math.floor(Math.random() * 10000) + 1000;
        return {
            success: true,
            wordpress_id: mockId,
            url: `https://example.com/blog/${post.title.toLowerCase().replace(/\s+/g, '-')}`
        };
    } else {
        return {
            success: false,
            error: 'Mock: Connection timeout'
        };
    }
}

/**
 * Real WordPress API publish
 */
async function realWordPressPublish(
    siteUrl: string,
    post: WordPressPost,
    credentials?: {
        username: string;
        password: string;
    }
): Promise<WordPressPublishResult> {

    if (!credentials) {
        return {
            success: false,
            error: 'WordPress credentials not provided'
        };
    }

    // Ensure siteUrl doesn't end with /
    const baseUrl = siteUrl.replace(/\/$/, '');
    const apiUrl = `${baseUrl}/wp-json/wp/v2/posts`;

    // Prepare post data for WordPress REST API
    const wpPostData: any = {
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        status: post.status,
        slug: post.slug
    };

    // Add date for scheduling
    if (post.date) {
        wpPostData.date = post.date;
    }

    // Add categories and tags if provided
    if (post.categories && post.categories.length > 0) {
        wpPostData.categories = post.categories;
    }
    if (post.tags && post.tags.length > 0) {
        wpPostData.tags = post.tags;
    }

    // Add featured media if provided
    if (post.featured_media) {
        wpPostData.featured_media = post.featured_media;
    }

    // Add meta fields (for Yoast SEO and custom fields)
    if (post.meta || post.yoast_meta) {
        // WordPress REST API v2 uses 'meta' field for custom fields
        wpPostData.meta = {
            ...post.meta,
            ...post.yoast_meta
        };
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(
                    `${credentials.username}:${credentials.password}`
                ).toString('base64')
            },
            body: JSON.stringify(wpPostData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { message: errorText };
            }

            return {
                success: false,
                error: `WordPress API error: ${response.status}`,
                error_details: {
                    status: response.status,
                    statusText: response.statusText,
                    message: errorData.message || errorData.code || errorText
                }
            };
        }

        const data = await response.json();

        return {
            success: true,
            wordpress_id: data.id,
            url: data.link || data.guid?.rendered || `${baseUrl}/?p=${data.id}`
        };

    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Network error',
            error_details: {
                type: error.name,
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }
        };
    }
}

/**
 * Bulk publish multiple posts
 */
export async function bulkPublishToWordPress(
    postIds: string[],
    websiteUrl?: string,
    credentials?: {
        username: string;
        password: string;
    },
    options?: {
        status?: 'draft' | 'publish' | 'pending';
        clientId?: string;
    }
): Promise<{
    total: number;
    succeeded: number;
    failed: number;
    results: any[];
}> {
    const results = {
        total: postIds.length,
        succeeded: 0,
        failed: 0,
        results: [] as any[]
    };

    for (const postId of postIds) {
        try {
            const result = await publishToWordPress(
                postId,
                websiteUrl,
                credentials,
                {
                    status: options?.status || 'draft',
                    clientId: options?.clientId
                }
            );

            if (result.success) {
                results.succeeded++;
            } else {
                results.failed++;
            }

            results.results.push({
                postId,
                success: result.success,
                wordpress_id: result.wordpress_id,
                url: result.url,
                error: result.error,
                error_details: result.error_details
            });

            // Rate limiting: wait 1 second between posts
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error: any) {
            results.failed++;
            results.results.push({
                postId,
                success: false,
                error: error.message,
                error_details: {
                    type: error.name,
                    message: error.message
                }
            });
        }
    }

    return results;
}

/**
 * Schedule posts for future publishing
 */
export async function scheduleWordPressPost(
    postId: string,
    publishDate: Date,
    websiteUrl: string
): Promise<{ success: boolean; scheduledFor?: string; error?: string }> {

    // Store scheduled date in database
    await supabaseAdmin
        .from('blog_posts')
        .update({
            status: 'scheduled',
            scheduled_publish_date: publishDate.toISOString()
        })
        .eq('id', postId);

    return {
        success: true,
        scheduledFor: publishDate.toISOString()
    };
}

/**
 * Update existing WordPress post
 */
export async function updateWordPressPost(
    postId: string,
    wordpressId: number,
    websiteUrl: string,
    credentials?: {
        username: string;
        password: string;
    }
): Promise<WordPressPublishResult> {

    // Fetch updated content
    const { data: post } = await supabaseAdmin
        .from('blog_posts')
        .select('*')
        .eq('id', postId)
        .single();

    if (!post) {
        return { success: false, error: 'Post not found' };
    }

    if (MOCK_MODE) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return {
            success: true,
            wordpress_id: wordpressId,
            url: post.published_url || `https://example.com/blog/post-${wordpressId}`
        };
    }

    // Real WordPress update
    const { title, excerpt, htmlContent } = parseMarkdownContent(post.content);
    const apiUrl = `${websiteUrl}/wp-json/wp/v2/posts/${wordpressId}`;

    if (!credentials) {
        return { success: false, error: 'Credentials required' };
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(
                    `${credentials.username}:${credentials.password}`
                ).toString('base64')
            },
            body: JSON.stringify({
                title,
                content: htmlContent,
                excerpt
            })
        });

        if (!response.ok) {
            return {
                success: false,
                error: `Update failed: ${response.status}`
            };
        }

        const data = await response.json();
        return {
            success: true,
            wordpress_id: data.id,
            url: data.link
        };

    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
}
