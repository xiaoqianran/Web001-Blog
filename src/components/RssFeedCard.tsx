"use client";

import type { RssFeedItem } from "@/lib/rss-feeds-display";
import { formatFeedTime } from "@/lib/rss-feeds-display";
import { useLabLang } from "@/components/LabLangProvider";
import { LabLangToggle } from "@/components/LabLangToggle";
import { pickLocalized } from "@/lib/lab-lang";

type Props = {
  item: RssFeedItem;
  index: number;
};

export function RssFeedCard({ item, index }: Props) {
  const { lang } = useLabLang();
  const title = pickLocalized(lang, item.title, item.titleZh);
  const summary = pickLocalized(lang, item.summary, item.summaryZh);
  const showingZh =
    lang === "zh" &&
    ((item.titleZh?.trim() && title === item.titleZh.trim()) ||
      (item.summaryZh?.trim() && summary === item.summaryZh.trim()));

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5">
      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span className="font-mono text-zinc-400">#{index + 1}</span>
        {item.publishedAt && (
          <time dateTime={item.publishedAt}>
            {formatFeedTime(item.publishedAt)}
          </time>
        )}
        {item.author && <span>· {item.author}</span>}
        <span className="ml-auto">
          <LabLangToggle />
        </span>
      </div>
      <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {item.link ? (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-violet-600 dark:hover:text-violet-400"
          >
            {title}
          </a>
        ) : (
          title
        )}
      </h3>
      {showingZh &&
        item.titleZh?.trim() &&
        item.titleZh.trim() !== item.title && (
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            {item.title}
          </p>
        )}
      {summary && (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {summary}
        </p>
      )}
      {showingZh && (
        <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">
          机翻，仅供速览；以原文链接为准。切换语言会同步论文与信息流。
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            原文
          </a>
        )}
        {item.comments && (
          <a
            href={item.comments}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-zinc-600 hover:underline dark:text-zinc-300"
          >
            讨论
          </a>
        )}
      </div>
    </article>
  );
}
