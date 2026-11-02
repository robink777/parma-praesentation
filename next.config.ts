import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Vercels Hobby-Tarif enthält nur 5.000 Bildoptimierungen pro Monat, danach antwortet
    // /_next/image mit 402. Bilder werden deshalb bewusst unverändert ausgeliefert.
    unoptimized: true,
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
