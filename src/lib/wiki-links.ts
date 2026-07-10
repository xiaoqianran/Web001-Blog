/**
 * Obsidian-style wiki links: [[slug]] and [[slug|label]].
 * Pure functions — no FS / React. Code fences and inline code are skipped.
 */

export type WikiLinkRef = {
  slug: string;
  label: string;
  /** raw match including brackets */
  raw: string;
};

const WIKI_RE = /\[\[([^\]]+?)\]\]/g;

/** Normalize target to a path-safe slug candidate (lowercase, trim). */
export function normalizeWikiSlug(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "-");
}

/**
 * Split markdown into segments that are either "code" (fenced or inline) or prose.
 * Fenced: ``` ... ``` (including language tag line)
 * Inline: `...` single-line
 */
export function splitMarkdownCodeAware(markdown: string): {
  type: "code" | "text";
  value: string;
}[] {
  const src = markdown ?? "";
  const segments: { type: "code" | "text"; value: string }[] = [];
  // Fenced blocks first, then we still protect inline inside text chunks
  const fenceRe = /```[\s\S]*?```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const fenceParts: { type: "code" | "text"; value: string }[] = [];
  while ((m = fenceRe.exec(src)) !== null) {
    if (m.index > last) {
      fenceParts.push({ type: "text", value: src.slice(last, m.index) });
    }
    fenceParts.push({ type: "code", value: m[0] });
    last = m.index + m[0].length;
  }
  if (last < src.length) {
    fenceParts.push({ type: "text", value: src.slice(last) });
  }
  if (fenceParts.length === 0) {
    fenceParts.push({ type: "text", value: src });
  }

  for (const part of fenceParts) {
    if (part.type === "code") {
      segments.push(part);
      continue;
    }
    // Split inline code in prose
    const inlineRe = /`[^`\n]*`/g;
    let iLast = 0;
    let im: RegExpExecArray | null;
    while ((im = inlineRe.exec(part.value)) !== null) {
      if (im.index > iLast) {
        segments.push({
          type: "text",
          value: part.value.slice(iLast, im.index),
        });
      }
      segments.push({ type: "code", value: im[0] });
      iLast = im.index + im[0].length;
    }
    if (iLast < part.value.length) {
      segments.push({ type: "text", value: part.value.slice(iLast) });
    }
  }
  return segments;
}

function parseOneWikiInner(inner: string): { slug: string; label: string } | null {
  const trimmed = inner.trim();
  if (!trimmed) return null;
  // [[slug|label]] — first pipe splits
  const pipe = trimmed.indexOf("|");
  let slugPart: string;
  let labelPart: string | undefined;
  if (pipe >= 0) {
    slugPart = trimmed.slice(0, pipe).trim();
    labelPart = trimmed.slice(pipe + 1).trim();
  } else {
    slugPart = trimmed;
  }
  // drop optional heading anchor [[slug#heading]]
  const hash = slugPart.indexOf("#");
  if (hash >= 0) slugPart = slugPart.slice(0, hash).trim();
  if (!slugPart) return null;
  const slug = normalizeWikiSlug(slugPart);
  if (!slug) return null;
  const label = labelPart && labelPart.length > 0 ? labelPart : slugPart.trim();
  return { slug, label };
}

/** Extract wiki links from markdown (skips code). */
export function extractWikiLinks(markdown: string): WikiLinkRef[] {
  const out: WikiLinkRef[] = [];
  const seen = new Set<string>();
  for (const seg of splitMarkdownCodeAware(markdown)) {
    if (seg.type === "code") continue;
    WIKI_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = WIKI_RE.exec(seg.value)) !== null) {
      const parsed = parseOneWikiInner(m[1] ?? "");
      if (!parsed) continue;
      const key = `${parsed.slug}::${parsed.label}::${m.index}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        slug: parsed.slug,
        label: parsed.label,
        raw: m[0],
      });
    }
  }
  return out;
}

/** Unique target slugs referenced by markdown. */
export function extractWikiSlugs(markdown: string): string[] {
  const set = new Set<string>();
  for (const link of extractWikiLinks(markdown)) {
    set.add(link.slug);
  }
  return [...set];
}

/**
 * Replace wiki links outside code with Markdown links when target is known.
 * Unknown targets become plain label text (no broken href).
 */
export function expandWikiLinks(
  markdown: string,
  known: Map<string, string> | Set<string>,
  opts?: { hrefPrefix?: string },
): string {
  const prefix = opts?.hrefPrefix ?? "/blog/";
  const has = (slug: string) =>
    known instanceof Map ? known.has(slug) : known.has(slug);

  return splitMarkdownCodeAware(markdown)
    .map((seg) => {
      if (seg.type === "code") return seg.value;
      return seg.value.replace(WIKI_RE, (raw, inner: string) => {
        const parsed = parseOneWikiInner(inner ?? "");
        if (!parsed) return raw;
        if (has(parsed.slug)) {
          // Standard MD link — remark will render <a href="/blog/slug">
          const href = `${prefix}${encodeURIComponent(parsed.slug)}`;
          // Escape brackets in label lightly
          const label = parsed.label.replace(/[\[\]]/g, "");
          return `[${label}](${href})`;
        }
        // Missing: plain text label with subtle marker for authors
        return parsed.label;
      });
    })
    .join("");
}

export type BacklinkSource = {
  slug: string;
  title: string;
  content: string;
  draft?: boolean;
};

/**
 * Posts that contain [[targetSlug]] (or pipe form) in body outside code.
 */
export function collectBacklinks(
  targetSlug: string,
  posts: BacklinkSource[],
  opts?: { includeDrafts?: boolean },
): { slug: string; title: string }[] {
  const target = normalizeWikiSlug(targetSlug);
  if (!target) return [];
  const includeDrafts = Boolean(opts?.includeDrafts);
  return posts
    .filter((p) => p.slug !== target)
    .filter((p) => includeDrafts || !p.draft)
    .filter((p) => extractWikiSlugs(p.content).includes(target))
    .map((p) => ({ slug: p.slug, title: p.title || p.slug }))
    .sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));
}

/** Build known-slug map from post metas (slug → title). */
export function knownSlugMap(
  posts: { slug: string; title: string }[],
): Map<string, string> {
  const m = new Map<string, string>();
  for (const p of posts) {
    m.set(p.slug, p.title);
  }
  return m;
}
