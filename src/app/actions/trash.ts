"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  githubDeletePost,
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

export async function softDeletePostAction(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) redirect("/admin?error=notfound");

  const full = findPostFile(slug);
  if (!full) {
    // try github delete only
    if (isGitHubContentEnabled()) {
      await githubDeletePost(slug).catch(() => null);
    }
    redirect("/admin?error=notfound");
  }

  const post = getPostBySlug(slug);
  const folder = post.folder ?? "";
  softDeleteLocal(full, slug, folder);

  // remove from tree
  let tree = loadTreeFromDisk();
  tree = { ...tree, docs: tree.docs.filter((d) => d.slug !== slug) };
  saveTreeToDisk(tree);

  if (isGitHubContentEnabled()) {
    await githubDeletePost(slug).catch(() => null);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/trash");
  revalidatePath("/blog");
  revalidatePath("/kb");
  redirect("/admin/trash?deleted=1");
}

export async function restoreTrashAction(formData: FormData) {
  await requireAdmin();
  const filename = String(formData.get("filename") ?? "").trim();
  if (!filename) redirect("/admin/trash");
  const { slug, folder } = restoreFromTrashLocal(filename);
  let tree = loadTreeFromDisk();
  tree = ensureDocInTree(tree, slug, folder || null);
  saveTreeToDisk(tree);
  revalidatePath("/admin");
  revalidatePath("/admin/trash");
  redirect(`/admin/posts/${encodeURIComponent(slug)}/edit?saved=1`);
}

export async function permanentTrashAction(formData: FormData) {
  await requireAdmin();
  const filename = String(formData.get("filename") ?? "").trim();
  if (!filename) redirect("/admin/trash");
  permanentDeleteLocal(filename);
  revalidatePath("/admin/trash");
  redirect("/admin/trash?purged=1");
}
