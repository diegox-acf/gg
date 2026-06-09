import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@gg/ui"],
  images: {
    // Product images are served by the catalog's local image store.
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "8080", pathname: "/images/**" },
    ],
  },
};

export default nextConfig;
