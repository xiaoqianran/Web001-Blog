"use server";

import { revalidatePath } from "next/cache";
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
    },
  };
}

function revalidatePostPaths(slug: string, previousSlug?: string) {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/admin");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/tags", "layout");
  revalidatePath("/series", "layout");
  revalidatePath("/archive");
  revalidatePath("/rss.xml");
  revalidatePath("/atom.xml");
  revalidatePath("/sitemap.xml");
  revalidatePath("/search");
  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/blog/${previousSlug}`);
  }
}

/** Prefer GitHub API whenever GITHUB_TOKEN is set. */
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
    // Prefer live GitHub state when available
    try {
      return await githubPostExists(slug);
    } catch {
      return postExists(slug);
    }
  }
  return postExists(slug);
}

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

  if (await slugTaken(input.slug)) {
    return {
      error: "该 slug 已存在",
      fieldErrors: { slug: "该 slug 已被使用，请换一个" },
    };
  }

  try {
    if (shouldUseGitBackend()) {
      await githubWritePost(input);
      revalidatePostPaths(input.slug);
      redirect(
        `/admin?created=${encodeURIComponent(input.slug)}&via=github`,
      );
    }
    writePost(input);
  } catch (err) {
    console.error("createPost failed:", err);
    return {
      error:
        err instanceof Error
          ? `保存失败：${err.message}`
          : "保存失败，请检查权限配置",
    };
  }

  revalidatePostPaths(input.slug);
  redirect(`/admin?created=${encodeURIComponent(input.slug)}`);
}

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

  // On GitHub backend, existence may lag local fs after a prior commit
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

  if (input.slug !== originalSlug && (await slugTaken(input.slug))) {
    return {
      error: "该 slug 已存在",
      fieldErrors: { slug: "该 slug 已被使用，请换一个" },
    };
  }

  try {
    if (shouldUseGitBackend()) {
      await githubRenamePost(originalSlug, input);
      revalidatePostPaths(input.slug, originalSlug);
      redirect(
        `/admin?updated=${encodeURIComponent(input.slug)}&via=github`,
      );
    }
    renamePost(originalSlug, input);
  } catch (err) {
    console.error("updatePost failed:", err);
    return {
      error:
        err instanceof Error
          ? `保存失败：${err.message}`
          : "保存失败，请检查权限配置",
    };
  }

  revalidatePostPaths(input.slug, originalSlug);
  redirect(`/admin?updated=${encodeURIComponent(input.slug)}`);
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

  try {
    if (shouldUseGitBackend()) {
      await githubDeletePost(slug);
      revalidatePostPaths(slug);
      redirect(`/admin?deleted=${encodeURIComponent(slug)}&via=github`);
    }
    getPostBySlug(slug);
    deletePostFile(slug);
  } catch (err) {
    console.error("deletePost failed:", err);
    redirect("/admin?error=delete");
  }

  revalidatePostPaths(slug);
  redirect(`/admin?deleted=${encodeURIComponent(slug)}`);
}
