import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["esbuild"],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: { // Add this block
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
