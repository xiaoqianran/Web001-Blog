"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { HfPaperItem } from "@/lib/hf-paper-shared";
import {
  paperDisplaySummary,
  paperDisplayTitle,
} from "@/lib/hf-paper-shared";
import type { RssFeedItem } from "@/lib/rss-feeds-display";
import { useLabLang } from "@/components/LabLangProvider";
import { LabLangToggle } from "@/components/LabLangToggle";
import { pickLocalized } from "@/lib/lab-lang";

type PaperProps = {
  date: string | null;
  papers: HfPaperItem[];
};

type FeedProps = {
  date: string | null;
  items: { sourceTitle: string; sourceId: string; item: RssFeedItem }[];
};

export function HomePapersSection({ date, papers }: PaperProps) {
  const { lang } = useLabLang();

  if (papers.length === 0) {
    return (
      <section className="space-y-3">
        <SectionHeader
          title="HF 论文热点"
          href="/lab/papers"
          meta={date}
        />
        <EmptyHint text="暂无论文数据，等待日更或本地运行 fetch:hf-daily。" />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <SectionHeader
        title="HF 论文热点"
        href="/lab/papers"
        meta={date}
        extra={<LabLangToggle />}
      />
      <ul className="space-y-3">
        {papers.map((paper, i) => {
          const canZh = Boolean(paper.summaryZh?.trim() || paper.titleZh?.trim());
          const effective = lang === "zh" && canZh ? "zh" : "en";
          const title = paperDisplayTitle(paper, effective);
          const summary = paperDisplaySummary(paper, effective);
          return (
            <li key={paper.id}>
              <article className="rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 sm:p-5">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span className="font-mono text-zinc-400">#{i + 1}</span>
                  <span className="font-mono">{paper.id}</span>
                  {typeof paper.upvotes === "number" && (
                    <span>· ▲ {paper.upvotes}</span>
                  )}
                </div>
                <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  <a
                    href={paper.urls.hf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-violet-600 dark:hover:text-violet-400"
                  >
                    {title}
                  </a>
                </h3>
                {summary && (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {summary}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  <a
                    href={paper.urls.hf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-violet-600 hover:underline dark:text-violet-400"
                  >
                    HF
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
          );
        })}
      </ul>
    </section>
  );
}

export function HomeRssSection({ date, items }: FeedProps) {
  const { lang } = useLabLang();

  if (items.length === 0) {
    return (
      <section className="space-y-3">
        <SectionHeader title="RSS 信息流" href="/lab/feeds" meta={date} />
        <EmptyHint text="暂无 RSS 数据，等待定时任务或本地运行 fetch:rss。" />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <SectionHeader
        title="RSS 信息流"
        href="/lab/feeds"
        meta={date}
        extra={<LabLangToggle />}
      />
      <ul className="space-y-3">
        {items.map(({ sourceTitle, sourceId, item }, i) => {
          const title = pickLocalized(lang, item.title, item.titleZh);
          const summary = pickLocalized(lang, item.summary, item.summaryZh);
          return (
            <li key={`${sourceId}-${item.id}-${i}`}>
              <article className="rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 sm:p-5">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {sourceTitle}
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
                {summary && (
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {summary}
                  </p>
                )}
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SectionHeader({
  title,
  href,
  meta,
  extra,
}: {
  title: string;
  href: string;
  meta?: string | null;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
        </h2>
        {meta && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">{meta}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {extra}
        <Link
          href={href}
          className="text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
        >
          查看全部 →
        </Link>
      </div>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
      {text}
    </div>
  );
}
