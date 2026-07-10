import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostForm } from "@/components/PostForm";
import {
  getPostBySlug,
  getPostSlugs,
  postExists,
} from "@/lib/posts";
import { githubPostExists, isGitHubContentEnabled } from "@/lib/github-content";
import { requireSession } from "@/lib/session";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string; via?: string; created?: string }>;
};

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `编辑：${decodeURIComponent(slug)}`,
    robots: { index: false, follow: false },
  };
}

export default async function EditPostPage({ params, searchParams }: Props) {
  const session = await requireSession();
  if (session.userId === "static") return null;

  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);
  const sp = await searchParams;

  // Local FS may lag behind GitHub right after first save on Vercel
  let exists = postExists(slug);
  if (!exists && isGitHubContentEnabled()) {
    exists = await githubPostExists(slug).catch(() => false);
  }
  if (!exists) {
    notFound();
  }

  // Prefer local file; if missing after GH write, show empty-ish form from slug only
  const post = postExists(slug)
    ? getPostBySlug(slug)
    : {
        slug,
        title: slug,
        description: "",
        date: new Date().toISOString(),
        tags: [] as string[],
        content: "",
        draft: false,
        cover: undefined as string | undefined,
        pinned: false,
        series: undefined as string | undefined,
        readingTime: "",
        contentHtml: "",
        toc: [],
      };

  const date = String(post.date).slice(0, 10);

  let initialNotice: string | null = null;
  if (sp.saved === "1") {
    const viaGh = sp.via === "github";
    if (sp.created === "1") {
      initialNotice = viaGh
        ? "创建成功，已提交 GitHub。可继续修改并用 ⌘/Ctrl+S 多次保存。"
        : "创建成功。可继续修改并用 ⌘/Ctrl+S 多次保存。";
    } else {
      initialNotice = viaGh
        ? "已保存并提交 GitHub。可继续用 ⌘/Ctrl+S 保存。"
        : "已保存。可继续用 ⌘/Ctrl+S 保存。";
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Link
          href="/admin"
          className="text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
        >
          ← 返回后台
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          编辑文章
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          正在编辑{" "}
          <Link
            href={`/blog/${post.slug}`}
            className="font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            {post.title}
          </Link>
          。可反复保存，不会因 slug 已存在而失败。
        </p>
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 lg:p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <PostForm
          mode="edit"
          originalSlug={post.slug}
          initialNotice={initialNotice}
          initial={{
            slug: post.slug,
            title: post.title,
            description: post.description,
            date,
            tags: post.tags.join(", "),
            content: post.content,
            draft: post.draft,
            cover: post.cover ?? "",
            pinned: post.pinned,
            series: post.series ?? "",
          }}
        />
      </div>
    </div>
  );
}
