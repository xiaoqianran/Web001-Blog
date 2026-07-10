"use server";

import { revalidatePath } from "next/cache";
import { isGitHubContentEnabled } from "@/lib/github-content";
import {
  addFolderToTree,
  deleteFolderFromTree,
  ensureDocInTree,
  loadTreeFromDisk,
  moveDocInTree,
  renameFolderInTree,
  reorderDoc,
  saveTreeToDisk,
  type ContentTree,
} from "@/lib/content-tree";
import { findPostFile, getPostBySlug, writePost } from "@/lib/posts";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import fs from "fs";
import path from "path";

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login?from=/admin");
  return session;
}

function revalidateTree() {
  revalidatePath("/admin");
  revalidatePath("/blog");
  revalidatePath("/kb");
}

async function persistTree(tree: ContentTree) {
  saveTreeToDisk(tree);
  if (isGitHubContentEnabled()) {
    const { putTreeJson } = await import("@/lib/github-tree");
    await putTreeJson(tree);
  }
}

export async function createFolderAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const parentIdRaw = String(formData.get("parentId") ?? "").trim();
  const parentId = parentIdRaw === "" ? null : parentIdRaw;
  if (!name) return;
  let tree = loadTreeFromDisk();
  tree = addFolderToTree(tree, name, parentId);
  // create physical dir locally
  const id = tree.folders.find(
    (f) => f.name === name && f.parentId === parentId,
  )?.id;
  if (id) {
    const dir = path.join(process.cwd(), "content/posts", ...id.split("/"));
    fs.mkdirSync(dir, { recursive: true });
  }
  await persistTree(tree);
  revalidateTree();
}

export async function renameFolderAction(formData: FormData) {
  await requireAdmin();
  const folderId = String(formData.get("folderId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!folderId || !name) return;
  let tree = loadTreeFromDisk();
  tree = renameFolderInTree(tree, folderId, name);
  await persistTree(tree);
  revalidateTree();
}

export async function deleteFolderAction(formData: FormData) {
  await requireAdmin();
  const folderId = String(formData.get("folderId") ?? "").trim();
  if (!folderId) return;
  let tree = loadTreeFromDisk();
  tree = deleteFolderFromTree(tree, folderId);
  await persistTree(tree);
  revalidateTree();
}

export async function movePostAction(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "").trim();
  const folderIdRaw = String(formData.get("folderId") ?? "").trim();
  const folderId = folderIdRaw === "" || folderIdRaw === "__root__" ? null : folderIdRaw;
  if (!slug) return;

  const post = getPostBySlug(slug);
  const folder = folderId ?? "";
  // rewrite file path
  const input = {
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
  };

  if (isGitHubContentEnabled()) {
    const { githubRenamePost } = await import("@/lib/github-content");
    await githubRenamePost(slug, input);
  } else {
    const oldPath = findPostFile(slug);
    writePost(input);
    if (oldPath) {
      const newPath = path.join(
        process.cwd(),
        "content/posts",
        ...(folder ? folder.split("/") : []),
        `${slug}.md`,
      );
      if (path.resolve(oldPath) !== path.resolve(newPath) && fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
  }

  let tree = loadTreeFromDisk();
  tree = moveDocInTree(tree, slug, folderId);
  await persistTree(tree);
  revalidateTree();
  revalidatePath(`/blog/${slug}`);
  revalidatePath(`/admin/posts/${slug}/edit`);
}

export async function reorderPostAction(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "").trim();
  const direction = String(formData.get("direction") ?? "") as "up" | "down";
  if (!slug || (direction !== "up" && direction !== "down")) return;
  let tree = loadTreeFromDisk();
  tree = reorderDoc(tree, slug, direction);
  await persistTree(tree);
  revalidateTree();
}

export async function syncTreeFromPostsAction() {
  await requireAdmin();
  const { listPostRelPaths } = await import("@/lib/posts");
  const { buildTreeFromRelPaths } = await import("@/lib/content-tree");
  const tree = buildTreeFromRelPaths(listPostRelPaths());
  await persistTree(tree);
  revalidateTree();
}

// ensure doc registered when saving posts
export function registerDocInTree(slug: string, folder?: string) {
  let tree = loadTreeFromDisk();
  tree = ensureDocInTree(tree, slug, folder || null);
  saveTreeToDisk(tree);
}
