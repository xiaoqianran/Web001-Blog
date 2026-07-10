/** Pure display helpers for RSS items (safe for client components). */

export type RssFeedItem = {
  id: string;
  title: string;
  titleZh?: string;
  link: string;
  summary: string;
  summaryZh?: string;
  publishedAt: string | null;
  comments: string | null;
  author: string | null;
};

export function formatFeedTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("zh-CN", { hour12: false });
}
