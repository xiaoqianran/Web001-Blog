import type { NextConfig } from "next";

const isPages =
  process.env.GITHUB_PAGES === "true" ||
  process.env.STATIC_EXPORT === "true" ||
  process.env.NEXT_OUTPUT === "export";

/**
 * Project Pages site: https://<user>.github.io/<repo>/
 * Override with BASE_PATH="" for a custom domain / user site.
 */
function resolveBasePath(): string {
  if (!isPages) return "";
  if (process.env.BASE_PATH !== undefined) {
    const raw = process.env.BASE_PATH.trim();
    if (!raw || raw === "/") return "";
    return raw.startsWith("/") ? raw.replace(/\/$/, "") : `/${raw.replace(/\/$/, "")}`;
  }
  const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
  if (!repo || repo.endsWith(".github.io")) return "";
  return `/${repo}`;
}

const basePath = resolveBasePath();

const nextConfig: NextConfig = {
  // Docker / Node server keeps standalone; GitHub Pages needs a full static export.
  output: isPages ? "export" : "standalone",
  ...(isPages
    ? {
        basePath,
        assetPrefix: basePath || undefined,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
  env: {
    // Expose to client components if needed
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_STATIC_EXPORT: isPages ? "true" : "false",
  },
};

export default nextConfig;
