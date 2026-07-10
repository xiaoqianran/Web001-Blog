#!/usr/bin/env node
/**
 * Fetch Hugging Face Daily Papers and write content/data/hf-daily/YYYY-MM-DD.json
 *
 * Usage:
 *   node scripts/fetch-hf-daily.mjs
 *   node scripts/fetch-hf-daily.mjs --date=2026-07-10 --limit=20 --sort=trending
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "content/data/hf-daily");

function parseArgs(argv) {
  const out = { date: null, limit: 15, sort: "trending" };
  for (const a of argv) {
    if (a.startsWith("--date=")) out.date = a.slice(7);
    else if (a.startsWith("--limit=")) out.limit = Number(a.slice(8)) || 15;
    else if (a.startsWith("--sort=")) out.sort = a.slice(7) || "trending";
  }
  return out;
}

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeItem(raw, index) {
  const paper = raw.paper ?? raw;
  const id = paper.id ?? paper.paperId ?? `unknown-${index}`;
  const title = paper.title ?? "Untitled";
  const summary = paper.summary ?? paper.abstract ?? "";
  const authors = Array.isArray(paper.authors)
    ? paper.authors
        .map((a) => (typeof a === "string" ? a : a?.name))
        .filter(Boolean)
        .slice(0, 12)
    : [];
  const publishedAt = paper.publishedAt ?? null;
  const submittedOnDailyAt = paper.submittedOnDailyAt ?? raw.publishedAt ?? null;
  const submitter =
    paper.submittedOnDailyBy?.name ||
    paper.submittedOnDailyBy?.user ||
    raw.submittedBy?.name ||
    null;
  const upvotes = raw.reactions?.likes ?? raw.upvotes ?? paper.upvotes ?? null;

  return {
    id: String(id),
    title: String(title),
    summary: String(summary).slice(0, 2000),
    authors,
    publishedAt,
    submittedOnDailyAt,
    submitter,
    upvotes,
    urls: {
      hf: `https://huggingface.co/papers/${id}`,
      arxiv: String(id).match(/^\d{4}\.\d{4,5}(v\d+)?$/)
        ? `https://arxiv.org/abs/${id}`
        : null,
      pdf: String(id).match(/^\d{4}\.\d{4,5}(v\d+)?$/)
        ? `https://arxiv.org/pdf/${id}`
        : null,
    },
  };
}

async function fetchDaily({ date, limit, sort }) {
  const params = new URLSearchParams({
    limit: String(Math.min(100, Math.max(1, limit))),
    sort,
  });
  if (date) params.set("date", date);

  const url = `https://huggingface.co/api/daily_papers?${params}`;
  const headers = { Accept: "application/json" };
  if (process.env.HF_TOKEN) {
    headers.Authorization = `Bearer ${process.env.HF_TOKEN}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HF API ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected HF API payload (expected array)");
  }
  return data.map(normalizeItem);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const date = args.date || todayUTC();
  const papers = await fetchDaily(args);

  const payload = {
    source: "huggingface.co/api/daily_papers",
    attribution:
      "Data from Hugging Face Daily Papers (community curation). All rights belong to the original authors.",
    fetchedAt: new Date().toISOString(),
    date,
    sort: args.sort,
    count: papers.length,
    papers,
  };

  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${date}.json`);
  fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outFile} (${papers.length} papers)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
