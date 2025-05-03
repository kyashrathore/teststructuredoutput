import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["esbuild"],
  experimental: {
    urlImports: ["https://cdn.jsdelivr.net/npm/zod@3.23.8/lib/index.mjs"],
  },
};

export default nextConfig;
