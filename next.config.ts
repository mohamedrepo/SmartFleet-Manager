import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Prevent Turbopack from hashing external module names (critical for Electron/standalone)
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
