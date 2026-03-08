import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Fail the build on TypeScript errors — assignment requirement
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;