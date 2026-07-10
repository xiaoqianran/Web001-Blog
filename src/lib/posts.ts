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
  readingTime: string;
};

export type PostInput = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  content: string;
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
  return matter.stringify(body.endsWith("\n") ? body : `${body}\n`, {
    title: input.title,
    description: input.description,
    date: input.date,
    tags: input.tags,
  });
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

export function getPostSlugs(): string[] {
  ensurePostsDir();
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
    cover: data.cover,
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

export function getAllPosts(): PostMeta[] {
  const slugs = getPostSlugs();
  const posts = slugs.map((slug) => {
    const post = getPostBySlug(slug);
    return {
      slug: post.slug,
      title: post.title,
      description: post.description,
      date: post.date,
      tags: post.tags,
      cover: post.cover,
      readingTime: post.readingTime,
    };
  });

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

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
