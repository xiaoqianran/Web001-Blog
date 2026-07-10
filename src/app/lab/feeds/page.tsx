import type { Metadata } from "next";
import Link from "next/link";
import { LabLangToggle } from "@/components/LabLangToggle";
import { RssFeedCard } from "@/components/RssFeedCard";
import {
  getRssFeedsOrFallback,
  listRssFeedDates,
} from "@/lib/rss-feeds";

export const metadata: Metadata = {
  title: "RSS 信息流",
  description:
    "聚合 Hacker News、arXiv 等 RSS/Atom 源；标题与摘要支持中文机翻，与论文页语言同步。",
};

type Props = {
  searchParams: Promise<{ date?: string; source?: string }>;
};

export default async function RssFeedsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const preferred = typeof sp.date === "string" ? sp.date : undefined;
  const sourceFilter = typeof sp.source === "string" ? sp.source : "all";
  const { date, data, availableDates } = getRssFeedsOrFallback(preferred);
  const dates = availableDates.length ? availableDates : listRssFeedDates();

  const feeds = data?.feeds ?? [];
  const activeFeeds =
    sourceFilter === "all"
      ? feeds
      : feeds.filter((f) => f.id === sourceFilter);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-widest text-violet-600 dark:text-violet-400">
          Lab
        </p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            RSS 信息流
          </h1>
          <LabLangToggle size="md" />
        </div>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          定时聚合第三方 RSS/Atom（默认 Hacker News + arXiv），只保存标题、摘要与外链，
          <strong className="font-medium text-zinc-800 dark:text-zinc-200">
            不镜像全文
          </strong>
          。摘要默认中文机翻；语言与{" "}
          <Link
            href="/lab/papers"
            className="font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            HF 论文热点
          </Link>{" "}
          全局同步。
        </p>
      </header>

      {dates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {dates.slice(0, 14).map((d) => (
            <Link
              key={d}
              href={
                d === dates[0] && !preferred
                  ? sourceFilter === "all"
                    ? "/lab/feeds"
                    : `/lab/feeds?source=${sourceFilter}`
                  : `/lab/feeds?date=${d}${sourceFilter !== "all" ? `&source=${sourceFilter}` : ""}`
              }
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
          <p className="text-zinc-600 dark:text-zinc-400">还没有聚合数据。本地可运行：</p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-zinc-950 p-4 text-left text-xs text-zinc-100">
            npm run fetch:rss
          </pre>
          <p className="mt-3 text-sm text-zinc-500">
            或等待 GitHub Actions 写入{" "}
            <code className="text-violet-600">content/data/rss-feeds/</code>
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            <span>
              数据日期{" "}
              <strong className="text-zinc-800 dark:text-zinc-200">{date}</strong>
            </span>
            <span>·</span>
            <span>{data.feedCount} 个源</span>
            <span>·</span>
            <span>{data.itemCount} 条</span>
            <span>·</span>
            <span>
              抓取于{" "}
              {new Date(data.fetchedAt).toLocaleString("zh-CN", {
                hour12: false,
              })}
            </span>
            {data.locale?.translated !== false && (
              <>
                <span>·</span>
                <span>含中文机翻</span>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={preferred ? `/lab/feeds?date=${preferred}` : "/lab/feeds"}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                sourceFilter === "all"
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              全部
            </Link>
            {feeds.map((f) => (
              <Link
                key={f.id}
                href={
                  preferred
                    ? `/lab/feeds?date=${preferred}&source=${f.id}`
                    : `/lab/feeds?source=${f.id}`
                }
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  sourceFilter === f.id
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {f.title}
                <span className="ml-1 opacity-70">{f.count}</span>
              </Link>
            ))}
          </div>

          <div className="space-y-10">
            {activeFeeds.map((feed) => (
              <section key={feed.id} className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      {feed.home ? (
                        <a
                          href={feed.home}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-violet-600 dark:hover:text-violet-400"
                        >
                          {feed.title}
                        </a>
                      ) : (
                        feed.title
                      )}
                    </h2>
                    <p className="text-xs text-zinc-500">
                      {feed.count} 条
                      {feed.error ? ` · 抓取失败：${feed.error}` : ""}
                    </p>
                  </div>
                  <a
                    href={feed.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-zinc-500 hover:text-violet-600"
                  >
                    源 RSS
                  </a>
                </div>

                {feed.items.length === 0 ? (
                  <p className="text-sm text-zinc-500">暂无条目</p>
                ) : (
                  <ul className="space-y-3">
                    {feed.items.map((item, i) => (
                      <li key={`${feed.id}-${item.id}-${i}`}>
                        <RssFeedCard item={item} index={i} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <p className="text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
            {data.attribution} 本页仅作导航与摘要展示，不替代原文。
          </p>
        </>
      )}
    </div>
  );
}
