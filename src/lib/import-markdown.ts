import matter from "gray-matter";

/** Keep this module free of other local imports so Node smoke tests can load it. */

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export type ImportedMarkdown = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string;
  content: string;
  draft: boolean;
  cover: string;
  pinned: boolean;
  series: string;
  /** Human-readable notes about what was inferred */
  notes: string[];
};

function asString(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    // gray-matter / js-yaml may parse bare dates as Date
    return v.toISOString().slice(0, 10);
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

function asBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "yes" || s === "1";
  }
  return Boolean(v);
}

function asTags(v: unknown): string {
  if (Array.isArray(v)) {
    return v
      .map((t) => asString(t))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof v === "string") {
    return v
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean)
      .join(", ");
  }
  return "";
}

function normalizeDate(raw: string): string {
  if (!raw) return new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

function slugFromFilename(fileName?: string): string {
  if (!fileName) return "";
  const base = fileName
    .replace(/\\/g, "/")
    .split("/")
    .pop()!
    .replace(/\.(md|markdown|mdx)$/i, "");
  const slug = slugifyTitle(base);
  return isValidSlug(slug) ? slug : "";
}

function titleFromBody(body: string): string {
  const m = body.match(/^\s*#\s+(.+?)\s*$/m);
  return m?.[1]?.trim() ?? "";
}

/**
 * Parse a local .md file (optional YAML frontmatter) into admin form fields.
 * Client-safe: no filesystem.
 */
export function parseMarkdownImport(
  raw: string,
  fileName?: string,
): ImportedMarkdown {
  const notes: string[] = [];
  const text = String(raw ?? "").replace(/^\uFEFF/, "");
  const { data, content } = matter(text);
  const body = content.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

  let title = asString(data.title);
  if (!title) {
    title = titleFromBody(body);
    if (title) notes.push("标题取自正文一级标题");
  }
  if (!title && fileName) {
    title = fileName.replace(/\.(md|markdown|mdx)$/i, "");
    notes.push("标题取自文件名");
  }
  if (!title) title = "未命名文章";

  let slug = asString(data.slug).toLowerCase();
  if (slug && !isValidSlug(slug)) {
    notes.push(`frontmatter slug「${slug}」无效，已改写`);
    slug = slugifyTitle(slug);
  }
  if (!slug) {
    slug = slugFromFilename(fileName);
    if (slug) notes.push("slug 取自文件名");
  }
  if (!slug) {
    slug = slugifyTitle(title);
    notes.push("slug 由标题生成");
  }
  if (!isValidSlug(slug)) {
    slug = `post-${Date.now().toString(36)}`;
    notes.push("无法生成合法 slug，已使用临时值");
  }

  const description = asString(data.description) || asString(data.summary);
  const date = normalizeDate(asString(data.date));
  const tags = asTags(data.tags);
  const cover = asString(data.cover) || asString(data.image);
  const series = asString(data.series);
  const draft = asBool(data.draft);
  const pinned = asBool(data.pinned);

  if (!description) notes.push("未找到摘要，可稍后填写");

  return {
    slug,
    title,
    description,
    date,
    tags,
    content: body.trimStart(),
    draft,
    cover,
    pinned,
    series,
    notes,
  };
}

/** Validate a browser File is an acceptable markdown upload. */
export function isMarkdownFile(file: { name: string; type?: string }): boolean {
  const name = file.name.toLowerCase();
  if (
    name.endsWith(".md") ||
    name.endsWith(".markdown") ||
    name.endsWith(".mdx")
  ) {
    return true;
  }
  const type = (file.type || "").toLowerCase();
  return (
    type === "text/markdown" ||
    type === "text/x-markdown" ||
    type === "text/plain"
  );
}
