import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
  serverExternalPackages: ["@prisma/client", "rss-parser"],
};

export default nextConfig;
