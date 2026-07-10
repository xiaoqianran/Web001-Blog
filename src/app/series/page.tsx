import type { Metadata } from "next";
import Link from "next/link";
import { getAllSeries } from "@/lib/posts";

export const metadata: Metadata = {
  title: "系列",
  description: "按系列浏览文章。",
};

export default function SeriesIndexPage() {
  const series = getAllSeries();

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          系列
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          共 {series.length} 个系列（frontmatter <code>series</code>）
        </p>
      </header>

      {series.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          还没有系列。在文章 frontmatter 添加{" "}
          <code className="text-violet-600">series: &quot;名称&quot;</code>{" "}
          即可。
        </p>
      ) : (
        <ul className="grid gap-3">
          {series.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/series/${encodeURIComponent(s.slug)}`}
                className="flex items-center justify-between rounded-xl border border-zinc-200 px-5 py-4 transition hover:border-violet-300 dark:border-zinc-800 dark:hover:border-violet-800"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {s.name}
                </span>
                <span className="text-sm text-zinc-500">{s.count} 篇</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
