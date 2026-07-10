/**
 * Read-only GitHub commit history for a content path.
 * Soft-fail: returns [] on any error (UI falls back to deep-link).
 */

import { getGitHubRepoInfo, isGitHubContentEnabled } from "@/lib/github-content";

export type GitCommitRow = {
  sha: string;
  shortSha: string;
  message: string;
  date: string;
  url: string;
};

/**
 * Last N commits touching repoPath (e.g. content/posts/a.md).
 */
export async function fetchFileCommits(
  repoPath: string,
  limit = 5,
): Promise<GitCommitRow[]> {
  if (!isGitHubContentEnabled()) return [];
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) return [];
  try {
    const { owner, repo, branch } = getGitHubRepoInfo();
    const q = new URLSearchParams({
      path: repoPath,
      per_page: String(Math.min(Math.max(limit, 1), 10)),
      sha: branch,
    });
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?${q}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      sha?: string;
      html_url?: string;
      commit?: { message?: string; author?: { date?: string } };
    }[];
    if (!Array.isArray(data)) return [];
    return data.slice(0, limit).map((c) => {
      const msg = (c.commit?.message ?? "").split("\n")[0] || "(no message)";
      const sha = c.sha ?? "";
      return {
        sha,
        shortSha: sha.slice(0, 7),
        message: msg,
        date: c.commit?.author?.date ?? "",
        url: c.html_url ?? `https://github.com/${owner}/${repo}/commit/${sha}`,
      };
    });
  } catch {
    return [];
  }
}
