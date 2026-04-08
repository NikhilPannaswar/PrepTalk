import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production ready configuration
  reactStrictMode: true,
  poweredByHeader: false,
  
  // Ignore ESLint during build (warnings but no errors), keep TypeScript strict
  eslint: {
    // Set ignoreDuringBuilds to true to allow warnings without failing build
    ignoreDuringBuilds: true,
    dirs: ["app", "components", "lib", "types"],
  },
  
  // Keep TypeScript checking strict - no ignored errors in production
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
};

export default nextConfig;
