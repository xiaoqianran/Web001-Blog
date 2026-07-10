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

/** Resolve folder from existing repo path when form omits folder (undefined). */
function folderFromRepoPath(repoPath: string): string {
  const under = repoPath.replace(/^content\/posts\//, "");
  if (!under.includes("/")) return "";
  return under.split("/").slice(0, -1).join("/");
}

export async function githubFindPostRepoPath(
  slug: string,
): Promise<string | null> {
  const paths = await githubListPostRepoPaths();
  const needle = `${slug}.md`;
  return (
    paths.find(
      (p) =>
        p === `content/posts/${needle}` ||
        (p.endsWith(`/${needle}`) && !p.includes("/trash/")),
    ) ?? null
  );
}

/**
 * Write post to GitHub. When input.folder is undefined, keep existing path
 * (never silently rewrite nested posts to root).
 */
export async function githubWritePost(input: PostInput): Promise<void> {
  const found = await githubFindPostRepoPath(input.slug);
  let folder: string;
  if (input.folder !== undefined) {
    folder = String(input.folder).replace(/^\/+|\/+$/g, "");
  } else if (found) {
    folder = folderFromRepoPath(found);
  } else {
    folder = "";
  }

  const targetPath = postPath(input.slug, folder);
  let usePath = targetPath;
  let useSha = await getFileSha(targetPath);
  // Prefer existing blob path when still same location
  if (found && found === targetPath) {
    usePath = found;
    useSha = (await getFileSha(found)) ?? useSha;
  } else if (!useSha && found && found !== targetPath) {
    // Will write new path; old path deleted by rename/move caller
    usePath = targetPath;
    useSha = null;
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

export async function githubDeletePost(slug: string): Promise<void> {
  const found = (await githubFindPostRepoPath(slug)) ?? postPath(slug);
  const sha = await getFileSha(found);
  if (!sha) {
    throw new Error("Post not found on GitHub");
  }
  await deleteFile(found, `content: delete post ${slug}`, sha);
}

/**
 * Soft-delete on GitHub: move to content/posts/trash/{slug}__ts.md
 * Returns trash filename.
 */
export async function githubSoftDeletePost(
  slug: string,
): Promise<{ filename: string; folder: string }> {
  const found = await githubFindPostRepoPath(slug);
  if (!found) throw new Error("Post not found on GitHub");
  const post = await githubReadPost(slug);
  if (!post) throw new Error("Post not found on GitHub");
  const folder = folderFromRepoPath(found);
  const filename = `${slug}__${Date.now()}.md`;
  const trashPath = `content/posts/trash/${filename}`;
  const body = serializePost({
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: String(post.date).slice(0, 10),
    tags: post.tags,
    content: post.content,
    draft: post.draft,
    cover: post.cover,
    pinned: post.pinned,
    series: post.series,
    folder: folder || undefined,
  });
  // Embed trash metadata via gray-matter fields in a wrapper
  const { default: matter } = await import("gray-matter");
  const parsed = matter(body);
  const withTrash = matter.stringify(parsed.content, {
    ...parsed.data,
    slug,
    deletedAt: new Date().toISOString(),
    originalFolder: folder,
  });
  await putFile(trashPath, withTrash, `content: trash post ${slug}`, null);
  const sha = await getFileSha(found);
  if (sha) {
    await deleteFile(found, `content: soft-delete ${slug}`, sha);
  }
  return { filename, folder };
}

export async function githubRestoreTrash(filename: string): Promise<{
  slug: string;
  folder: string;
}> {
  const trashPath = `content/posts/trash/${filename}`;
  const sha = await getFileSha(trashPath);
  if (!sha) throw new Error("回收站文件不存在");
  const { owner, repo, branch } = getConfig();
  const res = await ghFetch(
    `/repos/${owner}/${repo}/contents/${encodeURI(trashPath)}?ref=${encodeURIComponent(branch)}`,
  );
  if (!res.ok) throw new Error("读取回收站失败");
  const data = (await res.json()) as { content?: string };
  if (!data.content) throw new Error("回收站文件为空");
  const raw = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString(
    "utf8",
  );
  const { default: matter } = await import("gray-matter");
  const { data: fm, content } = matter(raw);
  const slug =
    typeof fm.slug === "string"
      ? fm.slug
      : filename.replace(/\.md$/, "").replace(/__\d+$/, "");
  const folder =
    typeof fm.originalFolder === "string" ? fm.originalFolder : "";
  delete fm.deletedAt;
  delete fm.originalFolder;
  delete fm.slug;
  const restored = matter.stringify(content, fm);
  const dest = postPath(slug, folder);
  await putFile(dest, restored, `content: restore post ${slug}`, null);
  await deleteFile(trashPath, `content: remove trash ${filename}`, sha);
  return { slug, folder };
}

export async function githubPermanentDeleteTrash(
  filename: string,
): Promise<void> {
  const trashPath = `content/posts/trash/${filename}`;
  const sha = await getFileSha(trashPath);
  if (!sha) return;
  await deleteFile(trashPath, `content: purge trash ${filename}`, sha);
}

export async function githubListTrashFilenames(): Promise<string[]> {
  // listPostRepoPaths excludes trash — list contents of trash dir
  const { owner, repo, branch } = getConfig();
  const res = await ghFetch(
    `/repos/${owner}/${repo}/contents/${encodeURI("content/posts/trash")}?ref=${encodeURIComponent(branch)}`,
  );
  if (res.status === 404) return [];
  if (!res.ok) return [];
  const data = (await res.json()) as { name?: string; type?: string }[] | { message?: string };
  if (!Array.isArray(data)) return [];
  return data
    .filter((n) => n.type === "file" && n.name?.endsWith(".md"))
    .map((n) => n.name as string);
}

export async function githubRenamePost(
  oldSlug: string,
  input: PostInput,
): Promise<void> {
  const oldPath = await githubFindPostRepoPath(oldSlug);
  // Resolve destination folder without defaulting nested → root
  let folder: string;
  if (input.folder !== undefined) {
    folder = String(input.folder).replace(/^\/+|\/+$/g, "");
  } else if (oldPath) {
    folder = folderFromRepoPath(oldPath);
  } else {
    folder = "";
  }
  const resolved: PostInput = { ...input, folder: folder || undefined };
  const newPath = postPath(input.slug, folder);

  if (oldSlug === input.slug) {
    if (oldPath && oldPath !== newPath) {
      // explicit move: write new, delete old
      await githubWritePost(resolved);
      const oldSha = await getFileSha(oldPath);
      if (oldSha) {
        await deleteFile(oldPath, `content: move ${oldSlug}`, oldSha);
      }
      return;
    }
    // in-place update — preserve path
    await githubWritePost(resolved);
    return;
  }

  await githubWritePost(resolved);
  const removePath = oldPath ?? postPath(oldSlug);
  if (removePath !== newPath) {
    const oldSha = await getFileSha(removePath);
    if (oldSha) {
      await deleteFile(
        removePath,
        `content: rename ${oldSlug} → ${input.slug}`,
        oldSha,
      );
    }
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

