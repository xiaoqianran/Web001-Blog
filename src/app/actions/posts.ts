"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
    },
  };
}

function revalidatePostPaths(slug: string, previousSlug?: string) {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/admin");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/tags", "layout");
  revalidatePath("/rss.xml");
  revalidatePath("/sitemap.xml");
  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/blog/${previousSlug}`);
  }
}

export async function createPost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  await requireAdmin();

  const { input, fieldErrors } = parsePostForm(formData);
  if (fieldErrors || !input) {
    return { fieldErrors, error: "请检查表单后重试" };
  }

  if (postExists(input.slug)) {
    return {
      error: "该 slug 已存在",
      fieldErrors: { slug: "该 slug 已被使用，请换一个" },
    };
  }

  try {
    writePost(input);
  } catch (err) {
    console.error("createPost failed:", err);
    return { error: "保存失败，请检查服务器写入权限" };
  }

  revalidatePostPaths(input.slug);
  redirect(`/admin?created=${encodeURIComponent(input.slug)}`);
}

export async function updatePost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  await requireAdmin();

  const originalSlug = String(formData.get("originalSlug") ?? "").trim().toLowerCase();
  if (!originalSlug || !isValidSlug(originalSlug) || !postExists(originalSlug)) {
    return { error: "原文章不存在" };
  }

  const { input, fieldErrors } = parsePostForm(formData);
  if (fieldErrors || !input) {
    return { fieldErrors, error: "请检查表单后重试" };
  }

  if (input.slug !== originalSlug && postExists(input.slug)) {
    return {
      error: "该 slug 已存在",
      fieldErrors: { slug: "该 slug 已被使用，请换一个" },
    };
  }

  try {
    renamePost(originalSlug, input);
  } catch (err) {
    console.error("updatePost failed:", err);
    return { error: "保存失败，请检查服务器写入权限" };
  }

  revalidatePostPaths(input.slug, originalSlug);
  redirect(`/admin?updated=${encodeURIComponent(input.slug)}`);
}

export async function deletePost(formData: FormData) {
  await requireAdmin();

  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  if (!slug || !isValidSlug(slug) || !postExists(slug)) {
    redirect("/admin?error=notfound");
  }

  try {
    // Touch file once so missing posts fail clearly
    getPostBySlug(slug);
    deletePostFile(slug);
  } catch (err) {
    console.error("deletePost failed:", err);
    redirect("/admin?error=delete");
  }

  revalidatePostPaths(slug);
  redirect(`/admin?deleted=${encodeURIComponent(slug)}`);
}
