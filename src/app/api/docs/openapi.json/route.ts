import { NextResponse } from 'next/server';
import { generateOpenAPISpec } from '@/lib/api-docs/openapi-generator';
import { join } from 'path';

// GET /api/docs/openapi.json - Get OpenAPI specification
export async function GET() {
  try {
    const apiDir = join(process.cwd(), 'src', 'app', 'api');
    const spec = generateOpenAPISpec(apiDir);

    return NextResponse.json(spec);
  } catch (error: any) {
    console.error('Error generating OpenAPI spec:', error);
    return NextResponse.json(
      { error: 'Failed to generate OpenAPI specification' },
      { status: 500 }
    );
  }
}
