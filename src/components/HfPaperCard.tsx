"use client";

import { useState } from "react";
import type { HfPaperItem } from "@/lib/hf-paper-shared";
import {
  hasChineseSummary,
  paperDisplaySummary,
  paperDisplayTitle,
} from "@/lib/hf-paper-shared";

type Lang = "zh" | "en";

type Props = {
  paper: HfPaperItem;
  index: number;
  defaultLang?: Lang;
};

export function HfPaperCard({ paper, index, defaultLang = "zh" }: Props) {
  const canZh = hasChineseSummary(paper);
  const [lang, setLang] = useState<Lang>(canZh ? defaultLang : "en");
  const title = paperDisplayTitle(paper, lang);
  const summary = paperDisplaySummary(paper, lang);

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span className="font-mono text-zinc-400">#{index + 1}</span>
        <span className="font-mono">{paper.id}</span>
        {paper.submitter && <span>· by {paper.submitter}</span>}
        {typeof paper.upvotes === "number" && <span>· ▲ {paper.upvotes}</span>}
        {canZh && (
          <span className="ml-auto inline-flex overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setLang("zh")}
              className={`px-2.5 py-0.5 text-xs font-medium transition ${
                lang === "zh"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-400"
              }`}
            >
              中文
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-2.5 py-0.5 text-xs font-medium transition ${
                lang === "en"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-400"
              }`}
            >
              EN
            </button>
          </span>
        )}
      </div>
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        <a
          href={paper.urls.hf}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-violet-600 dark:hover:text-violet-400"
        >
          {title}
        </a>
      </h2>
      {lang === "zh" && paper.titleZh?.trim() && paper.titleZh !== paper.title && (
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          {paper.title}
        </p>
      )}
      {paper.authors.length > 0 && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {paper.authors.join(", ")}
          {paper.authors.length >= 12 ? " …" : ""}
        </p>
      )}
      {summary && (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {summary}
        </p>
      )}
      {lang === "zh" && canZh && (
        <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">
          机翻摘要，仅供速览；以英文原文与 PDF 为准。
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
  );
}
