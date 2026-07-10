/**
 * Soft-delete helpers: move markdown into content/trash/ with metadata.
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const root = process.cwd();
const postsDir = path.join(root, "content/posts");
const trashDir = path.join(postsDir, "trash");

export type TrashItem = {
  slug: string;
  title: string;
  deletedAt: string;
  originalFolder: string;
  filename: string;
};

export function listTrash(): TrashItem[] {
  if (!fs.existsSync(trashDir)) return [];
  return fs
    .readdirSync(trashDir)
    .filter((f) => f.endsWith(".md"))
    .map((filename) => {
      const raw = fs.readFileSync(path.join(trashDir, filename), "utf8");
      const { data } = matter(raw);
      const slug = filename.replace(/\.md$/, "").replace(/__\d+$/, "");
      return {
        slug: typeof data.slug === "string" ? data.slug : slug,
        title: typeof data.title === "string" ? data.title : slug,
        deletedAt:
          typeof data.deletedAt === "string"
            ? data.deletedAt
            : new Date().toISOString(),
        originalFolder:
          typeof data.originalFolder === "string" ? data.originalFolder : "",
        filename,
      };
    })
    .sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
}

export function softDeleteLocal(
  absPath: string,
  slug: string,
  folder: string,
): string {
  fs.mkdirSync(trashDir, { recursive: true });
  const raw = fs.readFileSync(absPath, "utf8");
  const { data, content } = matter(raw);
  const deletedAt = new Date().toISOString();
  const next = matter.stringify(content, {
    ...data,
    slug,
    deletedAt,
    originalFolder: folder,
  });
  const filename = `${slug}__${Date.now()}.md`;
  const dest = path.join(trashDir, filename);
  fs.writeFileSync(dest, next, "utf8");
  fs.unlinkSync(absPath);
  return filename;
}

export function restoreFromTrashLocal(filename: string): {
  slug: string;
  folder: string;
} {
  const src = path.join(trashDir, filename);
  if (!fs.existsSync(src)) throw new Error("回收站文件不存在");
  const raw = fs.readFileSync(src, "utf8");
  const { data, content } = matter(raw);
  const slug =
    typeof data.slug === "string"
      ? data.slug
      : filename.replace(/\.md$/, "").replace(/__\d+$/, "");
  const folder =
    typeof data.originalFolder === "string" ? data.originalFolder : "";
  delete data.deletedAt;
  delete data.originalFolder;
  delete data.slug;
  const body = matter.stringify(content, data);
  const destDir = folder
    ? path.join(postsDir, ...folder.split("/"))
    : postsDir;
  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(path.join(destDir, `${slug}.md`), body, "utf8");
  fs.unlinkSync(src);
  return { slug, folder };
}

export function permanentDeleteLocal(filename: string): void {
  const src = path.join(trashDir, filename);
  if (fs.existsSync(src)) fs.unlinkSync(src);
}

export function githubHistoryUrl(
  owner: string,
  repo: string,
  relPath: string,
): string {
  return `https://github.com/${owner}/${repo}/commits/main/${relPath}`;
}
