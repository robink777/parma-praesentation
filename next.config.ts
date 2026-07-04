import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.onoffice.de",
      },
      {
        protocol: "https",
        hostname: "www.parmaimmobilien.de",
      },
    ],
  },
};

export default nextConfig;
