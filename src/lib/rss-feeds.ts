import fs from "fs";
import path from "path";

export type RssFeedItem = {
  id: string;
  title: string;
  link: string;
  summary: string;
  publishedAt: string | null;
  comments: string | null;
  author: string | null;
};

export type RssFeedSnapshot = {
  id: string;
  title: string;
  url: string;
  home: string | null;
  group: string;
  fetchedAt: string;
  count: number;
  items: RssFeedItem[];
  error?: string;
};

export type RssFeedsFile = {
  source: string;
  attribution: string;
  fetchedAt: string;
  date: string;
  feedCount: number;
  itemCount: number;
  errors?: { id: string; error: string }[];
  feeds: RssFeedSnapshot[];
};

const dataDir = path.join(process.cwd(), "content/data/rss-feeds");

export function listRssFeedDates(): string[] {
  if (!fs.existsSync(dataDir)) return [];
  return fs
    .readdirSync(dataDir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .map((f) => f.replace(/\.json$/, ""))
    .sort((a, b) => b.localeCompare(a));
}

export function getRssFeeds(date: string): RssFeedsFile | null {
  const file = path.join(dataDir, `${date}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as RssFeedsFile;
  } catch {
    return null;
  }
}

export function getLatestRssFeeds(): {
  date: string;
  data: RssFeedsFile;
} | null {
  const latestPath = path.join(dataDir, "latest.json");
  if (fs.existsSync(latestPath)) {
    try {
      const data = JSON.parse(
        fs.readFileSync(latestPath, "utf8"),
      ) as RssFeedsFile;
      if (data && Array.isArray(data.feeds)) {
        return { date: data.date || "latest", data };
      }
    } catch {
      /* fall through */
    }
  }
  for (const d of listRssFeedDates()) {
    const data = getRssFeeds(d);
    if (data?.feeds) return { date: d, data };
  }
  return null;
}

export function getRssFeedsOrFallback(preferredDate?: string): {
  date: string | null;
  data: RssFeedsFile | null;
  availableDates: string[];
} {
  const availableDates = listRssFeedDates();
  if (preferredDate) {
    const data = getRssFeeds(preferredDate);
    if (data) return { date: preferredDate, data, availableDates };
  }
  const latest = getLatestRssFeeds();
  if (latest) {
    return { date: latest.date, data: latest.data, availableDates };
  }
  return { date: null, data: null, availableDates };
}

export function formatFeedTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("zh-CN", { hour12: false });
}
