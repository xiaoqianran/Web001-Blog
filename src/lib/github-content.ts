import "server-only";

import { serializePost, type PostInput } from "./posts";

type GhConfig = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
};

export function isGitHubContentEnabled(): boolean {
  return Boolean(process.env.GITHUB_TOKEN?.trim());
}

function getConfig(): GhConfig {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) {
    throw new Error("GITHUB_TOKEN is not configured");
  }

  const fromEnv =
    process.env.GITHUB_REPO?.trim() ||
    process.env.CONTENT_GITHUB_REPO?.trim() ||
    "";
  const ownerFromVercel = process.env.VERCEL_GIT_REPO_OWNER?.trim();
  const repoFromVercel = process.env.VERCEL_GIT_REPO_SLUG?.trim();

  let owner = "";
  let repo = "";
  if (fromEnv.includes("/")) {
    [owner, repo] = fromEnv.split("/", 2);
  } else if (ownerFromVercel && repoFromVercel) {
    owner = ownerFromVercel;
    repo = repoFromVercel;
  } else {
    owner = "xiaoqianran";
    repo = "Web001-Blog";
  }

  const branch =
    process.env.GITHUB_BRANCH?.trim() ||
    process.env.VERCEL_GIT_COMMIT_REF?.trim() ||
    "main";

  return { token, owner, repo, branch };
}

function postPath(slug: string): string {
  return `content/posts/${slug}.md`;
}

async function ghFetch(path: string, init?: RequestInit) {
  const { token } = getConfig();
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  return res;
}

async function getFileSha(path: string): Promise<string | null> {
  const { owner, repo, branch } = getConfig();
  const res = await ghFetch(
    `/repos/${owner}/${repo}/contents/${encodeURI(path)}?ref=${encodeURIComponent(branch)}`,
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub get file failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { sha?: string };
  return data.sha ?? null;
}

async function putFile(
  path: string,
  content: string,
  message: string,
  sha?: string | null,
): Promise<void> {
  const { owner, repo, branch } = getConfig();
  const body: Record<string, string> = {
    message,
    content: Buffer.from(content, "utf8").toString("base64"),
    branch,
  };
  if (sha) body.sha = sha;

  const res = await ghFetch(`/repos/${owner}/${repo}/contents/${encodeURI(path)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub put file failed (${res.status}): ${text}`);
  }
}

async function deleteFile(
  path: string,
  message: string,
  sha: string,
): Promise<void> {
  const { owner, repo, branch } = getConfig();
  const res = await ghFetch(`/repos/${owner}/${repo}/contents/${encodeURI(path)}`, {
    method: "DELETE",
    body: JSON.stringify({ message, sha, branch }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub delete file failed (${res.status}): ${text}`);
  }
}

export async function githubWritePost(input: PostInput): Promise<void> {
  const path = postPath(input.slug);
  const sha = await getFileSha(path);
  const content = serializePost(input);
  const message = sha
    ? `content: update post ${input.slug}`
    : `content: add post ${input.slug}`;
  await putFile(path, content, message, sha);
}

export async function githubDeletePost(slug: string): Promise<void> {
  const path = postPath(slug);
  const sha = await getFileSha(path);
  if (!sha) {
    throw new Error("Post not found on GitHub");
  }
  await deleteFile(path, `content: delete post ${slug}`, sha);
}

export async function githubRenamePost(
  oldSlug: string,
  input: PostInput,
): Promise<void> {
  if (oldSlug === input.slug) {
    await githubWritePost(input);
    return;
  }
  // Create/update new path, then remove old path
  await githubWritePost(input);
  const oldPath = postPath(oldSlug);
  const oldSha = await getFileSha(oldPath);
  if (oldSha) {
    await deleteFile(oldPath, `content: rename ${oldSlug} → ${input.slug}`, oldSha);
  }
}

export async function githubPostExists(slug: string): Promise<boolean> {
  const sha = await getFileSha(postPath(slug));
  return Boolean(sha);
}
