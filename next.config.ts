import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't use standalone on Vercel — it handles output automatically
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
