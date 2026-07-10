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

export async function softDeletePostAction(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) redirect("/admin?error=notfound");

  // Remove from tree index first
  let tree = loadTreeFromDisk();
  tree = { ...tree, docs: tree.docs.filter((d) => d.slug !== slug) };
  saveTreeToDisk(tree);

  if (isGitHubContentEnabled()) {
    try {
      await githubSoftDeletePost(slug);
    } catch {
      // Fall back to local if only local exists
      const full = findPostFile(slug);
      if (!full) redirect("/admin?error=notfound");
      const post = getPostBySlug(slug);
      softDeleteLocal(full, slug, post.folder ?? "");
    }
  } else {
    const full = findPostFile(slug);
    if (!full) redirect("/admin?error=notfound");
    const post = getPostBySlug(slug);
    softDeleteLocal(full, slug, post.folder ?? "");
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

  let tree = loadTreeFromDisk();
  tree = ensureDocInTree(tree, slug, folder || null);
  saveTreeToDisk(tree);
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
  permanentDeleteLocal(filename);
  revalidatePath("/admin/trash");
  redirect("/admin/trash?purged=1");
}
