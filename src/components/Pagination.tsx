import Link from "next/link";

type Props = {
  page: number;
  totalPages: number;
  basePath?: string;
};

export function Pagination({ page, totalPages, basePath = "/blog" }: Props) {
  if (totalPages <= 1) return null;

  const href = (p: number) => (p <= 1 ? basePath : `${basePath}?page=${p}`);

  const pages: number[] = [];
  const window = 2;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - window && i <= page + window)) {
      pages.push(i);
    }
  }

  const items: Array<number | "…"> = [];
  let prev = 0;
  for (const p of pages) {
    if (prev && p - prev > 1) items.push("…");
    items.push(p);
    prev = p;
  }

  return (
    <nav
      aria-label="分页"
      className="flex flex-wrap items-center justify-center gap-2 pt-4"
    >
      <PageLink href={href(page - 1)} disabled={page <= 1} label="上一页" />
      {items.map((item, idx) =>
        item === "…" ? (
          <span
            key={`e-${idx}`}
            className="px-1 text-sm text-zinc-400 dark:text-zinc-500"
          >
            …
          </span>
        ) : (
          <Link
            key={item}
            href={href(item)}
            aria-current={item === page ? "page" : undefined}
            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-sm font-medium transition ${
              item === page
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
          >
            {item}
          </Link>
        ),
      )}
      <PageLink
        href={href(page + 1)}
        disabled={page >= totalPages}
        label="下一页"
      />
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  label,
}: {
  href: string;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return (
      <span className="inline-flex h-9 items-center rounded-lg px-3 text-sm text-zinc-300 dark:text-zinc-600">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
    >
      {label}
    </Link>
  );
}
