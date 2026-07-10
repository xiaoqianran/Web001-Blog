"use server";

import { revalidatePath } from "next/cache";
import { isGitHubContentEnabled } from "@/lib/github-content";
import {
  bestEffortMkdir,
  loadPostForAdmin,
  persistTreeBestEffort,
} from "@/lib/content-persist";
import {
  addFolderToTree,
  deleteFolderFromTree,
  loadTreeFromDisk,
  moveDocInTree,
  renameFolderInTree,
  reorderDoc,
} from "@/lib/content-tree";
import { findPostFile, writePost } from "@/lib/posts";
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

export async function createFolderAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const parentIdRaw = String(formData.get("parentId") ?? "").trim();
  const parentId = parentIdRaw === "" ? null : parentIdRaw;
  if (!name) return;
  let tree = loadTreeFromDisk();
  tree = addFolderToTree(tree, name, parentId);
  // physical dir is local-only best-effort; tree.json goes to GitHub
  const id = tree.folders.find(
    (f) => f.name === name && f.parentId === parentId,
  )?.id;
  if (id) {
    const dir = path.join(process.cwd(), "content/posts", ...id.split("/"));
    bestEffortMkdir(dir);
  }
  await persistTreeBestEffort(tree);
  revalidateTree();
}

export async function renameFolderAction(formData: FormData) {
  await requireAdmin();
  const folderId = String(formData.get("folderId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!folderId || !name) return;
  let tree = loadTreeFromDisk();
  tree = renameFolderInTree(tree, folderId, name);
  await persistTreeBestEffort(tree);
  revalidateTree();
}

export async function deleteFolderAction(formData: FormData) {
  await requireAdmin();
  const folderId = String(formData.get("folderId") ?? "").trim();
  if (!folderId) return;
  let tree = loadTreeFromDisk();
  tree = deleteFolderFromTree(tree, folderId);
  await persistTreeBestEffort(tree);
  revalidateTree();
}

export async function movePostAction(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "").trim();
  const folderIdRaw = String(formData.get("folderId") ?? "").trim();
  const folderId =
    folderIdRaw === "" || folderIdRaw === "__root__" ? null : folderIdRaw;
  if (!slug) return;

  const post = await loadPostForAdmin(slug);
  if (!post) return;

  const folder = folderId ?? "";
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

  // Content move first (GitHub source of truth), then tree index
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
      if (
        path.resolve(oldPath) !== path.resolve(newPath) &&
        fs.existsSync(oldPath)
      ) {
        try {
          fs.unlinkSync(oldPath);
        } catch {
          /* ignore */
        }
      }
    }
  }

  let tree = loadTreeFromDisk();
  tree = moveDocInTree(tree, slug, folderId);
  await persistTreeBestEffort(tree);
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
  await persistTreeBestEffort(tree);
  revalidateTree();
}

export async function syncTreeFromPostsAction() {
  await requireAdmin();
  const { listPostRelPaths } = await import("@/lib/posts");
  const { buildTreeFromRelPaths } = await import("@/lib/content-tree");
  const tree = buildTreeFromRelPaths(listPostRelPaths());
  await persistTreeBestEffort(tree);
  revalidateTree();
}
