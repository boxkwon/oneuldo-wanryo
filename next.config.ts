import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/oneuldo-wanryo",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
