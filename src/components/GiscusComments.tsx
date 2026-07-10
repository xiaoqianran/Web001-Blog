"use client";

import { useEffect, useRef } from "react";

/**
 * Optional Giscus comments. Renders only when public env vars are set:
 * - NEXT_PUBLIC_GISCUS_REPO (owner/repo)
 * - NEXT_PUBLIC_GISCUS_REPO_ID
 * - NEXT_PUBLIC_GISCUS_CATEGORY_ID
 *
 * Setup: https://giscus.app
 */
export function GiscusComments() {
  const ref = useRef<HTMLDivElement>(null);
  const repo = process.env.NEXT_PUBLIC_GISCUS_REPO;
  const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
  const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;
  const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY ?? "Announcements";

  useEffect(() => {
    if (!repo || !repoId || !categoryId || !ref.current) return;

    // Avoid duplicate widgets on re-render
    ref.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", repo);
    script.setAttribute("data-repo-id", repoId);
    script.setAttribute("data-category", category);
    script.setAttribute("data-category-id", categoryId);
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", "preferred_color_scheme");
    script.setAttribute("data-lang", "zh-CN");
    script.setAttribute("data-loading", "lazy");

    ref.current.appendChild(script);
  }, [repo, repoId, categoryId, category]);

  if (!repo || !repoId || !categoryId) {
    return null;
  }

  return (
    <section className="mt-16 border-t border-zinc-200 pt-10 dark:border-zinc-800">
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        评论
      </h2>
      <div ref={ref} className="giscus" />
    </section>
  );
}

export function isGiscusConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_GISCUS_REPO &&
      process.env.NEXT_PUBLIC_GISCUS_REPO_ID &&
      process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID,
  );
}
