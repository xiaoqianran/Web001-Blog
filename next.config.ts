import type { NextConfig } from "next";

/**
 * - Vercel / `next start` (default): no special output
 * - Docker image: set OUTPUT_STANDALONE=true (see Dockerfile)
 */
const nextConfig: NextConfig = {
  ...(process.env.OUTPUT_STANDALONE === "true"
    ? { output: "standalone" as const }
    : {}),
};

export default nextConfig;
