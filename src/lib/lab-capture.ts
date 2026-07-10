/**
 * Pure helpers: Lab paper/feed item → PostInput draft for knowledge base.
 * No FS / GitHub — callers use existing write + registerDocInTreeBestEffort.
 */

/** Local slugify so Node smoke can load this file without path aliases. */
function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export type LabCaptureKind = "paper" | "feed";

/** Match PostInput shape without importing posts.ts (keeps module loadable in smoke). */
export type LabCapturePostInput = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  content: string;
  draft?: boolean;
  cover?: string;
  pinned?: boolean;
  series?: string;
  updatedAt?: string;
  folder?: string;
};

export type LabCaptureSource = {
  kind: LabCaptureKind;
  title: string;
  summary?: string;
  sourceUrl: string;
  /** arXiv id, feed id, etc. — helps slug uniqueness */
  idHint?: string;
  extraLinks?: { label: string; url: string }[];
  authors?: string;
  folder?: string;
};

function ensureSlug(title: string, idHint?: string): string {
  let base = slugifyTitle(title);
  if (!base || base.length < 2) {
    base = slugifyTitle(idHint ?? "") || "note";
  }
  // lab- prefix keeps captures discoverable and reduces collision with hand notes
  let slug = `lab-${base}`.replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (slug.length > 80) slug = slug.slice(0, 80).replace(/-$/, "");
  if (!slug || slug === "lab") {
    slug = `lab-note-${Date.now().toString(36)}`;
  }
  return slug;
}

/** Build draft PostInput from a Lab capture source (pure). */
export function buildLabCapturePost(src: LabCaptureSource): LabCapturePostInput {
  const title =
    src.kind === "paper"
      ? src.title.startsWith("论文")
        ? src.title
        : `论文：${src.title}`
      : src.title || "摘录";
  const date = new Date().toISOString().slice(0, 10);
  const folder = (src.folder ?? "").replace(/^\/+|\/+$/g, "");
  const tags =
    src.kind === "paper"
      ? ["from-lab", "lab", "论文"]
      : ["from-lab", "lab", "摘录"];

  const links = [
    { label: "来源", url: src.sourceUrl },
    ...(src.extraLinks ?? []).filter((l) => l.url),
  ];
  const linkLines = links.map((l) => `- ${l.label}：${l.url}`).join("\n");
  const summary = (src.summary ?? "").trim();

  let content: string;
  if (src.kind === "paper") {
    content = `## 链接

${linkLines}

## 一句话

${summary ? summary.slice(0, 280) : ""}

## 方法

## 实验

## 可借鉴点

${src.authors ? `\n## 作者\n\n${src.authors}\n` : ""}
`;
  } else {
    content = `## 来源

${linkLines}

## 摘要 / 摘录

${summary || "（无摘要）"}

## 我的想法

`;
  }

  return {
    slug: ensureSlug(src.title, src.idHint),
    title,
    description: summary.slice(0, 200),
    date,
    tags,
    content,
    draft: true,
    folder: folder || undefined,
  };
}

/** Append numeric suffix for unique slug (pure). */
export function uniquifySlug(base: string, taken: (s: string) => boolean): string {
  if (!taken(base)) return base;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}-${i}`.slice(0, 80);
    if (!taken(candidate)) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`.slice(0, 80);
}
