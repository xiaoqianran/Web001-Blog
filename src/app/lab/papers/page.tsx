import type { Metadata } from "next";
import Link from "next/link";
import { getHfDailyOrFallback, listHfDailyDates } from "@/lib/hf-papers";

export const metadata: Metadata = {
  title: "HF 论文热点",
  description: "Hugging Face Daily Papers 热点速览（自动日更）。",
};

type Props = {
  searchParams: Promise<{ date?: string }>;
};

export default async function HfPapersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const preferred = typeof sp.date === "string" ? sp.date : undefined;
  const { date, data, availableDates } = getHfDailyOrFallback(preferred);
  const dates = availableDates.length ? availableDates : listHfDailyDates();

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-widest text-violet-600 dark:text-violet-400">
          Lab
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          Hugging Face 论文热点
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          自动拉取{" "}
          <a
            href="https://huggingface.co/papers"
            className="font-medium text-violet-600 hover:underline dark:text-violet-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            HF Daily Papers
          </a>
          ，写入仓库后展示。不进入主文章流——深度解读仍人工筛选发博。
        </p>
      </header>

      {dates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {dates.slice(0, 14).map((d) => (
            <Link
              key={d}
              href={d === dates[0] && !preferred ? "/lab/papers" : `/lab/papers?date=${d}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                d === date
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {d}
            </Link>
          ))}
        </div>
      )}

      {!data || !date ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <p className="text-zinc-600 dark:text-zinc-400">
            还没有日刊数据。本地可运行：
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-zinc-950 p-4 text-left text-xs text-zinc-100">
            node scripts/fetch-hf-daily.mjs
          </pre>
          <p className="mt-3 text-sm text-zinc-500">
            或等待 GitHub Actions 每日定时任务写入{" "}
            <code className="text-violet-600">content/data/hf-daily/</code>
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            <span>
              数据日期 <strong className="text-zinc-800 dark:text-zinc-200">{date}</strong>
            </span>
            <span>·</span>
            <span>{data.count} 篇</span>
            <span>·</span>
            <span>排序 {data.sort}</span>
            <span>·</span>
            <span>
              抓取于{" "}
              {new Date(data.fetchedAt).toLocaleString("zh-CN", {
                hour12: false,
              })}
            </span>
          </div>

          <ul className="space-y-4">
            {data.papers.map((paper, i) => (
              <li key={paper.id}>
                <article className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span className="font-mono text-zinc-400">#{i + 1}</span>
                    <span className="font-mono">{paper.id}</span>
                    {paper.submitter && <span>· by {paper.submitter}</span>}
                    {typeof paper.upvotes === "number" && (
                      <span>· ▲ {paper.upvotes}</span>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    <a
                      href={paper.urls.hf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-violet-600 dark:hover:text-violet-400"
                    >
                      {paper.title}
                    </a>
                  </h2>
                  {paper.authors.length > 0 && (
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {paper.authors.join(", ")}
                      {paper.authors.length >= 12 ? " …" : ""}
                    </p>
                  )}
                  {paper.summary && (
                    <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {paper.summary.length > 420
                        ? `${paper.summary.slice(0, 420)}…`
                        : paper.summary}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    <a
                      href={paper.urls.hf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-violet-600 hover:underline dark:text-violet-400"
                    >
                      HF 页面
                    </a>
                    {paper.urls.arxiv && (
                      <a
                        href={paper.urls.arxiv}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-zinc-600 hover:underline dark:text-zinc-300"
                      >
                        arXiv
                      </a>
                    )}
                    {paper.urls.pdf && (
                      <a
                        href={paper.urls.pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-zinc-600 hover:underline dark:text-zinc-300"
                      >
                        PDF
                      </a>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ul>

          <p className="text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
            {data.attribution} 本页仅作导航与摘要展示，不替代原文。
          </p>
        </>
      )}
    </div>
  );
}
