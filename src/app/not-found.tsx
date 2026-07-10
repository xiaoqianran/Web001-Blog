import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="mb-2 text-sm font-medium uppercase tracking-widest text-violet-600 dark:text-violet-400">
        404
      </p>
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        页面不存在
      </h1>
      <p className="mb-8 max-w-sm text-zinc-600 dark:text-zinc-400">
        你访问的页面可能已删除，或链接有误。
      </p>
      <Link
        href="/"
        className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        返回首页
      </Link>
    </div>
  );
}
