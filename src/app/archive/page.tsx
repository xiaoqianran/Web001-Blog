import type { Metadata } from "next";
import Link from "next/link";
import { getArchiveTree } from "@/lib/posts";

export const metadata: Metadata = {
  title: "归档",
  description: "按年月浏览全部文章。",
};

export default function ArchivePage() {
  const tree = getArchiveTree();
  const total = tree.reduce(
    (n, y) => n + y.months.reduce((m, mo) => m + mo.posts.length, 0),
    0,
  );

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          归档
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          共 {total} 篇 · 按发布时间分组
        </p>
      </header>

      {tree.length === 0 && (
        <p className="text-center text-zinc-500 dark:text-zinc-400">暂无文章</p>
      )}

      <div className="space-y-10">
        {tree.map((year) => (
          <section key={year.year} className="space-y-4">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {year.year}
            </h2>
            {year.months.map((mo) => (
              <div key={mo.month} className="space-y-2 pl-1">
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {mo.label}
                  <span className="ml-2 text-zinc-400">({mo.posts.length})</span>
                </h3>
                <ul className="space-y-1.5 border-l border-zinc-200 pl-4 dark:border-zinc-800">
                  {mo.posts.map((post) => (
                    <li key={post.slug} className="flex flex-wrap items-baseline gap-2">
                      <time
                        dateTime={post.date}
                        className="w-20 shrink-0 text-xs text-zinc-400 tabular-nums"
                      >
                        {post.date.slice(5, 10)}
                      </time>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="font-medium text-zinc-800 hover:text-violet-600 dark:text-zinc-200 dark:hover:text-violet-400"
                      >
                        {post.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
