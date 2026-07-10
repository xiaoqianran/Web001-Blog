"use client";

type Heading = { id: string; text: string; level: number };

function extractHeadings(md: string): Heading[] {
  const lines = md.split("\n");
  const out: Heading[] = [];
  for (const line of lines) {
    const m = /^(#{2,3})\s+(.+)$/.exec(line.trim());
    if (!m) continue;
    const level = m[1]!.length;
    const text = m[2]!.trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fff\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 60);
    out.push({ id, text, level });
  }
  return out;
}

export function DocOutline({ content }: { content: string }) {
  const headings = extractHeadings(content);
  if (headings.length === 0) {
    return (
      <p className="text-xs text-zinc-400" data-testid="doc-outline-empty">
        大纲：正文中的 ## / ### 会出现在这里
      </p>
    );
  }
  return (
    <nav data-testid="doc-outline" className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        大纲
      </p>
      <ul className="space-y-0.5">
        {headings.map((h, i) => (
          <li
            key={`${h.id}-${i}`}
            className={`text-xs text-zinc-600 dark:text-zinc-400 ${
              h.level === 3 ? "pl-3" : ""
            }`}
          >
            {h.text}
          </li>
        ))}
      </ul>
    </nav>
  );
}
