import type { TocItem } from "@/lib/posts";

type Props = {
  items: TocItem[];
};

export function TableOfContents({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="文章目录"
      className="mb-10 rounded-xl border border-zinc-200 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-900/50"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        目录
      </p>
      <ol className="space-y-1.5 text-sm">
        {items.map((item) => (
          <li
            key={item.id}
            className={item.level === 3 ? "ml-4" : undefined}
          >
            <a
              href={`#${item.id}`}
              className="text-zinc-600 transition hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
