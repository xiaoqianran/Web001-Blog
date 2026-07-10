import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Root, Element } from "hast";
import readingTime from "reading-time";

const postsDirectory = path.join(process.cwd(), "content/posts");

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  cover?: string;
  draft: boolean;
  pinned: boolean;
  series?: string;
  readingTime: string;
  /** ISO time of last author save (frontmatter updatedAt) */
  updatedAt?: string;
  /** Relative dir under content/posts, "" = root (phase B) */
  folder?: string;
  /** Relative path from content/posts e.g. notes/a.md */
  relPath?: string;
};

export type PostInput = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  content: string;
  draft?: boolean;
  cover?: string;
  pinned?: boolean;
  series?: string;
  updatedAt?: string;
  /** Relative folder under content/posts (no leading/trailing slash) */
  folder?: string;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export function getPostPath(slug: string, folder = ""): string {
  const dir = folder
    ? path.join(postsDirectory, ...folder.split("/").filter(Boolean))
    : postsDirectory;
  return path.join(dir, `${slug}.md`);
}

/** Relative path from content/posts, posix style */
export function getPostRelPath(slug: string, folder = ""): string {
  const parts = [...folder.split("/").filter(Boolean), `${slug}.md`];
  return parts.join("/");
}

export function serializePost(input: PostInput): string {
  const body = input.content.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const data: Record<string, unknown> = {
    title: input.title,
    description: input.description,
    date: input.date,
    tags: input.tags,
    updatedAt: input.updatedAt || new Date().toISOString(),
  };
  if (input.draft) data.draft = true;
  if (input.pinned) data.pinned = true;
  if (input.cover?.trim()) data.cover = input.cover.trim();
  if (input.series?.trim()) data.series = input.series.trim();
  return matter.stringify(body.endsWith("\n") ? body : `${body}\n`, data);
}

export function writePost(input: PostInput): void {
  ensurePostsDir();
  if (!isValidSlug(input.slug)) {
    throw new Error("Invalid slug");
  }
  const folder = (input.folder ?? "").replace(/^\/+|\/+$/g, "");
  const full = getPostPath(input.slug, folder);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  const withTime = {
    ...input,
    updatedAt: input.updatedAt || new Date().toISOString(),
    folder: folder || undefined,
  };
  fs.writeFileSync(full, serializePost(withTime), "utf8");
}

/** Find absolute path of slug by scanning tree (root or nested). */
export function findPostFile(slug: string): string | null {
  if (!slug || !fs.existsSync(postsDirectory)) return null;
  const root = path.join(postsDirectory, `${slug}.md`);
  if (fs.existsSync(root)) return root;
  const stack = [postsDirectory];
  while (stack.length) {
    const dir = stack.pop()!;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) {
        if (name === "trash") continue;
        stack.push(full);
      } else if (name === `${slug}.md`) {
        return full;
      }
    }
  }
  return null;
}

export function deletePostFile(slug: string): void {
  if (!isValidSlug(slug)) {
    throw new Error("Invalid slug");
  }
  const fullPath = findPostFile(slug) ?? getPostPath(slug);
  if (!fs.existsSync(fullPath)) {
    throw new Error("Post not found");
  }
  fs.unlinkSync(fullPath);
}

export function renamePost(oldSlug: string, input: PostInput): void {
  if (oldSlug !== input.slug && postExists(input.slug)) {
    throw new Error("Slug already exists");
  }
  const oldPath = findPostFile(oldSlug);
  // Preserve folder when updating same post unless input.folder set
  if (input.folder === undefined && oldPath) {
    const rel = path.relative(postsDirectory, path.dirname(oldPath));
    input = {
      ...input,
      folder: rel === "" ? "" : rel.split(path.sep).join("/"),
    };
  }
  writePost(input);
  if (oldSlug !== input.slug && oldPath && fs.existsSync(oldPath)) {
    fs.unlinkSync(oldPath);
  } else if (oldSlug === input.slug && oldPath) {
    const next = getPostPath(input.slug, input.folder ?? "");
    if (path.resolve(oldPath) !== path.resolve(next) && fs.existsSync(oldPath)) {
      // moved folder
      if (fs.existsSync(next)) fs.unlinkSync(oldPath);
    }
  }
}

export function postExists(slug: string): boolean {
  return findPostFile(slug) !== null;
}

export type TocItem = {
  id: string;
  text: string;
  level: number;
};

export type Post = PostMeta & {
  content: string;
  contentHtml: string;
  toc: TocItem[];
};

