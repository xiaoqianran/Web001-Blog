import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getAllSeries, getSeriesBySlug } from "@/lib/posts";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllSeries().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const series = getSeriesBySlug(decodeURIComponent(slug));
  if (!series) return { title: "系列未找到" };
  return {
    title: `系列：${series.name}`,
    description: `${series.name} · 共 ${series.count} 篇`,
  };
}

export default async function SeriesPage({ params }: Props) {
  const { slug: raw } = await params;
  const series = getSeriesBySlug(decodeURIComponent(raw));
  if (!series) notFound();

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Link
          href="/series"
          className="text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
        >
          ← 全部系列
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          {series.name}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          共 {series.count} 篇 · 按时间正序
        </p>
      </header>

      <ol className="space-y-3">
        {series.posts.map((post, i) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="flex gap-4 rounded-xl border border-zinc-200 p-4 transition hover:border-violet-300 dark:border-zinc-800 dark:hover:border-violet-800"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-sm font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {i + 1}
              </span>
              <span>
                <span className="block font-medium text-zinc-900 dark:text-zinc-50">
                  {post.title}
                </span>
                <span className="mt-1 block text-xs text-zinc-500">
                  {formatDate(post.date)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
