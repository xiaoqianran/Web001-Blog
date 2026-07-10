/**
 * Canonical persistence helpers for Vercel + GitHub.
 *
 * Contract:
 * - Local filesystem is best-effort only (may be read-only on Vercel).
 * - When GITHUB_TOKEN is set, GitHub is the source of truth for reads/writes.
 * - Never let bare saveTreeToDisk / mkdirSync abort an action before GitHub commits.
 */

import fs from "fs";
import {
  ensureDocInTree,
  loadTreeFromDisk,
  saveTreeToDisk,
  type ContentTree,
} from "@/lib/content-tree";
import {
  githubReadPost,
  isGitHubContentEnabled,
} from "@/lib/github-content";
import { getPostBySlug, type Post } from "@/lib/posts";

/**
 * Write tree.json: try local disk (catch RO FS), then always attempt GitHub put
 * when content API is enabled.
 */
export async function persistTreeBestEffort(tree: ContentTree): Promise<void> {
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
      /* non-fatal — content write may already have succeeded */
    }
  }
}

/** mkdir that never throws (EROFS / EACCES on Vercel). */
export function bestEffortMkdir(dir: string): void {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    /* ignore */
  }
}

/**
 * Load a post for admin mutations: GitHub first when token set, else local.
 * Returns null if missing on both sides.
 */
export async function loadPostForAdmin(slug: string): Promise<Post | null> {
  if (isGitHubContentEnabled()) {
    try {
      const remote = await githubReadPost(slug);
      if (remote) return remote;
    } catch {
      /* fall through to local */
    }
  }
  try {
    return getPostBySlug(slug);
  } catch {
    return null;
  }
}

/** Ensure slug is in tree and persist best-effort (used after create/update). */
export async function registerDocInTreeBestEffort(
  slug: string,
  folder?: string,
): Promise<void> {
  try {
    let tree = loadTreeFromDisk();
    tree = ensureDocInTree(tree, slug, folder || null);
    await persistTreeBestEffort(tree);
  } catch {
    /* ignore */
  }
}