function ensurePostsDir() {
  if (!fs.existsSync(postsDirectory)) {
    fs.mkdirSync(postsDirectory, { recursive: true });
  }
}

function toText(node: Element["children"][number]): string {
  if (node.type === "text") return node.value;
  if (node.type === "element") {
    return node.children.map(toText).join("");
  }
  return "";
}

function rehypeCollectToc(toc: TocItem[]) {
  return () => (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "h2" && node.tagName !== "h3") return;
      const id = node.properties?.id;
      if (typeof id !== "string") return;
      const text = node.children.map(toText).join("").trim();
      if (!text) return;
      toc.push({
        id,
        text,
        level: node.tagName === "h2" ? 2 : 3,
      });
    });
  };
}

function toMeta(post: Post): PostMeta {
  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: post.date,
    tags: post.tags,
    cover: post.cover,
    draft: post.draft,
    pinned: post.pinned,
    series: post.series,
    readingTime: post.readingTime,
    updatedAt: post.updatedAt,
    folder: post.folder,
    relPath: post.relPath,
  };
}

/** List all .md files under content/posts (recursive, skip trash). */
export function listPostRelPaths(): string[] {
  if (!fs.existsSync(postsDirectory)) return [];
  const out: string[] = [];
  const walk = (dir: string, prefix: string) => {
    for (const name of fs.readdirSync(dir)) {
      if (name === "trash" || name.startsWith(".")) continue;
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      const rel = prefix ? `${prefix}/${name}` : name;
      if (st.isDirectory()) walk(full, rel);
      else if (name.endsWith(".md")) out.push(rel.replace(/\\/g, "/"));
    }
  };
  walk(postsDirectory, "");
  return out.sort();
}

export function getPostSlugs(): string[] {
  return listPostRelPaths().map((rel) =>
    path.basename(rel, ".md"),
  );
}

/** Parse raw markdown (+ frontmatter) into Post (no filesystem). */
export function parsePostMarkdown(
  slug: string,
  fileContents: string,
  opts?: { folder?: string; relPath?: string },
): Post {
  const { data, content } = matter(fileContents);
  const stats = readingTime(content);
  const dateRaw = data.date;
  let date = new Date().toISOString();
  if (typeof dateRaw === "string") date = dateRaw;
  else if (dateRaw instanceof Date && !Number.isNaN(dateRaw.getTime())) {
    date = dateRaw.toISOString();
  }
  let updatedAt: string | undefined;
  const u = data.updatedAt;
  if (typeof u === "string") updatedAt = u;
  else if (u instanceof Date && !Number.isNaN(u.getTime())) {
    updatedAt = u.toISOString();
  }

  return {
    slug,
    title: data.title ?? slug,
    description: data.description ?? "",
    date,
    tags: Array.isArray(data.tags) ? data.tags : [],
    cover: typeof data.cover === "string" ? data.cover : undefined,
    draft: Boolean(data.draft),
    pinned: Boolean(data.pinned),
    series:
      typeof data.series === "string" && data.series.trim()
        ? data.series.trim()
        : undefined,
    readingTime: stats.text,
    updatedAt,
    folder: opts?.folder,
    relPath: opts?.relPath,
    content,
    contentHtml: "",
    toc: [],
  };
}

export function getPostBySlug(slug: string): Post {
  const fullPath = findPostFile(slug);
  if (!fullPath) {
    throw new Error(`Post not found: ${slug}`);
  }
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const rel = path.relative(postsDirectory, fullPath).split(path.sep).join("/");
  const folder = path.dirname(rel) === "." ? "" : path.dirname(rel).split(path.sep).join("/");
  return parsePostMarkdown(slug, fileContents, {
    folder: folder || undefined,
    relPath: rel,
  });
}

