import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dla Vercel nie używamy standalone output
  // output: "standalone", // Tylko dla Docker
};

export default nextConfig;
