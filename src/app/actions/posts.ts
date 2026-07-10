"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import {
  githubDeletePost,
  githubPostExists,
  githubRenamePost,
  githubWritePost,
  isGitHubContentEnabled,
} from "@/lib/github-content";
import { getSession } from "@/lib/session";
import {
  deletePostFile,
  getPostBySlug,
  isValidSlug,
  postExists,
  renamePost,
  writePost,
  type PostInput,
} from "@/lib/posts";

export type PostFormState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof PostInput | "form", string>>;
  notice?: string;
} | undefined;

async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    redirect("/login?from=/admin");
  }
  return session;
}

function parseTags(raw: string): string[] {
  return raw
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((tag, i, arr) => arr.findIndex((t) => t.toLowerCase() === tag.toLowerCase()) === i);
}

type FieldErrors = Partial<Record<keyof PostInput | "form", string>>;

function parsePostForm(formData: FormData): {
  input?: PostInput;
  fieldErrors?: FieldErrors;
} {
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const content = String(formData.get("content") ?? "");
  const cover = String(formData.get("cover") ?? "").trim();
  const series = String(formData.get("series") ?? "").trim();
  // folder: present as "" for root, or path; omit only if field missing (preserve path)
  const folderRaw = formData.get("folder");
  const folder =
    folderRaw === null
      ? undefined
      : String(folderRaw).replace(/^\/+|\/+$/g, "");
  const draft = formData.get("draft") === "on" || formData.get("draft") === "true";
  const pinned =
    formData.get("pinned") === "on" || formData.get("pinned") === "true";

  const fieldErrors: FieldErrors = {};

  if (!title) fieldErrors.title = "请填写标题";
  if (!slug) fieldErrors.slug = "请填写 slug";
  else if (!isValidSlug(slug)) {
    fieldErrors.slug = "仅允许小写字母、数字与连字符，如 my-first-post";
  }
  if (!date || Number.isNaN(Date.parse(date))) {
    fieldErrors.date = "请填写有效日期";
  }
  if (!content.trim()) fieldErrors.content = "请填写正文";

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return {
    input: {
      slug,
      title,
      description,
      date: date.slice(0, 10),
      tags,
      content,
      draft,
      pinned,
      cover: cover || undefined,
      series: series || undefined,
      // undefined = preserve existing path on update; "" or path = explicit
      folder,
    },
  };
}