export async function getPostWithHtml(slug: string): Promise<Post> {
  const post = getPostBySlug(slug);
  const toc: TocItem[] = [];

  const processed = await remark()
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeCollectToc(toc))
    .use(rehypeHighlight, { detect: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(post.content);

  return {
    ...post,
    contentHtml: processed.toString(),
    toc,
  };
}

type ListOptions = {
  /** When true, include draft posts (admin). Default: published only. */
  includeDrafts?: boolean;
};

export function getAllPosts(options: ListOptions = {}): PostMeta[] {
  let posts = listPostRelPaths().map((rel) => {
    const full = path.join(postsDirectory, ...rel.split("/"));
    const slug = path.basename(rel, ".md");
    const folder =
      path.dirname(rel) === "."
        ? ""
        : path.dirname(rel).split(path.sep).join("/");
    const raw = fs.readFileSync(full, "utf8");
    return toMeta(
      parsePostMarkdown(slug, raw, {
        folder: folder || undefined,
        relPath: rel,
      }),
    );
  });

  if (!options.includeDrafts) {
    posts = posts.filter((p) => !p.draft);
  }

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export type AdminPostRow = PostMeta & { content: string };

/** Full post rows for admin (local FS, recursive). */
export function listLocalAdminPosts(): AdminPostRow[] {
  return getPostSlugs().map((slug) => {
    const p = getPostBySlug(slug);
    return { ...toMeta(p), content: p.content };
  });
}

export function sortAdminPosts(
  posts: AdminPostRow[],
  sort: "updated" | "date" | "title" = "updated",
): AdminPostRow[] {
  const copy = [...posts];
  if (sort === "title") {
    return copy.sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));
  }
  if (sort === "date") {
    return copy.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }
  return copy.sort((a, b) => {
    const ta = new Date(a.updatedAt || a.date).getTime();
    const tb = new Date(b.updatedAt || b.date).getTime();
    return tb - ta;
  });
}

export function filterAdminPosts(
  posts: AdminPostRow[],
  opts: {
    filter?: "all" | "published" | "draft";
    q?: string;
  },
): AdminPostRow[] {
  const filter = opts.filter ?? "all";
  const q = (opts.q ?? "").trim().toLowerCase();
  return posts.filter((p) => {
    if (filter === "published" && p.draft) return false;
    if (filter === "draft" && !p.draft) return false;
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)) ||
      p.description.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q)
    );
  });
}

export function getPostsByTag(tag: string): PostMeta[] {
  return getAllPosts().filter((post) =>
    post.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase()),
  );
}

export function getAllTags(): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of getAllPosts()) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** Related published posts by shared tags (score = shared tag count). */
export function getRelatedPosts(slug: string, limit = 3): PostMeta[] {
  const current = getPostBySlug(slug);
  if (current.tags.length === 0) return [];

  const tagSet = new Set(current.tags.map((t) => t.toLowerCase()));
  const scored = getAllPosts()
    .filter((p) => p.slug !== slug)
    .map((p) => {
      const shared = p.tags.filter((t) => tagSet.has(t.toLowerCase())).length;
      return { post: p, shared };
    })
    .filter((x) => x.shared > 0)
    .sort(
      (a, b) =>
        b.shared - a.shared ||
        new Date(b.post.date).getTime() - new Date(a.post.date).getTime(),
    );

  return scored.slice(0, limit).map((x) => x.post);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export type ArchiveYear = {
  year: string;
  months: { month: string; label: string; posts: PostMeta[] }[];
};

/** Group published posts by year → month (newest first). */
export function getArchiveTree(): ArchiveYear[] {
  const posts = getAllPosts();
  const byYear = new Map<string, Map<string, PostMeta[]>>();

  for (const post of posts) {
    const d = new Date(post.date);
    if (Number.isNaN(d.getTime())) continue;
    const year = String(d.getFullYear());
    const month = String(d.getMonth() + 1).padStart(2, "0");
    if (!byYear.has(year)) byYear.set(year, new Map());
    const ym = byYear.get(year)!;
    if (!ym.has(month)) ym.set(month, []);
    ym.get(month)!.push(post);
  }

  return Array.from(byYear.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, months]) => ({
      year,
      months: Array.from(months.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([month, list]) => ({
          month,
          label: `${year}年${Number(month)}月`,
          posts: list,
        })),
    }));
}

export type SeriesInfo = {
  name: string;
  slug: string;
  count: number;
  posts: PostMeta[];
};

export function seriesToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fff-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function getAllSeries(): SeriesInfo[] {
  const map = new Map<string, PostMeta[]>();
  for (const post of getAllPosts()) {
    if (!post.series) continue;
    const key = post.series;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(post);
  }
  return Array.from(map.entries())
    .map(([name, posts]) => ({
      name,
      slug: seriesToSlug(name),
      count: posts.length,
      posts: posts.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function getSeriesBySlug(slug: string): SeriesInfo | null {
  return getAllSeries().find((s) => s.slug === slug) ?? null;
}

export function getPinnedPosts(): PostMeta[] {
  return getAllPosts().filter((p) => p.pinned);
}

