"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  githubPermanentDeleteTrash,
  githubRestoreTrash,
  githubSoftDeletePost,
  isGitHubContentEnabled,
} from "@/lib/github-content";
import {
  ensureDocInTree,
  loadTreeFromDisk,
  saveTreeToDisk,
  type ContentTree,
} from "@/lib/content-tree";
import { findPostFile, getPostBySlug } from "@/lib/posts";
import {
  permanentDeleteLocal,
  restoreFromTrashLocal,
  softDeleteLocal,
} from "@/lib/trash";
import { getSession } from "@/lib/session";

async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login?from=/admin");
}

function revalidateAll() {
  revalidatePath("/admin");
  revalidatePath("/admin/trash");
  revalidatePath("/blog");
  revalidatePath("/kb");
}

/**
 * Best-effort tree update. Never throws: Vercel RO FS must not block soft-delete.
 * When GitHub is enabled, also put tree.json so the index stays consistent.
 */
async function persistTreeBestEffort(tree: ContentTree): Promise<void> {
  try {
    saveTreeToDisk(tree);
  } catch {
    /* Vercel read-only or missing volume */
  }
  if (isGitHubContentEnabled()) {
    try {
      const { putTreeJson } = await import("@/lib/github-tree");
      await putTreeJson(tree);
    } catch {
      /* non-fatal */
    }
  }
}

export async function softDeletePostAction(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) redirect("/admin?error=notfound");

  // 1) Soft-delete content FIRST (GitHub is source of truth on Vercel).
  //    Tree disk writes must not run before this — RO FS would abort the action.
  let deleted = false;
  if (isGitHubContentEnabled()) {
    try {
      await githubSoftDeletePost(slug);
      deleted = true;
    } catch {
      // Fall back to local if only local exists (dev / missing remote blob)
      const full = findPostFile(slug);
      if (full) {
        const post = getPostBySlug(slug);
        softDeleteLocal(full, slug, post.folder ?? "");
        deleted = true;
      }
    }
  } else {
    const full = findPostFile(slug);
    if (!full) redirect("/admin?error=notfound");
    const post = getPostBySlug(slug);
    softDeleteLocal(full, slug, post.folder ?? "");
    deleted = true;
  }

  if (!deleted) redirect("/admin?error=notfound");

  // 2) Drop slug from tree index (best-effort; never blocks soft-delete)
  try {
    let tree = loadTreeFromDisk();
    tree = { ...tree, docs: tree.docs.filter((d) => d.slug !== slug) };
    await persistTreeBestEffort(tree);
  } catch {
    /* ignore */
  }

  revalidateAll();
  redirect("/admin/trash?deleted=1");
}

export async function restoreTrashAction(formData: FormData) {
  await requireAdmin();
  const filename = String(formData.get("filename") ?? "").trim();
  if (!filename) redirect("/admin/trash");

  let slug = "";
  let folder = "";

  if (isGitHubContentEnabled()) {
    try {
      const r = await githubRestoreTrash(filename);
      slug = r.slug;
      folder = r.folder;
      // also restore local copy if present in trash
      try {
        restoreFromTrashLocal(filename);
      } catch {
        /* local may already be empty on Vercel */
      }
    } catch {
      const r = restoreFromTrashLocal(filename);
      slug = r.slug;
      folder = r.folder;
    }
  } else {
    const r = restoreFromTrashLocal(filename);
    slug = r.slug;
    folder = r.folder;
  }

  try {
    let tree = loadTreeFromDisk();
    tree = ensureDocInTree(tree, slug, folder || null);
    await persistTreeBestEffort(tree);
  } catch {
    /* ignore */
  }

  revalidateAll();
  redirect(`/admin/posts/${encodeURIComponent(slug)}/edit?saved=1`);
}

export async function permanentTrashAction(formData: FormData) {
  await requireAdmin();
  const filename = String(formData.get("filename") ?? "").trim();
  if (!filename) redirect("/admin/trash");

  if (isGitHubContentEnabled()) {
    await githubPermanentDeleteTrash(filename).catch(() => null);
  }
  try {
    permanentDeleteLocal(filename);
  } catch {
    /* RO FS */
  }
  revalidatePath("/admin/trash");
  redirect("/admin/trash?purged=1");
}
