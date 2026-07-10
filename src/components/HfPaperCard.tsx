"use client";

import type { HfPaperItem } from "@/lib/hf-paper-shared";
import {
  hasChineseSummary,
  paperDisplaySummary,
  paperDisplayTitle,
} from "@/lib/hf-paper-shared";
import {
  CaptureNoteButton,
  type CaptureFolderOption,
} from "@/components/CaptureNoteButton";
import { LabLangToggle } from "@/components/LabLangToggle";
import { useLabLang } from "@/components/LabLangProvider";

type Props = {
  paper: HfPaperItem;
  index: number;
  captureFolders?: CaptureFolderOption[];
  captureLoggedIn?: boolean;
  returnTo?: string;
};

export function HfPaperCard({
  paper,
  index,
  captureFolders = [],
  captureLoggedIn = false,
  returnTo = "/lab/papers",
}: Props) {
  const { lang } = useLabLang();
  const canZh = hasChineseSummary(paper);
  // Global lab lang; fall back to EN display when this card has no zh fields
  const effective = lang === "zh" && canZh ? "zh" : lang === "zh" && !canZh ? "en" : lang;
  const title = paperDisplayTitle(paper, effective === "zh" ? "zh" : "en");
  const summary = paperDisplaySummary(paper, effective === "zh" ? "zh" : "en");
  const showingZh = effective === "zh" && canZh;

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span className="font-mono text-zinc-400">#{index + 1}</span>
        <span className="font-mono">{paper.id}</span>
        {paper.submitter && <span>· by {paper.submitter}</span>}
        {typeof paper.upvotes === "number" && <span>· ▲ {paper.upvotes}</span>}
        <span className="ml-auto">
          <LabLangToggle />
        </span>
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
      {showingZh && paper.titleZh?.trim() && paper.titleZh !== paper.title && (
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
      {showingZh && (
        <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500">
          机翻摘要，仅供速览；以英文原文与 PDF 为准。切换语言会同步论文与信息流。
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
        <CaptureNoteButton
          kind="paper"
          title={paper.title}
          summary={summary || paper.summary}
          sourceUrl={paper.urls.hf}
          idHint={paper.id}
          authors={paper.authors.slice(0, 12).join(", ")}
          extraArxiv={paper.urls.arxiv ?? ""}
          extraPdf={paper.urls.pdf ?? ""}
          returnTo={returnTo}
          folders={captureFolders}
          loggedIn={captureLoggedIn}
        />
      </div>
    </article>
  );
}
