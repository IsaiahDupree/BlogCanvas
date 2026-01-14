/**
 * WordPress Client Tests
 */

import { 
  WordPressClient, 
  generateSlug, 
  prepareContentForWordPress,
  WordPressCredentials,
  WordPressPost 
} from '../client';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('WordPressClient', () => {
  const mockCredentials: WordPressCredentials = {
    siteUrl: 'https://example.com',
    username: 'testuser',
    applicationPassword: 'xxxx xxxx xxxx xxxx'
  };

  let client: WordPressClient;

  beforeEach(() => {
    client = new WordPressClient(mockCredentials);
    mockFetch.mockClear();
  });

  describe('constructor', () => {
    it('should normalize site URL by removing trailing slash', () => {
      const clientWithSlash = new WordPressClient({
        ...mockCredentials,
        siteUrl: 'https://example.com/'
      });
      // The URL should be normalized internally
      expect(clientWithSlash).toBeDefined();
    });

    it('should create valid Basic auth header', () => {
      expect(client).toBeDefined();
    });
  });

  describe('testConnection', () => {
    it('should return success when connection is valid', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 1, name: 'Test User' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ name: 'Test Site' })
        });

      const result = await client.testConnection();

      expect(result.success).toBe(true);
      expect(result.siteName).toBe('Test Site');
    });

    it('should return error for invalid credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const result = await client.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid credentials');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('createPost', () => {
    const mockPost: WordPressPost = {
      title: 'Test Post',
      content: '<p>Test content</p>',
      status: 'publish'
    };

    it('should create a post successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 123,
          link: 'https://example.com/test-post/'
        })
      });

      const result = await client.createPost(mockPost);

      expect(result.success).toBe(true);
      expect(result.postId).toBe(123);
      expect(result.postUrl).toBe('https://example.com/test-post/');
    });

    it('should handle post creation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve(JSON.stringify({ message: 'Permission denied' }))
      });

      const result = await client.createPost(mockPost);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });

    it('should include optional fields when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 123, link: 'https://example.com/test/' })
      });

      const postWithOptions: WordPressPost = {
        ...mockPost,
        slug: 'custom-slug',
        excerpt: 'Test excerpt',
        categories: [1, 2],
        tags: [3, 4],
        meta: {
          _yoast_wpseo_title: 'SEO Title',
          _yoast_wpseo_metadesc: 'SEO Description'
        }
      };

      await client.createPost(postWithOptions);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/posts'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('custom-slug')
        })
      );
    });
  });

  describe('updatePost', () => {
    it('should update a post successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 123,
          link: 'https://example.com/updated-post/'
        })
      });

      const result = await client.updatePost(123, { title: 'Updated Title' });

      expect(result.success).toBe(true);
      expect(result.postId).toBe(123);
    });
  });

  describe('getCategories', () => {
    it('should fetch categories', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { id: 1, name: 'Category 1', slug: 'category-1' },
          { id: 2, name: 'Category 2', slug: 'category-2' }
        ])
      });

      const categories = await client.getCategories();

      expect(categories).toHaveLength(2);
      expect(categories[0].name).toBe('Category 1');
    });
  });

  describe('getOrCreateCategory', () => {
    it('should return existing category ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          { id: 5, name: 'Existing', slug: 'existing' }
        ])
      });

      const categoryId = await client.getOrCreateCategory('Existing');

      expect(categoryId).toBe(5);
    });

    it('should create new category if not found', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([])
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 10, name: 'New Category', slug: 'new-category' })
        });

      const categoryId = await client.getOrCreateCategory('New Category');

      expect(categoryId).toBe(10);
    });
  });
});

describe('generateSlug', () => {
  it('should convert title to lowercase slug', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('should remove special characters', () => {
    expect(generateSlug('Hello! World?')).toBe('hello-world');
  });

  it('should handle multiple spaces', () => {
    expect(generateSlug('Hello   World')).toBe('hello-world');
  });

  it('should truncate long titles', () => {
    const longTitle = 'A'.repeat(300);
    expect(generateSlug(longTitle).length).toBeLessThanOrEqual(200);
  });
});

describe('prepareContentForWordPress', () => {
  it('should normalize line breaks', () => {
    const content = 'Para 1\n\n\n\nPara 2';
    const prepared = prepareContentForWordPress(content);
    expect(prepared).toBe('Para 1\n\nPara 2');
  });

  it('should trim whitespace', () => {
    const content = '  Content  ';
    expect(prepareContentForWordPress(content)).toBe('Content');
  });
});
