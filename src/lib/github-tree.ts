import "server-only";

import { parseTreeJson, type ContentTree } from "@/lib/content-tree";
import { getGitHubRepoInfo } from "@/lib/github-content";

const TREE_PATH = "content/tree.json";

function ghHeaders(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

/**
 * Read content/tree.json from GitHub (source of truth on Vercel).
 * Returns null if missing or invalid.
 */
export async function fetchTreeJson(): Promise<ContentTree | null> {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) return null;
  const { owner, repo, branch } = getGitHubRepoInfo();
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${TREE_PATH}?ref=${encodeURIComponent(branch)}`,
    {
      headers: ghHeaders(token),
      cache: "no-store",
    },
  );
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const data = (await res.json()) as { content?: string; encoding?: string };
  if (!data.content) return null;
  try {
    const raw = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString(
      "utf8",
    );
    return parseTreeJson(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function putTreeJson(tree: ContentTree): Promise<void> {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) return;
  const { owner, repo, branch } = getGitHubRepoInfo();
  const getRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${TREE_PATH}?ref=${encodeURIComponent(branch)}`,
    {
      headers: ghHeaders(token),
      cache: "no-store",
    },
  );
  let sha: string | undefined;
  if (getRes.ok) {
    const data = (await getRes.json()) as { sha?: string };
    sha = data.sha;
  }
  const body: Record<string, string> = {
    message: "content: update knowledge tree",
    content: Buffer.from(`${JSON.stringify(tree, null, 2)}\n`, "utf8").toString(
      "base64",
    ),
    branch,
  };
  if (sha) body.sha = sha;
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${TREE_PATH}`,
    {
      method: "PUT",
      headers: {
        ...ghHeaders(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`put tree.json failed: ${res.status} ${t.slice(0, 200)}`);
  }
}
