import "server-only";

import {
  githubListPostsMeta,
  isGitHubContentEnabled,
} from "@/lib/github-content";
import {
  filterAdminPosts,
  listLocalAdminPosts,
  sortAdminPosts,
  type AdminPostRow,
} from "@/lib/posts";

/**
 * Admin list source of truth: GitHub when token set, else local FS.
 */
export async function loadAdminPosts(opts: {
  filter?: "all" | "published" | "draft";
  q?: string;
  sort?: "updated" | "date" | "title";
}): Promise<{
  posts: AdminPostRow[];
  recent: AdminPostRow[];
  source: "github" | "local";
}> {
  let rows: AdminPostRow[] = [];
  let source: "github" | "local" = "local";

  if (isGitHubContentEnabled()) {
    try {
      const gh = await githubListPostsMeta();
      rows = gh.map((p) => ({
        slug: p.slug,
        title: p.title,
        description: p.description,
        date: p.date,
        tags: p.tags,
        cover: p.cover,
        draft: p.draft,
        pinned: p.pinned,
        series: p.series,
        readingTime: p.readingTime,
        updatedAt: p.updatedAt,
        folder: p.folder,
        relPath: p.relPath,
        content: p.content,
      }));
      source = "github";
    } catch {
      rows = listLocalAdminPosts();
      source = "local";
    }
  } else {
    rows = listLocalAdminPosts();
  }

  const filtered = filterAdminPosts(rows, {
    filter: opts.filter,
    q: opts.q,
  });
  const sorted = sortAdminPosts(filtered, opts.sort ?? "updated");
  const recent = sortAdminPosts(rows, "updated").slice(0, 10);

  return { posts: sorted, recent, source };
}
