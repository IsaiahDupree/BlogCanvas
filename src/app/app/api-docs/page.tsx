'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOpenAPISpec();
  }, []);

  const fetchOpenAPISpec = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/docs/openapi.json');
      if (!response.ok) {
        throw new Error('Failed to fetch OpenAPI specification');
      }
      const data = await response.json();
      setSpec(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading API Documentation</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchOpenAPISpec}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-white">BlogCanvas API Documentation</h1>
          <p className="mt-2 text-blue-100">
            Interactive API documentation and playground
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Links */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Authentication</h3>
            <p className="text-sm text-blue-700">
              All API endpoints require authentication using Supabase JWT tokens.
              Include the token in the Authorization header as <code className="bg-blue-100 px-1 rounded">Bearer YOUR_TOKEN</code>
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Base URL</h3>
            <p className="text-sm text-green-700">
              <code className="bg-green-100 px-2 py-1 rounded block">
                {spec?.servers?.[0]?.url || 'http://localhost:4848'}
              </code>
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-2">Response Format</h3>
            <p className="text-sm text-purple-700">
              All responses follow a standard format with <code className="bg-purple-100 px-1 rounded">success</code> boolean and data or error fields.
            </p>
          </div>
        </div>

        {/* Code Examples Section */}
        <div className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Start Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* cURL Example */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">cURL</h3>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded-md text-xs overflow-x-auto">
{`curl -X GET \\
  '${spec?.servers?.[0]?.url}/api/clients' \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -H 'Content-Type: application/json'`}
              </pre>
            </div>

            {/* Node.js Example */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Node.js</h3>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded-md text-xs overflow-x-auto">
{`const response = await fetch(
  '${spec?.servers?.[0]?.url}/api/clients',
  {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json'
    }
  }
);
const data = await response.json();`}
              </pre>
            </div>

            {/* Python Example */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Python</h3>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded-md text-xs overflow-x-auto">
{`import requests

response = requests.get(
    '${spec?.servers?.[0]?.url}/api/clients',
    headers={
        'Authorization': 'Bearer YOUR_TOKEN',
        'Content-Type': 'application/json'
    }
)
data = response.json()`}
              </pre>
            </div>
          </div>
        </div>

        {/* Swagger UI */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <SwaggerUI
            spec={spec}
            docExpansion="list"
            defaultModelsExpandDepth={1}
            defaultModelExpandDepth={1}
          />
        </div>
      </div>
    </div>
  );
}
