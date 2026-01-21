import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empty turbopack config to satisfy Next.js 16
  turbopack: {},
  // Exclude scripts from build
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
