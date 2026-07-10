"use server";

import { getSession } from "@/lib/session";
import {
  githubUploadAsset,
  isGitHubContentEnabled,
  localUploadAsset,
} from "@/lib/github-content";

export type UploadResult =
  | { ok: true; path: string }
  | { ok: false; error: string };

const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

export async function uploadImage(formData: FormData): Promise<UploadResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "未登录" };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "未选择文件" };
  }
  if (!ALLOWED.has(file.type)) {
    return { ok: false, error: "仅支持 PNG / JPEG / GIF / WebP" };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "图片需小于 2MB" };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name || "image.png";

  try {
    if (isGitHubContentEnabled()) {
      const path = await githubUploadAsset(name, buf);
      return { ok: true, path };
    }
    if (process.env.VERCEL) {
      return {
        ok: false,
        error: "Vercel 上请配置 GITHUB_TOKEN 后才能上传图片",
      };
    }
    const path = await localUploadAsset(name, buf);
    return { ok: true, path };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "上传失败",
    };
  }
}
