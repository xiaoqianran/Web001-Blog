import fs from "fs";
import path from "path";
import type { HfDailyFile, HfPaperItem } from "./hf-paper-shared";

export type { HfDailyFile, HfPaperItem };
export {
  paperDisplayTitle,
  paperDisplaySummary,
  hasChineseSummary,
} from "./hf-paper-shared";

const dataDir = path.join(process.cwd(), "content/data/hf-daily");

export function listHfDailyDates(): string[] {
  if (!fs.existsSync(dataDir)) return [];
  return fs
    .readdirSync(dataDir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .map((f) => f.replace(/\.json$/, ""))
    .sort((a, b) => b.localeCompare(a));
}

export function getHfDaily(date: string): HfDailyFile | null {
  const file = path.join(dataDir, `${date}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as HfDailyFile;
  } catch {
    return null;
  }
}

export function getLatestHfDaily(): {
  date: string;
  data: HfDailyFile;
} | null {
  const dates = listHfDailyDates();
  for (const d of dates) {
    const data = getHfDaily(d);
    if (data && Array.isArray(data.papers)) {
      return { date: d, data };
    }
  }
  return null;
}

export function getHfDailyOrFallback(preferredDate?: string): {
  date: string | null;
  data: HfDailyFile | null;
  availableDates: string[];
} {
  const availableDates = listHfDailyDates();
  if (preferredDate) {
    const data = getHfDaily(preferredDate);
    if (data) return { date: preferredDate, data, availableDates };
  }
  const latest = getLatestHfDaily();
  if (latest) {
    return { date: latest.date, data: latest.data, availableDates };
  }
  return { date: null, data: null, availableDates };
}
