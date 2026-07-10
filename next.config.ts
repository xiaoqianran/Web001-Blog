import type { NextConfig } from "next";

/**
 * - Vercel / `next start` (default): no special output
 * - Docker image: set OUTPUT_STANDALONE=true (see Dockerfile)
 *
 * Markdown under content/ is loaded via fs at request time. File tracing
 * may omit an empty posts dir (only .gitkeep), so include content explicitly.
 */
const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./content/**/*"],
  },
  ...(process.env.OUTPUT_STANDALONE === "true"
    ? { output: "standalone" as const }
    : {}),
};

export default nextConfig;
