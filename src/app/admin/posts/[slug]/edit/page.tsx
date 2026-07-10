import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostForm } from "@/components/PostForm";
import { getPostBySlug, postExists } from "@/lib/posts";
import { requireSession } from "@/lib/session";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `编辑：${decodeURIComponent(slug)}`,
    robots: { index: false, follow: false },
  };
}

export default async function EditPostPage({ params }: Props) {
  await requireSession();
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);

  if (!postExists(slug)) {
    notFound();
  }

  const post = getPostBySlug(slug);
  const date = post.date.slice(0, 10);

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
        </p>
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <PostForm
          mode="edit"
          originalSlug={post.slug}
          initial={{
            slug: post.slug,
            title: post.title,
            description: post.description,
            date,
            tags: post.tags.join(", "),
            content: post.content,
          }}
        />
      </div>
    </div>
  );
}
