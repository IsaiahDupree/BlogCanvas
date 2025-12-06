import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Next.js automatically handles NEXT_PUBLIC_* environment variables
  // No additional configuration needed for Vercel deployment
};

export default nextConfig;
