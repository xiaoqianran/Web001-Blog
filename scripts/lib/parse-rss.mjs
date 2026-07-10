/**
 * Minimal RSS 2.0 / Atom parser for aggregation (title/link/summary only).
 * No external deps — good enough for HN + arXiv style feeds.
 */

function decodeEntities(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function stripHtml(html) {
  return decodeEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function firstTag(block, names) {
  for (const name of names) {
    // attribute-bearing open tags: <link href="..."/> or <title>...</title>
    const selfClosing = block.match(
      new RegExp(`<${name}\\b[^>]*\\bhref=["']([^"']+)["'][^>]*\\/?>`, "i"),
    );
    if (selfClosing?.[1]) return decodeEntities(selfClosing[1]).trim();

    const paired = block.match(
      new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"),
    );
    if (paired?.[1] != null) {
      return decodeEntities(paired[1]).trim();
    }
  }
  return "";
}

function extractBlocks(xml, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const out = [];
  let m;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out;
}

function normalizeLink(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  // Atom often has multiple <link>; prefer http(s)
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return s;
}

/**
 * @param {string} xml
 * @returns {{ title: string, link: string, items: Array<{
 *   id: string, title: string, link: string, summary: string,
 *   publishedAt: string | null, comments: string | null, author: string | null
 * }> }}
 */
export function parseFeedXml(xml) {
  const text = String(xml || "").replace(/^\uFEFF/, "");
  const isAtom =
    /<feed[\s>]/i.test(text) && !/<rss[\s>]/i.test(text);

  if (isAtom) {
    return parseAtom(text);
  }
  return parseRss2(text);
}

function parseRss2(xml) {
  const channel = extractBlocks(xml, "channel")[0] || xml;
  const channelTitle = stripHtml(firstTag(channel, ["title"])) || "Feed";
  const channelLink = normalizeLink(firstTag(channel, ["link"]));

  const items = extractBlocks(channel, "item").map((block, i) => {
    const title = stripHtml(firstTag(block, ["title"])) || "Untitled";
    const link = normalizeLink(firstTag(block, ["link"]));
    const guid = stripHtml(firstTag(block, ["guid"])) || link || `item-${i}`;
    const summary = stripHtml(
      firstTag(block, ["description", "content:encoded", "summary"]),
    );
    const pub = firstTag(block, ["pubDate", "dc:date", "published"]);
    const comments = normalizeLink(firstTag(block, ["comments"])) || null;
    const author =
      stripHtml(firstTag(block, ["dc:creator", "author", "creator"])) || null;
    const publishedAt = toIsoDate(pub);

    return {
      id: guid || `item-${i}`,
      title,
      link: link || (guid.startsWith("http") ? guid : ""),
      summary,
      publishedAt,
      comments,
      author,
    };
  });

  return { title: channelTitle, link: channelLink, items };
}

function parseAtom(xml) {
  const feedTitle = stripHtml(firstTag(xml, ["title"])) || "Feed";
  // first link with rel=alternate or first href
  let feedLink = "";
  const linkTags = xml.match(/<link\b[^>]*>/gi) || [];
  for (const tag of linkTags) {
    const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    const rel = tag.match(/\brel=["']([^"']+)["']/i)?.[1] || "alternate";
    if (href && (rel === "alternate" || !feedLink)) {
      feedLink = decodeEntities(href);
      if (rel === "alternate") break;
    }
  }

  const items = extractBlocks(xml, "entry").map((block, i) => {
    const title = stripHtml(firstTag(block, ["title"])) || "Untitled";
    let link = "";
    const entryLinks = block.match(/<link\b[^>]*>/gi) || [];
    for (const tag of entryLinks) {
      const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
      const rel = tag.match(/\brel=["']([^"']+)["']/i)?.[1] || "alternate";
      if (href && (rel === "alternate" || !link)) {
        link = decodeEntities(href);
        if (rel === "alternate") break;
      }
    }
    const id = stripHtml(firstTag(block, ["id"])) || link || `entry-${i}`;
    const summary = stripHtml(
      firstTag(block, ["summary", "content", "description"]),
    );
    const pub = firstTag(block, ["published", "updated"]);
    const authorBlock = extractBlocks(block, "author")[0] || "";
    const author = stripHtml(firstTag(authorBlock, ["name"])) || null;

    return {
      id,
      title,
      link,
      summary,
      publishedAt: toIsoDate(pub),
      comments: null,
      author,
    };
  });

  return { title: feedTitle, link: feedLink, items };
}

function toIsoDate(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export { stripHtml, decodeEntities };
