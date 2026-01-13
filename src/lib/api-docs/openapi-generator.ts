/**
 * OpenAPI Spec Generator for BlogCanvas API
 * Generates OpenAPI 3.0 specification from route files
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, any>;
  components: {
    schemas: Record<string, any>;
    securitySchemes: Record<string, any>;
  };
}

interface RouteInfo {
  path: string;
  methods: string[];
  description?: string;
  parameters?: any[];
  requestBody?: any;
  responses?: any;
}

/**
 * Extract route information from a route file
 */
function extractRouteInfo(filePath: string, routePath: string): RouteInfo | null {
  try {
    const content = readFileSync(filePath, 'utf-8');

    // Extract HTTP methods (GET, POST, PUT, DELETE, PATCH)
    const methods: string[] = [];
    const methodRegex = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)/g;
    let match;
    while ((match = methodRegex.exec(content)) !== null) {
      methods.push(match[1].toLowerCase());
    }

    if (methods.length === 0) return null;

    // Extract comment-based description (JSDoc style)
    const descriptionRegex = /\/\/\s*(GET|POST|PUT|DELETE|PATCH)\s+([^\n]+)/;
    const descMatch = content.match(descriptionRegex);
    const description = descMatch ? descMatch[2].trim() : undefined;

    return {
      path: routePath,
      methods,
      description,
      parameters: extractParameters(content, routePath),
      requestBody: extractRequestBody(content),
      responses: extractResponses(content)
    };
  } catch (error) {
    console.error(`Error reading route file ${filePath}:`, error);
    return null;
  }
}

/**
 * Extract path and query parameters
 */
function extractParameters(content: string, routePath: string): any[] {
  const parameters: any[] = [];

  // Extract path parameters from route path (e.g., {id}, {postId})
  const pathParamRegex = /\{([^}]+)\}/g;
  let match;
  while ((match = pathParamRegex.exec(routePath)) !== null) {
    const paramName = match[1];
    parameters.push({
      name: paramName,
      in: 'path',
      required: true,
      schema: {
        type: 'string'
      },
      description: `${paramName} identifier`
    });
  }

  // Extract query parameters from searchParams.get()
  const queryParamRegex = /searchParams\.get\(['"]([^'"]+)['"]\)/g;
  while ((match = queryParamRegex.exec(content)) !== null) {
    parameters.push({
      name: match[1],
      in: 'query',
      required: false,
      schema: {
        type: 'string'
      },
      description: `${match[1]} filter`
    });
  }

  return parameters;
}

/**
 * Extract request body schema from await request.json()
 */
function extractRequestBody(content: string): any {
  // Look for destructured body fields
  const bodyRegex = /const\s+\{([^}]+)\}\s+=\s+(?:await\s+)?(?:request|req)\.json\(\)/;
  const match = content.match(bodyRegex);

  if (!match) return undefined;

  const fields = match[1]
    .split(',')
    .map(f => f.trim().split(/[=:]/)[0].trim())
    .filter(f => f.length > 0);

  const properties: Record<string, any> = {};
  fields.forEach(field => {
    properties[field] = {
      type: 'string',
      description: field.replace(/_/g, ' ')
    };
  });

  return {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties
        }
      }
    }
  };
}

/**
 * Extract response schemas from NextResponse.json()
 */
function extractResponses(content: string): any {
  return {
    '200': {
      description: 'Successful response',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' }
            }
          }
        }
      }
    },
    '400': {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              error: { type: 'string' }
            }
          }
        }
      }
    },
    '401': {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              error: { type: 'string' }
            }
          }
        }
      }
    },
    '500': {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              error: { type: 'string' }
            }
          }
        }
      }
    }
  };
}

/**
 * Recursively scan API directory for route files
 */
function scanApiRoutes(dir: string, basePath: string = ''): RouteInfo[] {
  const routes: RouteInfo[] = [];

  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Handle dynamic routes [param]
        const isDynamic = entry.startsWith('[') && entry.endsWith(']');
        const pathSegment = isDynamic ? `{${entry.slice(1, -1)}}` : entry;
        const newBasePath = `${basePath}/${pathSegment}`;

        routes.push(...scanApiRoutes(fullPath, newBasePath));
      } else if (entry === 'route.ts') {
        // This is a route file
        const routePath = basePath || '/';
        const routeInfo = extractRouteInfo(fullPath, routePath);
        if (routeInfo) {
          routes.push(routeInfo);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error);
  }

  return routes;
}

/**
 * Generate OpenAPI spec from routes
 */
export function generateOpenAPISpec(apiDir: string): OpenAPISpec {
  const routes = scanApiRoutes(apiDir);

  const paths: Record<string, any> = {};

  routes.forEach(route => {
    const pathKey = `/api${route.path}`;
    if (!paths[pathKey]) {
      paths[pathKey] = {};
    }

    route.methods.forEach(method => {
      paths[pathKey][method] = {
        summary: route.description || `${method.toUpperCase()} ${route.path}`,
        description: route.description,
        parameters: route.parameters?.length ? route.parameters : undefined,
        requestBody: route.requestBody,
        responses: route.responses,
        security: [{ bearerAuth: [] }]
      };
    });
  });

  return {
    openapi: '3.0.0',
    info: {
      title: 'BlogCanvas API',
      version: '1.0.0',
      description: 'BlogCanvas API - Client-vendor relationship project management suite for bloggers'
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4848',
        description: 'API Server'
      }
    ],
    paths,
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' }
          }
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Supabase JWT token from authentication'
        }
      }
    }
  };
}
