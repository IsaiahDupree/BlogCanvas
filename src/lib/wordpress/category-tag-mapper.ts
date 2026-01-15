/**
 * WordPress Category and Tag Auto-Assignment Logic
 *
 * This service automatically maps blog posts to WordPress categories and tags
 * based on topic clusters and keywords.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { WordPressClient } from './client';

export interface WordPressTaxonomy {
  id: number;
  name: string;
  slug: string;
}

export interface AssignmentResult {
  categories: WordPressTaxonomy[];
  tags: WordPressTaxonomy[];
  categoriesAutoAssigned: boolean;
  tagsAutoAssigned: boolean;
}

/**
 * Auto-assign categories and tags to a blog post based on its content
 *
 * Logic:
 * 1. Categories: Map from topic cluster name/keywords
 * 2. Tags: Extract from target_keyword, seo_notes, and outline
 */
export async function autoAssignCategoriesAndTags(
  postId: string,
  connectionId: string
): Promise<AssignmentResult> {
  // Fetch blog post with related data
  const { data: post, error: postError } = await supabaseAdmin
    .from('blog_posts')
    .select(`
      *,
      topic_cluster:topic_clusters(
        name,
        primary_keyword,
        secondary_keywords
      )
    `)
    .eq('id', postId)
    .single();

  if (postError || !post) {
    throw new Error('Blog post not found');
  }

  // Fetch WordPress connection
  const { data: connection, error: connError } = await supabaseAdmin
    .from('wordpress_connections')
    .select('*')
    .eq('id', connectionId)
    .single();

  if (connError || !connection) {
    throw new Error('WordPress connection not found');
  }

  // Decrypt password
  const applicationPassword = Buffer.from(
    connection.application_password_encrypted,
    'base64'
  ).toString('utf-8');

  // Create WordPress client
  const wpClient = new WordPressClient({
    siteUrl: connection.site_url,
    username: connection.username,
    applicationPassword
  });

  // Fetch available categories and tags from WordPress
  const [wpCategories, wpTags] = await Promise.all([
    wpClient.getCategories(),
    wpClient.getTags()
  ]);

  // Auto-assign categories
  const assignedCategories = await assignCategories(
    post,
    wpCategories,
    wpClient
  );

  // Auto-assign tags
  const assignedTags = await assignTags(
    post,
    wpTags,
    wpClient
  );

  // Update the blog post with assignments
  await supabaseAdmin
    .from('blog_posts')
    .update({
      wordpress_categories: assignedCategories,
      wordpress_tags: assignedTags,
      wordpress_categories_auto_assigned: true,
      wordpress_tags_auto_assigned: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', postId);

  return {
    categories: assignedCategories,
    tags: assignedTags,
    categoriesAutoAssigned: true,
    tagsAutoAssigned: true
  };
}

/**
 * Assign categories based on topic cluster
 */
async function assignCategories(
  post: any,
  wpCategories: WordPressTaxonomy[],
  wpClient: WordPressClient
): Promise<WordPressTaxonomy[]> {
  const assigned: WordPressTaxonomy[] = [];

  // Strategy 1: Match topic cluster name to category
  if (post.topic_cluster?.name) {
    const clusterName = post.topic_cluster.name.toLowerCase();
    const matchedCategory = wpCategories.find(
      cat => cat.name.toLowerCase() === clusterName ||
             cat.slug.toLowerCase() === clusterName.replace(/\s+/g, '-')
    );

    if (matchedCategory) {
      assigned.push(matchedCategory);
    } else {
      // Create new category if it doesn't exist
      try {
        const newCategoryId = await wpClient.getOrCreateCategory(post.topic_cluster.name);
        assigned.push({
          id: newCategoryId,
          name: post.topic_cluster.name,
          slug: post.topic_cluster.name.toLowerCase().replace(/\s+/g, '-')
        });
      } catch (error) {
        console.error('Failed to create category:', error);
      }
    }
  }

  // Strategy 2: Match primary keyword to category
  if (assigned.length === 0 && post.topic_cluster?.primary_keyword) {
    const primaryKeyword = post.topic_cluster.primary_keyword.toLowerCase();
    const matchedCategory = wpCategories.find(
      cat => cat.name.toLowerCase().includes(primaryKeyword) ||
             primaryKeyword.includes(cat.name.toLowerCase())
    );

    if (matchedCategory) {
      assigned.push(matchedCategory);
    }
  }

  // Strategy 3: Fallback to "Uncategorized" or first category
  if (assigned.length === 0) {
    const uncategorized = wpCategories.find(
      cat => cat.name.toLowerCase() === 'uncategorized' ||
             cat.slug === 'uncategorized'
    );

    if (uncategorized) {
      assigned.push(uncategorized);
    } else if (wpCategories.length > 0) {
      assigned.push(wpCategories[0]);
    }
  }

  return assigned;
}

/**
 * Assign tags based on keywords and content
 */
async function assignTags(
  post: any,
  wpTags: WordPressTaxonomy[],
  wpClient: WordPressClient
): Promise<WordPressTaxonomy[]> {
  const assigned: WordPressTaxonomy[] = [];
  const keywords = new Set<string>();

  // Extract keywords from various sources
  if (post.target_keyword) {
    keywords.add(post.target_keyword.toLowerCase());
  }

  if (post.topic_cluster?.primary_keyword) {
    keywords.add(post.topic_cluster.primary_keyword.toLowerCase());
  }

  if (post.topic_cluster?.secondary_keywords) {
    const secondaryKeywords = Array.isArray(post.topic_cluster.secondary_keywords)
      ? post.topic_cluster.secondary_keywords
      : [];

    secondaryKeywords.forEach((kw: string) => keywords.add(kw.toLowerCase()));
  }

  // Extract keywords from SEO notes (comma-separated)
  if (post.seo_notes) {
    const noteKeywords = post.seo_notes
      .split(',')
      .map((kw: string) => kw.trim().toLowerCase())
      .filter((kw: string) => kw.length > 2 && kw.length < 30);

    noteKeywords.forEach((kw: string) => keywords.add(kw));
  }

  // Match keywords to existing tags or create new ones
  for (const keyword of Array.from(keywords).slice(0, 10)) { // Limit to 10 tags
    const matchedTag = wpTags.find(
      tag => tag.name.toLowerCase() === keyword ||
             tag.slug === keyword.replace(/\s+/g, '-')
    );

    if (matchedTag) {
      assigned.push(matchedTag);
    } else {
      // Create new tag if it doesn't exist
      try {
        const newTagId = await wpClient.getOrCreateTag(keyword);
        assigned.push({
          id: newTagId,
          name: keyword,
          slug: keyword.replace(/\s+/g, '-')
        });
      } catch (error) {
        console.error('Failed to create tag:', error);
      }
    }
  }

  return assigned;
}

/**
 * Manually override categories and tags
 */
export async function manuallyAssignCategoriesAndTags(
  postId: string,
  categories: WordPressTaxonomy[],
  tags: WordPressTaxonomy[]
): Promise<void> {
  await supabaseAdmin
    .from('blog_posts')
    .update({
      wordpress_categories: categories,
      wordpress_tags: tags,
      wordpress_categories_auto_assigned: false,
      wordpress_tags_auto_assigned: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', postId);
}

/**
 * Get current category and tag assignments for a post
 */
export async function getCategoryTagAssignments(
  postId: string
): Promise<{
  categories: WordPressTaxonomy[];
  tags: WordPressTaxonomy[];
  categoriesAutoAssigned: boolean;
  tagsAutoAssigned: boolean;
} | null> {
  const { data: post, error } = await supabaseAdmin
    .from('blog_posts')
    .select('wordpress_categories, wordpress_tags, wordpress_categories_auto_assigned, wordpress_tags_auto_assigned')
    .eq('id', postId)
    .single();

  if (error || !post) {
    return null;
  }

  return {
    categories: post.wordpress_categories || [],
    tags: post.wordpress_tags || [],
    categoriesAutoAssigned: post.wordpress_categories_auto_assigned ?? false,
    tagsAutoAssigned: post.wordpress_tags_auto_assigned ?? false
  };
}
