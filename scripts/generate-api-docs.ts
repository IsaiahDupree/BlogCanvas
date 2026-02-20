#!/usr/bin/env tsx

/**
 * API Documentation Generator
 *
 * Automatically generates API documentation by scanning route files.
 * Outputs OpenAPI 3.0 compatible specification in JSON and Markdown formats.
 *
 * Usage:
 *   npx tsx scripts/generate-api-docs.ts
 *   npx tsx scripts/generate-api-docs.ts --format=markdown
 *   npx tsx scripts/generate-api-docs.ts --output=docs/api.json
 */

import * as fs from 'fs';
import * as path from 'path';

interface RouteInfo {
  path: string;
  methods: string[];
  file: string;
  description?: string;
  parameters?: RouteParameter[];
  auth?: boolean;
}

interface RouteParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'body';
  required: boolean;
  type: string;
  description?: string;
}

interface OpenAPISpec {
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
    securitySchemes: Record<string, any>;
  };
}

const API_BASE_DIR = path.join(process.cwd(), 'src/app/api');
const OUTPUT_DIR = path.join(process.cwd(), 'docs/api');

/**
 * Recursively find all route.ts files
 */
function findRouteFiles(dir: string): string[] {
  const routes: string[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        routes.push(...findRouteFiles(fullPath));
      } else if (entry.name === 'route.ts') {
        routes.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }

  return routes;
}

/**
 * Extract route information from file path and content
 */
function extractRouteInfo(filePath: string): RouteInfo | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Convert file path to API path
    const relativePath = path.relative(API_BASE_DIR, filePath);
    const apiPath = '/' + relativePath
      .replace(/\/route\.ts$/, '')
      .replace(/\[(\w+)\]/g, '{$1}'); // Convert [id] to {id}

    // Extract HTTP methods
    const methods: string[] = [];
    if (/export\s+async\s+function\s+GET/m.test(content)) methods.push('GET');
    if (/export\s+async\s+function\s+POST/m.test(content)) methods.push('POST');
    if (/export\s+async\s+function\s+PUT/m.test(content)) methods.push('PUT');
    if (/export\s+async\s+function\s+PATCH/m.test(content)) methods.push('PATCH');
    if (/export\s+async\s+function\s+DELETE/m.test(content)) methods.push('DELETE');

    if (methods.length === 0) {
      return null;
    }

    // Extract description from JSDoc comment at the top of the file
    const jsdocMatch = content.match(/\/\*\*\s*\n([^*]|\*[^/])*\*\//);
    let description = '';

    if (jsdocMatch) {
      description = jsdocMatch[0]
        .replace(/\/\*\*|\*\//g, '')
        .replace(/^\s*\*\s?/gm, '')
        .trim();
    }

    // Extract path parameters
    const parameters: RouteParameter[] = [];
    const pathParamMatches = apiPath.matchAll(/\{(\w+)\}/g);

    for (const match of pathParamMatches) {
      const paramName = match[1];
      parameters.push({
        name: paramName,
        in: 'path',
        required: true,
        type: 'string',
        description: `The ${paramName} identifier`
      });
    }

    // Check for authentication requirement
    const auth = /requireAuth|getUser|session/i.test(content);

    return {
      path: apiPath,
      methods,
      file: path.relative(process.cwd(), filePath),
      description: description || undefined,
      parameters: parameters.length > 0 ? parameters : undefined,
      auth
    };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return null;
  }
}

/**
 * Group routes by category based on path
 */
function categorizeRoutes(routes: RouteInfo[]): Record<string, RouteInfo[]> {
  const categories: Record<string, RouteInfo[]> = {};

  for (const route of routes) {
    const category = route.path.split('/')[1] || 'other';

    if (!categories[category]) {
      categories[category] = [];
    }

    categories[category].push(route);
  }

  return categories;
}

/**
 * Generate OpenAPI 3.0 specification
 */
function generateOpenAPISpec(routes: RouteInfo[]): OpenAPISpec {
  const spec: OpenAPISpec = {
    openapi: '3.0.0',
    info: {
      title: 'BlogCanvas API',
      version: '1.0.0',
      description: 'API documentation for BlogCanvas - A client-vendor relationship project management suite for bloggers.'
    },
    servers: [
      {
        url: 'http://localhost:4848/api',
        description: 'Development server'
      },
      {
        url: 'https://app.blogcanvas.com/api',
        description: 'Production server'
      }
    ],
    paths: {},
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  };

  // Build paths object
  for (const route of routes) {
    if (!spec.paths[route.path]) {
      spec.paths[route.path] = {};
    }

    for (const method of route.methods) {
      const methodLower = method.toLowerCase();

      spec.paths[route.path][methodLower] = {
        summary: route.description || `${method} ${route.path}`,
        description: route.description,
        parameters: route.parameters || [],
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object'
                }
              }
            }
          },
          400: {
            description: 'Bad request'
          },
          401: {
            description: 'Unauthorized'
          },
          404: {
            description: 'Not found'
          },
          500: {
            description: 'Internal server error'
          }
        }
      };

      if (route.auth) {
        spec.paths[route.path][methodLower].security = [
          { bearerAuth: [] }
        ];
      }
    }
  }

  return spec;
}

