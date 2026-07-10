import Link from "next/link";

export type BacklinkItem = {
  slug: string;
  title: string;
};

type Props = {
  items: BacklinkItem[];
  /** When empty, still render a quiet empty state if showEmpty */
  showEmpty?: boolean;
  className?: string;
};

export function Backlinks({ items, showEmpty = true, className = "" }: Props) {
  if (items.length === 0 && !showEmpty) return null;

  return (
    <section
      className={`rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/40 ${className}`}
      data-testid="backlinks"
      aria-label="反向链接"
    >
      <h2 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        反向链接
      </h2>
      {items.length === 0 ? (
        <p
          className="text-sm text-zinc-500 dark:text-zinc-400"
          data-testid="backlinks-empty"
        >
          暂无其他笔记用 {`[[slug]]`} 引用本文。
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it) => (
            <li key={it.slug}>
              <Link
                href={`/blog/${it.slug}`}
                className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
              >
                {it.title}
              </Link>
              <span className="ml-2 text-xs text-zinc-400">{it.slug}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
