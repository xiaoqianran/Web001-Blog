/**
 * English → Simplified Chinese for HF paper titles/abstracts.
 * Default: free Google Translate endpoint (no key).
 * Optional: DEEPL_API_KEY for higher quality.
 */

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Rough check: already mostly CJK. */
export function looksMostlyChinese(text) {
  const s = String(text || "");
  if (!s.trim()) return false;
  const cjk = (s.match(/[\u4e00-\u9fff]/g) || []).length;
  const letters = (s.match(/[A-Za-z]/g) || []).length;
  return cjk >= 8 && cjk >= letters * 0.5;
}

function chunkText(text, maxLen = 4000) {
  const s = String(text);
  if (s.length <= maxLen) return [s];
  const chunks = [];
  let i = 0;
  while (i < s.length) {
    let end = Math.min(i + maxLen, s.length);
    if (end < s.length) {
      const slice = s.slice(i, end);
      const breakAt = Math.max(
        slice.lastIndexOf("\n"),
        slice.lastIndexOf(". "),
        slice.lastIndexOf("? "),
        slice.lastIndexOf("! "),
      );
      if (breakAt > maxLen * 0.4) end = i + breakAt + 1;
    }
    chunks.push(s.slice(i, end));
    i = end;
  }
  return chunks;
}

async function translateDeepL(text) {
  const key = process.env.DEEPL_API_KEY;
  if (!key) return null;
  const free = process.env.DEEPL_API_FREE !== "0";
  const base = free
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";
  const body = new URLSearchParams({
    text,
    source_lang: "EN",
    target_lang: "ZH",
  });
  const res = await fetch(base, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`DeepL ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const out = data?.translations?.[0]?.text;
  return typeof out === "string" ? out : null;
}

/** Unofficial free endpoint; adequate for abstracts at daily volume. */
async function translateGoogleGtx(text) {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "en");
  url.searchParams.set("tl", "zh-CN");
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "Web001-Blog-hf-daily/1.0" },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Google translate ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  // [[[translated, original, ...], ...], ...]
  if (!Array.isArray(data?.[0])) {
    throw new Error("Unexpected Google translate payload");
  }
  return data[0]
    .map((row) => (Array.isArray(row) ? row[0] : ""))
    .join("");
}

/**
 * @param {string} text
 * @param {{ delayMs?: number }} [opts]
 * @returns {Promise<string>} Chinese text, or original on total failure
 */
export async function translateToZh(text, opts = {}) {
  const input = String(text || "").trim();
  if (!input) return "";
  if (looksMostlyChinese(input)) return input;

  const delayMs = opts.delayMs ?? 250;
  const chunks = chunkText(input);
  const parts = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    let translated = null;

    try {
      translated = await translateDeepL(chunk);
    } catch (e) {
      console.warn(`[translate] DeepL failed: ${e.message}`);
    }

    if (!translated) {
      try {
        translated = await translateGoogleGtx(chunk);
      } catch (e) {
        console.warn(`[translate] Google failed: ${e.message}`);
      }
    }

    if (!translated) {
      // Partial failure: keep remaining in English rather than drop data
      parts.push(chunk);
    } else {
      parts.push(translated);
    }

    if (i < chunks.length - 1 && delayMs > 0) await sleep(delayMs);
  }

  return parts.join("").trim();
}

/**
 * Translate many strings with inter-item delay (rate-friendly).
 * @param {string[]} texts
 * @param {{ itemDelayMs?: number, chunkDelayMs?: number }} [opts]
 */
export async function translateManyToZh(texts, opts = {}) {
  const itemDelayMs = opts.itemDelayMs ?? 350;
  const out = [];
  for (let i = 0; i < texts.length; i++) {
    out.push(await translateToZh(texts[i], { delayMs: opts.chunkDelayMs ?? 200 }));
    if (i < texts.length - 1 && itemDelayMs > 0) await sleep(itemDelayMs);
  }
  return out;
}
