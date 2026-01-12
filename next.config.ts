import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Włącz standalone output dla Docker
  output: "standalone",
};

export default nextConfig;
