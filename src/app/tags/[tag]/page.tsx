import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllTags, getPostsByTag } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { Tag } from "@/components/Tag";

type Props = {
  params: Promise<{ tag: string }>;
};

export async function generateStaticParams() {
  return getAllTags().map(({ tag }) => ({ tag }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return {
    title: `标签：${decoded}`,
    description: `包含「${decoded}」标签的全部文章。`,
  };
}

export default async function TagPage({ params }: Props) {
  const { tag: raw } = await params;
  const tag = decodeURIComponent(raw);
  const posts = getPostsByTag(tag);
  const allTags = getAllTags();

  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <Link
          href="/blog"
          className="text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
        >
          ← 全部文章
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          标签：{tag}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">共 {posts.length} 篇</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {allTags.map(({ tag: t, count }) => (
          <Tag key={t} tag={t} count={count} active={t.toLowerCase() === tag.toLowerCase()} />
        ))}
      </div>

      <div className="grid gap-4">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
