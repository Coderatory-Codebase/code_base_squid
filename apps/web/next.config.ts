import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  distDir: process.env.NEXT_TEST_DIST_DIR ?? ".next",
  reactStrictMode: true,
  typedRoutes: true
};

export default nextConfig;