/**
 * Generate Markdown documentation
 */
function generateMarkdownDocs(routes: RouteInfo[]): string {
  const categories = categorizeRoutes(routes);

  let markdown = `# BlogCanvas API Documentation

**Version:** 1.0.0
**Generated:** ${new Date().toISOString()}

## Base URLs

- **Development:** http://localhost:4848/api
- **Production:** https://app.blogcanvas.com/api

## Authentication

Most endpoints require authentication via Bearer token (JWT).

Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

## Endpoints

`;

  // Sort categories alphabetically
  const sortedCategories = Object.keys(categories).sort();

  for (const category of sortedCategories) {
    markdown += `\n### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;

    // Sort routes within category
    const sortedRoutes = categories[category].sort((a, b) =>
      a.path.localeCompare(b.path)
    );

    for (const route of sortedRoutes) {
      markdown += `#### ${route.methods.join(', ')} ${route.path}\n\n`;

      if (route.description) {
        markdown += `${route.description}\n\n`;
      }

      if (route.auth) {
        markdown += `**Authentication:** Required\n\n`;
      }

      if (route.parameters && route.parameters.length > 0) {
        markdown += `**Parameters:**\n\n`;
        markdown += `| Name | Type | In | Required | Description |\n`;
        markdown += `|------|------|-----|----------|-------------|\n`;

        for (const param of route.parameters) {
          markdown += `| ${param.name} | ${param.type} | ${param.in} | ${param.required ? 'Yes' : 'No'} | ${param.description || '-'} |\n`;
        }

        markdown += `\n`;
      }

      markdown += `**File:** \`${route.file}\`\n\n`;
      markdown += `---\n\n`;
    }
  }

  markdown += `\n## Statistics\n\n`;
  markdown += `- **Total Endpoints:** ${routes.length}\n`;
  markdown += `- **Categories:** ${sortedCategories.length}\n`;

  const methodCounts: Record<string, number> = {};
  routes.forEach(route => {
    route.methods.forEach(method => {
      methodCounts[method] = (methodCounts[method] || 0) + 1;
    });
  });

  markdown += `- **Methods:**\n`;
  Object.entries(methodCounts).sort().forEach(([method, count]) => {
    markdown += `  - ${method}: ${count}\n`;
  });

  const authCount = routes.filter(r => r.auth).length;
  markdown += `- **Authenticated Endpoints:** ${authCount} (${Math.round(authCount / routes.length * 100)}%)\n`;

  return markdown;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Scanning API routes...\n');

  const routeFiles = findRouteFiles(API_BASE_DIR);
  console.log(`Found ${routeFiles.length} route files\n`);

  console.log('📝 Extracting route information...\n');
  const routes: RouteInfo[] = [];

  for (const file of routeFiles) {
    const routeInfo = extractRouteInfo(file);
    if (routeInfo) {
      routes.push(routeInfo);
    }
  }

  console.log(`Processed ${routes.length} routes\n`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Generate OpenAPI spec
  console.log('📄 Generating OpenAPI specification...');
  const openApiSpec = generateOpenAPISpec(routes);
  const openApiPath = path.join(OUTPUT_DIR, 'openapi.json');
  fs.writeFileSync(openApiPath, JSON.stringify(openApiSpec, null, 2));
  console.log(`✅ Written: ${openApiPath}\n`);

  // Generate Markdown docs
  console.log('📄 Generating Markdown documentation...');
  const markdown = generateMarkdownDocs(routes);
  const markdownPath = path.join(OUTPUT_DIR, 'API_REFERENCE.md');
  fs.writeFileSync(markdownPath, markdown);
  console.log(`✅ Written: ${markdownPath}\n`);

  // Generate summary
  console.log('📊 Summary:');
  console.log(`  - Total routes: ${routes.length}`);
  console.log(`  - Categories: ${Object.keys(categorizeRoutes(routes)).length}`);
  console.log(`  - Output directory: ${OUTPUT_DIR}`);
  console.log('\n✅ API documentation generated successfully!');
}

main().catch(error => {
  console.error('❌ Error generating API documentation:', error);
  process.exit(1);
});
