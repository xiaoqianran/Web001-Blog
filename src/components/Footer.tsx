import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-2 px-5 py-8 text-sm text-zinc-500 sm:flex-row sm:px-6 dark:text-zinc-400">
        <p>© {new Date().getFullYear()} Blog. 用 Next.js 构建。</p>
        <div className="flex items-center gap-4">
          <Link
            href="/rss.xml"
            className="text-zinc-400 transition hover:text-violet-600 dark:text-zinc-500 dark:hover:text-violet-400"
          >
            RSS
          </Link>
          <p className="text-zinc-400 dark:text-zinc-500">写一点，记一点。</p>
        </div>
      </div>
    </footer>
  );
}