function revalidatePostPaths(slug: string, previousSlug?: string) {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/admin");
  revalidatePath(`/blog/${slug}`);
  revalidatePath(`/admin/posts/${slug}/edit`);
  revalidatePath("/tags", "layout");
  revalidatePath("/series", "layout");
  revalidatePath("/archive");
  revalidatePath("/rss.xml");
  revalidatePath("/atom.xml");
  revalidatePath("/sitemap.xml");
  revalidatePath("/search");
  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/blog/${previousSlug}`);
    revalidatePath(`/admin/posts/${previousSlug}/edit`);
  }
}

function shouldUseGitBackend(): boolean {
  return isGitHubContentEnabled();
}

function missingGitHubTokenOnVercel(): PostFormState {
  if (process.env.VERCEL && !isGitHubContentEnabled()) {
    return {
      error:
        "Vercel 文件系统只读。请在 Vercel 环境变量中配置 GITHUB_TOKEN（需 repo 写权限），保存文章将提交到 GitHub 并自动重新部署。",
    };
  }
  return undefined;
}

async function slugTaken(slug: string): Promise<boolean> {
  if (shouldUseGitBackend()) {
    try {
      return await githubPostExists(slug);
    } catch {
      return postExists(slug);
    }
  }
  return postExists(slug);
}

function rethrowNextControlFlow(err: unknown): void {
  if (isRedirectError(err)) throw err;
  if (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest?: unknown }).digest === "string" &&
    String((err as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  ) {
    throw err;
  }
  if (err instanceof Error && err.message === "NEXT_REDIRECT") {
    throw err;
  }
}

function editUrl(slug: string, opts?: { viaGithub?: boolean; created?: boolean }) {
  const q = new URLSearchParams();
  q.set("saved", "1");
  if (opts?.viaGithub) q.set("via", "github");
  if (opts?.created) q.set("created", "1");
  return `/admin/posts/${encodeURIComponent(slug)}/edit?${q.toString()}`;
}

async function writeOrOverwrite(input: PostInput, existingSlug?: string) {
  if (shouldUseGitBackend()) {
    if (existingSlug && existingSlug !== input.slug) {
      await githubRenamePost(existingSlug, input);
    } else if (existingSlug) {
      // Same slug update
      await githubRenamePost(existingSlug, input);
    } else {
      await githubWritePost(input);
    }
    return true;
  }
  if (existingSlug && existingSlug !== input.slug) {
    renamePost(existingSlug, input);
  } else {
    writePost(input);
  }
  return false;
}

/**
 * Create or re-save. If the slug already exists (e.g. Ctrl+S again on 新建),
 * overwrite instead of failing with "slug 已存在".
 * After first create, jump to edit page so further saves use updatePost.
 */
export async function createPost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  await requireAdmin();
  const blocked = missingGitHubTokenOnVercel();
  if (blocked) return blocked;

  const { input, fieldErrors } = parsePostForm(formData);
  if (fieldErrors || !input) {
    return { fieldErrors, error: "请检查表单后重试" };
  }

  const exists = await slugTaken(input.slug);
  let viaGithub = false;

  try {
    if (exists) {
      // Re-save: treat as update of the same slug (multi Ctrl+S while still on 新建)
      viaGithub = await writeOrOverwrite(input, input.slug);
    } else {
      viaGithub = await writeOrOverwrite(input);
    }
  } catch (err) {
    rethrowNextControlFlow(err);
    console.error("createPost failed:", err);
    return {
      error:
        err instanceof Error
          ? `保存失败：${err.message}`
          : "保存失败，请检查权限配置",
    };
  }

  revalidatePostPaths(input.slug);
  const { registerDocInTreeBestEffort } = await import(
    "@/lib/content-persist"
  );
  await registerDocInTreeBestEffort(input.slug, input.folder);
  // Land on edit page so subsequent Ctrl+S are normal updates
  redirect(
    editUrl(input.slug, {
      viaGithub,
      created: !exists,
    }),
  );
}

/**
 * Update stays on the edit page and returns a notice (no redirect),
 * so authors can Ctrl+S repeatedly while drafting.
 */
export async function updatePost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  await requireAdmin();
  const blocked = missingGitHubTokenOnVercel();
  if (blocked) return blocked;

  const originalSlug = String(formData.get("originalSlug") ?? "")
    .trim()
    .toLowerCase();
  if (!originalSlug || !isValidSlug(originalSlug)) {
    return { error: "原文章不存在" };
  }

  if (!shouldUseGitBackend() && !postExists(originalSlug)) {
    return { error: "原文章不存在" };
  }
  if (shouldUseGitBackend()) {
    const exists =
      (await githubPostExists(originalSlug).catch(() => false)) ||
      postExists(originalSlug);
    if (!exists) return { error: "原文章不存在" };
  }

  const { input, fieldErrors } = parsePostForm(formData);
  if (fieldErrors || !input) {
    return { fieldErrors, error: "请检查表单后重试" };
  }

  // Renaming to a *different* slug that already exists is still an error
  if (input.slug !== originalSlug && (await slugTaken(input.slug))) {
    return {
      error: "该 slug 已存在",
      fieldErrors: { slug: "该 slug 已被使用，请换一个" },
    };
  }

  let viaGithub = false;
  try {
    viaGithub = await writeOrOverwrite(input, originalSlug);
  } catch (err) {
    rethrowNextControlFlow(err);
    console.error("updatePost failed:", err);
    return {
      error:
        err instanceof Error
          ? `保存失败：${err.message}`
          : "保存失败，请检查权限配置",
    };
  }

  revalidatePostPaths(input.slug, originalSlug);
  const { registerDocInTreeBestEffort } = await import(
    "@/lib/content-persist"
  );
  await registerDocInTreeBestEffort(input.slug, input.folder);

  // If slug changed, move browser to the new edit URL once
  if (input.slug !== originalSlug) {
    redirect(
      editUrl(input.slug, { viaGithub }),
    );
  }

  const when = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  return {
    notice: viaGithub
      ? `已保存 ${when}（已提交 GitHub，部署约 1 分钟后前台更新）`
      : `已保存 ${when}`,
  };
}

export async function deletePost(formData: FormData) {
  await requireAdmin();

  if (process.env.VERCEL && !isGitHubContentEnabled()) {
    redirect("/admin?error=readonly");
  }

  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  if (!slug || !isValidSlug(slug)) {
    redirect("/admin?error=notfound");
  }

  let viaGithub = false;
  try {
    if (shouldUseGitBackend()) {
      await githubDeletePost(slug);
      viaGithub = true;
    } else {
      getPostBySlug(slug);
      deletePostFile(slug);
    }
  } catch (err) {
    rethrowNextControlFlow(err);
    console.error("deletePost failed:", err);
    redirect("/admin?error=delete");
  }

  revalidatePostPaths(slug);
  redirect(
    viaGithub
      ? `/admin?deleted=${encodeURIComponent(slug)}&via=github`
      : `/admin?deleted=${encodeURIComponent(slug)}`,
  );
}
