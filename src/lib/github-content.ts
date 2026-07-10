import "server-only";

import {
  parsePostMarkdown,
  serializePost,
  type Post,
  type PostInput,
} from "./posts";

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

function postPath(slug: string, folder = ""): string {
  const parts = ["content", "posts", ...folder.split("/").filter(Boolean), `${slug}.md`];
  return parts.join("/");
}

export function getGitHubRepoInfo(): { owner: string; repo: string; branch: string } {
  const { owner, repo, branch } = getConfig();
  return { owner, repo, branch };
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

/** List markdown paths under content/posts on GitHub (posix, relative to repo root). */
export async function githubListPostRepoPaths(): Promise<string[]> {
  const { owner, repo, branch } = getConfig();
  const res = await ghFetch(
    `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub tree failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    tree?: { path?: string; type?: string }[];
  };
  return (data.tree ?? [])
    .filter(
      (n) =>
        n.type === "blob" &&
        typeof n.path === "string" &&
        n.path.startsWith("content/posts/") &&
        n.path.endsWith(".md") &&
        !n.path.includes("/trash/"),
    )
    .map((n) => n.path as string);
}

export async function githubWritePost(input: PostInput): Promise<void> {
  const folder = (input.folder ?? "").replace(/^\/+|\/+$/g, "");
  const path = postPath(input.slug, folder);
  const sha = await getFileSha(path);
  // If path unknown, try locate existing slug path for update
  let usePath = path;
  let useSha = sha;
  if (!useSha) {
    const found = await githubFindPostRepoPath(input.slug);
    if (found) {
      usePath = found;
      useSha = await getFileSha(found);
    }
  }
  const payload: PostInput = {
    ...input,
    updatedAt: input.updatedAt || new Date().toISOString(),
    folder: folder || undefined,
  };
  const content = serializePost(payload);
  const message = useSha
    ? `content: update post ${input.slug}`
    : `content: add post ${input.slug}`;
  await putFile(usePath, content, message, useSha);
}

async function githubFindPostRepoPath(slug: string): Promise<string | null> {
  const paths = await githubListPostRepoPaths();
  const needle = `${slug}.md`;
  return (
    paths.find((p) => p === `content/posts/${needle}` || p.endsWith(`/${needle}`)) ??
    null
  );
}

export async function githubDeletePost(slug: string): Promise<void> {
  const found = (await githubFindPostRepoPath(slug)) ?? postPath(slug);
  const sha = await getFileSha(found);
  if (!sha) {
    throw new Error("Post not found on GitHub");
  }
  await deleteFile(found, `content: delete post ${slug}`, sha);
}

export async function githubRenamePost(
  oldSlug: string,
  input: PostInput,
): Promise<void> {
  const folder = (input.folder ?? "").replace(/^\/+|\/+$/g, "");
  const newPath = postPath(input.slug, folder);
  if (oldSlug === input.slug) {
    // same slug — may still move folder
    const oldPath = await githubFindPostRepoPath(oldSlug);
    if (oldPath && oldPath !== newPath) {
      await githubWritePost(input);
      const oldSha = await getFileSha(oldPath);
      if (oldSha) {
        await deleteFile(oldPath, `content: move ${oldSlug}`, oldSha);
      }
      return;
    }
    await githubWritePost(input);
    return;
  }
  await githubWritePost(input);
  const oldPath = (await githubFindPostRepoPath(oldSlug)) ?? postPath(oldSlug);
  const oldSha = await getFileSha(oldPath);
  if (oldSha) {
    await deleteFile(oldPath, `content: rename ${oldSlug} → ${input.slug}`, oldSha);
  }
}

export async function githubPostExists(slug: string): Promise<boolean> {
  const found = await githubFindPostRepoPath(slug);
  if (found) return true;
  const sha = await getFileSha(postPath(slug));
  return Boolean(sha);
}

/**
 * Read latest post markdown from GitHub (source of truth on Vercel).
 */
export async function githubReadPost(slug: string): Promise<Post | null> {
  const filePath =
    (await githubFindPostRepoPath(slug).catch(() => null)) ?? postPath(slug);
  const { owner, repo, branch } = getConfig();
  const res = await ghFetch(
    `/repos/${owner}/${repo}/contents/${encodeURI(filePath)}?ref=${encodeURIComponent(branch)}`,
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub read post failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { content?: string; encoding?: string };
  if (!data.content) return null;
  const raw = Buffer.from(
    data.content.replace(/\n/g, ""),
    "base64",
  ).toString("utf8");
  const under = filePath.replace(/^content\/posts\//, "");
  const folder =
    under.includes("/") ? under.split("/").slice(0, -1).join("/") : "";
  return parsePostMarkdown(slug, raw, {
    folder: folder || undefined,
    relPath: under,
  });
}

/** Admin list: all posts with meta from GitHub (parallel reads). */
export async function githubListPostsMeta(): Promise<
  (Post & { content: string })[]
> {
  const paths = await githubListPostRepoPaths();
  const { owner, repo, branch } = getConfig();
  const posts = await Promise.all(
    paths.map(async (filePath) => {
      const res = await ghFetch(
        `/repos/${owner}/${repo}/contents/${encodeURI(filePath)}?ref=${encodeURIComponent(branch)}`,
      );
      if (!res.ok) return null;
      const data = (await res.json()) as { content?: string };
      if (!data.content) return null;
      const raw = Buffer.from(
        data.content.replace(/\n/g, ""),
        "base64",
      ).toString("utf8");
      const under = filePath.replace(/^content\/posts\//, "");
      const slug = under.split("/").pop()!.replace(/\.md$/, "");
      const folder =
        under.includes("/") ? under.split("/").slice(0, -1).join("/") : "";
      return parsePostMarkdown(slug, raw, {
        folder: folder || undefined,
        relPath: under,
      });
    }),
  );
  return posts.filter(Boolean) as Post[];
}

/**
 * Upload binary asset to public/uploads/ via GitHub Contents API.
 * Returns site-relative path e.g. /uploads/foo.png
 */
export async function githubUploadAsset(
  filename: string,
  bytes: Buffer,
): Promise<string> {
  const safe = filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  const stamp = Date.now();
  const path = `public/uploads/${stamp}-${safe}`;
  const publicPath = `/uploads/${stamp}-${safe}`;
  const { owner, repo, branch } = getConfig();
  const body = {
    message: `content: upload ${safe}`,
    content: bytes.toString("base64"),
    branch,
  };
  const res = await ghFetch(
    `/repos/${owner}/${repo}/contents/${encodeURI(path)}`,
    { method: "PUT", body: JSON.stringify(body) },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub upload failed (${res.status}): ${text}`);
  }
  return publicPath;
}

/** Local filesystem upload (dev / Docker). */
export async function localUploadAsset(
  filename: string,
  bytes: Buffer,
): Promise<string> {
  const fs = await import("fs");
  const pathMod = await import("path");
  const safe = filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  const stamp = Date.now();
  const dir = pathMod.join(process.cwd(), "public/uploads");
  fs.mkdirSync(dir, { recursive: true });
  const name = `${stamp}-${safe}`;
  fs.writeFileSync(pathMod.join(dir, name), bytes);
  return `/uploads/${name}`;
}

