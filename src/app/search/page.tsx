import type { Metadata } from "next";
import Link from "next/link";
import { SearchForm } from "@/components/SearchForm";
import { Tag } from "@/components/Tag";
import { formatDate } from "@/lib/posts";
import { searchPosts } from "@/lib/search";

export const metadata: Metadata = {
  title: "搜索",
  description: "搜索博客文章。",
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const results = q ? searchPosts(q) : [];

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          搜索
        </h1>
        <SearchForm initialQuery={q} autofocus />
      </header>

      {!q && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          输入关键词搜索标题、标签与正文。例如{" "}
          <Link
            href="/search?q=Next.js"
            className="font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            Next.js
          </Link>
          、
          <Link
            href="/search?q=Markdown"
            className="font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            Markdown
          </Link>
          。
        </p>
      )}

      {q && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          「{q}」共 {results.length} 条结果
        </p>
      )}

      {q && results.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          没有找到相关文章，试试更短的关键词。
        </div>
      )}

      <ul className="space-y-4">
        {results.map((hit) => (
          <li key={hit.slug}>
            <article className="rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <time dateTime={hit.date}>{formatDate(hit.date)}</time>
                <span>·</span>
                <span>{hit.readingTime}</span>
              </div>
              <h2 className="mb-2 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                <Link
                  href={`/blog/${hit.slug}`}
                  className="hover:text-violet-700 dark:hover:text-violet-300"
                >
                  {hit.title}
                </Link>
              </h2>
              <p className="mb-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {hit.snippet}
              </p>
              {hit.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {hit.tags.map((tag) => (
                    <Tag key={tag} tag={tag} />
                  ))}
                </div>
              )}
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
