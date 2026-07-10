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
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export function postExists(slug: string): boolean {
  return fs.existsSync(path.join(postsDirectory, `${slug}.md`));
}

export function getPostPath(slug: string): string {
  return path.join(postsDirectory, `${slug}.md`);
}

export function serializePost(input: PostInput): string {
  const body = input.content.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const data: Record<string, unknown> = {
    title: input.title,
    description: input.description,
    date: input.date,
    tags: input.tags,
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
  fs.writeFileSync(getPostPath(input.slug), serializePost(input), "utf8");
}

export function deletePostFile(slug: string): void {
  if (!isValidSlug(slug)) {
    throw new Error("Invalid slug");
  }
  const fullPath = getPostPath(slug);
  if (!fs.existsSync(fullPath)) {
    throw new Error("Post not found");
  }
  fs.unlinkSync(fullPath);
}

export function renamePost(oldSlug: string, input: PostInput): void {
  if (oldSlug !== input.slug && postExists(input.slug)) {
    throw new Error("Slug already exists");
  }
  writePost(input);
  if (oldSlug !== input.slug) {
    deletePostFile(oldSlug);
  }
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
  };
}

export function getPostSlugs(): string[] {
  // Read-only on Vercel: never mkdir here. Empty/missing dir → no posts.
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }
  return fs
    .readdirSync(postsDirectory)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
}

export function getPostBySlug(slug: string): Post {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);
  const stats = readingTime(content);

  return {
    slug,
    title: data.title ?? slug,
    description: data.description ?? "",
    date: data.date ?? new Date().toISOString(),
    tags: Array.isArray(data.tags) ? data.tags : [],
    cover: typeof data.cover === "string" ? data.cover : undefined,
    draft: Boolean(data.draft),
    pinned: Boolean(data.pinned),
    series:
      typeof data.series === "string" && data.series.trim()
        ? data.series.trim()
        : undefined,
    readingTime: stats.text,
    content,
    contentHtml: "",
    toc: [],
  };
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
  const slugs = getPostSlugs();
  let posts = slugs.map((slug) => toMeta(getPostBySlug(slug)));

  if (!options.includeDrafts) {
    posts = posts.filter((p) => !p.draft);
  }

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
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

