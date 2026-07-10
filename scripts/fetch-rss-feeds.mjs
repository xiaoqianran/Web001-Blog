#!/usr/bin/env node
/**
 * Fetch configured RSS/Atom feeds → content/data/rss-feeds/
 *
 * Usage:
 *   node scripts/fetch-rss-feeds.mjs
 *   node scripts/fetch-rss-feeds.mjs --limit=10
 *   node scripts/fetch-rss-feeds.mjs --no-translate
 *
 * Env:
 *   DEEPL_API_KEY optional (same as HF papers)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseFeedXml } from "./lib/parse-rss.mjs";
import { translateToZh } from "./lib/translate-zh.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(root, "content/feeds.json");
const outDir = path.join(root, "content/data/rss-feeds");

function parseArgs(argv) {
  const out = { limit: null, translate: true };
  for (const a of argv) {
    if (a.startsWith("--limit=")) out.limit = Number(a.slice(8)) || null;
    else if (a === "--no-translate") out.translate = false;
  }
  return out;
}

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function loadConfig() {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Missing ${configPath}`);
  }
  const raw = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (!Array.isArray(raw.feeds) || raw.feeds.length === 0) {
    throw new Error("content/feeds.json must contain a non-empty feeds array");
  }
  return raw;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchFeed(feed, globalLimit) {
  const limit = globalLimit ?? feed.limit ?? 20;
  const res = await fetch(feed.url, {
    headers: {
      Accept:
        "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      "User-Agent":
        "Web001-Blog-rss-lab/1.0 (+https://github.com/xiaoqianran/Web001-Blog)",
    },
    redirect: "follow",
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`HTTP ${res.status}: ${t.slice(0, 200)}`);
  }
  const xml = await res.text();
  const parsed = parseFeedXml(xml);
  const items = parsed.items
    .slice(0, Math.min(100, Math.max(1, limit)))
    .map((item) => ({
      id: item.id,
      title: item.title,
      titleZh: "",
      link: item.link,
      summary: item.summary.slice(0, 4000),
      summaryZh: "",
      publishedAt: item.publishedAt,
      comments: item.comments,
      author: item.author,
    }));

  return {
    id: feed.id,
    title: feed.title || parsed.title,
    url: feed.url,
    home: feed.home || parsed.link || null,
    group: feed.group || "other",
    fetchedAt: new Date().toISOString(),
    count: items.length,
    items,
  };
}

async function translateItems(feeds, enabled) {
  if (!enabled) {
    console.log("Translation skipped (--no-translate)");
    return;
  }
  let n = 0;
  const total = feeds.reduce((s, f) => s + f.items.length, 0);
  console.log(`Translating ${total} RSS items to zh-CN…`);
  for (const feed of feeds) {
    for (const item of feed.items) {
      n += 1;
      try {
        item.titleZh = (await translateToZh(item.title)) || "";
        // Cap very long arXiv abstracts for rate limits; still full EN stored
        const summaryForTr =
          item.summary.length > 2500
            ? item.summary.slice(0, 2500)
            : item.summary;
        item.summaryZh = summaryForTr
          ? (await translateToZh(summaryForTr)) || ""
          : "";
        console.log(
          `  [${n}/${total}] ${feed.id} titleZh=${item.titleZh ? "yes" : "no"} summaryZh=${item.summaryZh ? "yes" : "no"}`,
        );
      } catch (e) {
        console.warn(`  [${n}/${total}] translate error: ${e.message}`);
      }
      await sleep(300);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = loadConfig();
  const date = todayUTC();
  const feeds = [];
  const errors = [];

  for (let i = 0; i < config.feeds.length; i++) {
    const feed = config.feeds[i];
    try {
      console.log(`Fetching ${feed.id} …`);
      const result = await fetchFeed(feed, args.limit);
      feeds.push(result);
      console.log(`  ok ${result.count} items`);
    } catch (e) {
      console.warn(`  fail ${feed.id}: ${e.message}`);
      errors.push({ id: feed.id, error: String(e.message || e) });
      feeds.push({
        id: feed.id,
        title: feed.title,
        url: feed.url,
        home: feed.home || null,
        group: feed.group || "other",
        fetchedAt: new Date().toISOString(),
        count: 0,
        items: [],
        error: String(e.message || e),
      });
    }
    if (i < config.feeds.length - 1) await sleep(400);
  }

  await translateItems(feeds, args.translate);

  const payload = {
    source: "content/feeds.json",
    attribution:
      "Aggregated headlines/summaries from third-party RSS/Atom feeds for navigation only. All rights belong to original publishers and authors. Chinese text is machine-translated.",
    fetchedAt: new Date().toISOString(),
    date,
    feedCount: feeds.length,
    itemCount: feeds.reduce((n, f) => n + f.count, 0),
    locale: {
      summaryDefault: "zh",
      translated: args.translate,
    },
    errors,
    feeds,
  };

  fs.mkdirSync(outDir, { recursive: true });
  const dated = path.join(outDir, `${date}.json`);
  const latest = path.join(outDir, "latest.json");
  const body = `${JSON.stringify(payload, null, 2)}\n`;
  fs.writeFileSync(dated, body, "utf8");
  fs.writeFileSync(latest, body, "utf8");
  const keep = path.join(outDir, ".gitkeep");
  if (!fs.existsSync(keep)) fs.writeFileSync(keep, "", "utf8");

  console.log(
    `Wrote ${dated} and latest.json (${payload.itemCount} items, ${errors.length} errors)`,
  );
  if (errors.length === config.feeds.length) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
