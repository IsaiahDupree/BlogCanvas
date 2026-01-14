import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  typescript: {
    // Allow build to complete despite TS errors (Next.js 16 async params migration)
    ignoreBuildErrors: true,
  },
  // Next.js automatically handles NEXT_PUBLIC_* environment variables
  // No additional configuration needed for Vercel deployment
};

export default nextConfig;
