import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint errors during build
  },
  images: {
    domains: ["lh3.googleusercontent.com"], //  allow Google profile images
  },
};

export default nextConfig;
