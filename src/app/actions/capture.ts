"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  githubPostExists,
  githubWritePost,
  isGitHubContentEnabled,
} from "@/lib/github-content";
import { registerDocInTreeBestEffort } from "@/lib/content-persist";
import {
  buildLabCapturePost,
  type LabCaptureKind,
} from "@/lib/lab-capture";
import { postExists, writePost, type PostInput } from "@/lib/posts";
import { getSession } from "@/lib/session";

async function slugTaken(slug: string): Promise<boolean> {
  if (isGitHubContentEnabled()) {
    try {
      return await githubPostExists(slug);
    } catch {
      return postExists(slug);
    }
  }
  return postExists(slug);
}

/**
 * Lab → knowledge-base draft note.
 * Form fields: kind, title, summary, sourceUrl, idHint, folder, returnTo,
 * optional extraArxiv / extraPdf.
 */
export async function captureLabNoteAction(formData: FormData) {
  const returnTo = String(formData.get("returnTo") ?? "/lab/papers").trim() ||
    "/lab/papers";
  const session = await getSession();
  if (!session) {
    redirect(`/login?from=${encodeURIComponent(returnTo)}`);
  }

  if (process.env.VERCEL && !isGitHubContentEnabled()) {
    redirect(
      `${returnTo}${returnTo.includes("?") ? "&" : "?"}captureError=no-github`,
    );
  }

  const kind = String(formData.get("kind") ?? "feed") as LabCaptureKind;
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim();
  const idHint = String(formData.get("idHint") ?? "").trim();
  const folder = String(formData.get("folder") ?? "")
    .trim()
    .replace(/^\/+|\/+$/g, "");
  const authors = String(formData.get("authors") ?? "").trim();
  const extraArxiv = String(formData.get("extraArxiv") ?? "").trim();
  const extraPdf = String(formData.get("extraPdf") ?? "").trim();

  if (!title || !sourceUrl) {
    redirect(
      `${returnTo}${returnTo.includes("?") ? "&" : "?"}captureError=missing`,
    );
  }

  const extraLinks: { label: string; url: string }[] = [];
  if (extraArxiv) extraLinks.push({ label: "arXiv", url: extraArxiv });
  if (extraPdf) extraLinks.push({ label: "PDF", url: extraPdf });

  const built = buildLabCapturePost({
    kind: kind === "paper" ? "paper" : "feed",
    title,
    summary,
    sourceUrl,
    idHint: idHint || undefined,
    folder: folder || undefined,
    authors: authors || undefined,
    extraLinks,
  });

  // Unique slug against GitHub/local
  const base = built.slug;
  let slug = base;
  if (await slugTaken(slug)) {
    for (let i = 2; i < 1000; i++) {
      const candidate = `${base}-${i}`.slice(0, 80);
      if (!(await slugTaken(candidate))) {
        slug = candidate;
        break;
      }
    }
  }
  const input: PostInput = { ...built, slug };

  try {
    if (isGitHubContentEnabled()) {
      await githubWritePost(input);
    } else {
      writePost(input);
    }
  } catch (err) {
    console.error("captureLabNote failed:", err);
    redirect(
      `${returnTo}${returnTo.includes("?") ? "&" : "?"}captureError=write`,
    );
  }

  await registerDocInTreeBestEffort(input.slug, input.folder);
  revalidatePath("/admin");
  revalidatePath("/blog");
  revalidatePath("/kb");
  revalidatePath(`/admin/posts/${input.slug}/edit`);

  const q = new URLSearchParams({ saved: "1", created: "1" });
  if (isGitHubContentEnabled()) q.set("via", "github");
  redirect(`/admin/posts/${encodeURIComponent(input.slug)}/edit?${q}`);
}
