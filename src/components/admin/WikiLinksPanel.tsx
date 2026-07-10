import Link from "next/link";

type LinkItem = { slug: string; title?: string; label?: string };

type Props = {
  outgoing: LinkItem[];
  backlinks: LinkItem[];
};

/** Edit-side list of wiki out-links and backlinks. */
export function WikiLinksPanel({ outgoing, backlinks }: Props) {
  return (
    <aside
      className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/40"
      data-testid="wiki-links-panel"
    >
      <div>
        <h3 className="mb-1.5 font-semibold text-zinc-800 dark:text-zinc-100">
          本文双链
        </h3>
        {outgoing.length === 0 ? (
          <p className="text-zinc-500">正文中写 {`[[其他笔记slug]]`} 即可建立链接。</p>
        ) : (
          <ul className="space-y-1">
            {outgoing.map((o) => (
              <li key={`out-${o.slug}`}>
                <Link
                  href={`/admin/posts/${encodeURIComponent(o.slug)}/edit`}
                  className="text-violet-600 hover:underline dark:text-violet-400"
                >
                  {o.label || o.title || o.slug}
                </Link>
                <span className="ml-1 text-xs text-zinc-400">→ {o.slug}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h3 className="mb-1.5 font-semibold text-zinc-800 dark:text-zinc-100">
          反向链接
        </h3>
        {backlinks.length === 0 ? (
          <p className="text-zinc-500" data-testid="admin-backlinks-empty">
            暂无引用
          </p>
        ) : (
          <ul className="space-y-1" data-testid="admin-backlinks">
            {backlinks.map((b) => (
              <li key={`in-${b.slug}`}>
                <Link
                  href={`/admin/posts/${encodeURIComponent(b.slug)}/edit`}
                  className="text-violet-600 hover:underline dark:text-violet-400"
                >
                  {b.title || b.slug}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
