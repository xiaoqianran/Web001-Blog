/** Shared types + pure helpers (safe for client components). */

export type HfPaperItem = {
  id: string;
  title: string;
  /** English abstract (source). */
  summary: string;
  /** Machine-translated Simplified Chinese abstract (optional). */
  summaryZh?: string;
  /** Machine-translated Simplified Chinese title (optional). */
  titleZh?: string;
  authors: string[];
  publishedAt: string | null;
  submittedOnDailyAt: string | null;
  submitter: string | null;
  upvotes: number | null;
  urls: {
    hf: string;
    arxiv: string | null;
    pdf: string | null;
  };
};

export type HfDailyFile = {
  source: string;
  attribution: string;
  fetchedAt: string;
  date: string;
  sort: string;
  count: number;
  locale?: {
    summaryDefault?: "zh" | "en";
    translated?: boolean;
  };
  papers: HfPaperItem[];
};

/** Prefer Chinese fields when present and non-empty. */
export function paperDisplayTitle(paper: HfPaperItem, lang: "zh" | "en"): string {
  if (lang === "zh" && paper.titleZh?.trim()) return paper.titleZh.trim();
  return paper.title;
}

export function paperDisplaySummary(
  paper: HfPaperItem,
  lang: "zh" | "en",
): string {
  if (lang === "zh" && paper.summaryZh?.trim()) return paper.summaryZh.trim();
  return paper.summary;
}

export function hasChineseSummary(paper: HfPaperItem): boolean {
  return Boolean(paper.summaryZh?.trim());
}
