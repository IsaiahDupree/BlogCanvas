/**
 * Supabase Database Mock
 *
 * Mocks Supabase database queries for testing
 */

export interface MockQueryBuilder<T = any> {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  upsert: jest.Mock;
  eq: jest.Mock;
  neq: jest.Mock;
  gt: jest.Mock;
  gte: jest.Mock;
  lt: jest.Mock;
  lte: jest.Mock;
  like: jest.Mock;
  ilike: jest.Mock;
  is: jest.Mock;
  in: jest.Mock;
  contains: jest.Mock;
  containedBy: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  range: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
  csv: jest.Mock;
  data?: T[];
  error?: any;
}

export const createMockQueryBuilder = <T = any>(
  data: T[] | null = [],
  error: any = null
): MockQueryBuilder<T> => {
  const builder: any = {
    data,
    error,
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockImplementation(() => {
      if (error) {
        return Promise.resolve({ data: null, error });
      }
      const singleData = Array.isArray(data) && data.length > 0 ? data[0] : null;
      return Promise.resolve({ data: singleData, error: null });
    }),
    maybeSingle: jest.fn().mockImplementation(() => {
      if (error) {
        return Promise.resolve({ data: null, error });
      }
      const singleData = Array.isArray(data) && data.length > 0 ? data[0] : null;
      return Promise.resolve({ data: singleData, error: null });
    }),
    csv: jest.fn().mockImplementation(() => {
      return Promise.resolve({ data: 'csv,data', error });
    }),
    then: jest.fn().mockImplementation((resolve) => {
      return Promise.resolve({ data, error }).then(resolve);
    })
  };

  return builder;
};

export const createMockSupabaseClient = (mockData: Record<string, any> = {}) => {
  return {
    from: jest.fn((table: string) => {
      const tableData = mockData[table] || [];
      return createMockQueryBuilder(tableData);
    }),
    rpc: jest.fn((fn: string, params?: any) => {
      const rpcData = mockData[`rpc_${fn}`] || null;
      return Promise.resolve({ data: rpcData, error: null });
    }),
    storage: {
      from: jest.fn((bucket: string) => ({
        upload: jest.fn().mockResolvedValue({
          data: { path: `${bucket}/test-file.jpg` },
          error: null
        }),
        download: jest.fn().mockResolvedValue({
          data: new Blob(['test']),
          error: null
        }),
        remove: jest.fn().mockResolvedValue({
          data: {},
          error: null
        }),
        getPublicUrl: jest.fn((path: string) => ({
          data: { publicUrl: `https://example.com/${bucket}/${path}` }
        }))
      }))
    }
  };
};

// Common test data
export const mockBlogPost = {
  id: 'test-post-id',
  client_id: 'test-client-id',
  topic: 'Test Blog Post',
  target_keyword: 'test keyword',
  status: 'drafting',
  word_count_goal: 1500,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const mockClient = {
  id: 'test-client-id',
  owner_id: 'test-user-id',
  name: 'Test Client',
  slug: 'test-client',
  website_url: 'https://test.example.com',
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const mockProfile = {
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'owner',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};
