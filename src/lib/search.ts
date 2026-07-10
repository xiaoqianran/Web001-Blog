import { getAllPosts, getPostBySlug, type PostMeta } from "./posts";

export type SearchDocument = PostMeta & {
  body: string;
};

export type SearchHit = PostMeta & {
  score: number;
  snippet: string;
};

export function getSearchIndex(): SearchDocument[] {
  // Published posts only
  return getAllPosts().map((meta) => {
    const post = getPostBySlug(meta.slug);
    return {
      ...meta,
      body: post.content,
    };
  });
}

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function extractSnippet(text: string, query: string, radius = 60): string {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx < 0) {
    const flat = text.replace(/\s+/g, " ").trim();
    return flat.length > 120 ? `${flat.slice(0, 120)}…` : flat;
  }
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + q.length + radius);
  const slice = text.slice(start, end).replace(/\s+/g, " ").trim();
  return `${start > 0 ? "…" : ""}${slice}${end < text.length ? "…" : ""}`;
}

/**
 * Lightweight full-text search over built-in Markdown posts.
 * Weights: title > tags > description > body.
 */
export function searchPosts(query: string, limit = 50): SearchHit[] {
  const q = normalize(query);
  if (!q) return [];

  const terms = q.split(/\s+/).filter(Boolean);
  const docs = getSearchIndex();

  const hits: SearchHit[] = [];

  for (const doc of docs) {
    const title = normalize(doc.title);
    const description = normalize(doc.description);
    const tags = normalize(doc.tags.join(" "));
    const body = normalize(doc.body);

    let score = 0;
    for (const term of terms) {
      if (title.includes(term)) score += 8;
      if (title === term) score += 4;
      if (tags.includes(term)) score += 5;
      if (description.includes(term)) score += 3;
      if (body.includes(term)) score += 1;

      // phrase boost for multi-char matches in title
      if (term.length >= 2 && title.includes(term)) score += 2;
    }

    if (score <= 0) continue;

    const snippetSource =
      doc.description ||
      doc.body.replace(/^#+\s.*$/gm, "").replace(/\s+/g, " ").trim();

    hits.push({
      slug: doc.slug,
      title: doc.title,
      description: doc.description,
      date: doc.date,
      tags: doc.tags,
      cover: doc.cover,
      draft: doc.draft,
      readingTime: doc.readingTime,
      score,
      snippet: extractSnippet(snippetSource, terms[0] ?? q),
    });
  }

  return hits.sort((a, b) => b.score - a.score || b.date.localeCompare(a.date)).slice(0, limit);
}
