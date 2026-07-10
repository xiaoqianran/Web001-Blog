import "server-only";

import type { ContentTree } from "@/lib/content-tree";
import { getGitHubRepoInfo } from "@/lib/github-content";

export async function putTreeJson(tree: ContentTree): Promise<void> {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) return;
  const { owner, repo, branch } = getGitHubRepoInfo();
  const path = "content/tree.json";
  const getRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
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
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`put tree.json failed: ${res.status} ${t.slice(0, 200)}`);
  }
}
