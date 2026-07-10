import type { Metadata } from "next";
import Link from "next/link";
import { restoreTrashAction } from "@/app/actions/trash";
import { PermanentDeleteButton } from "@/components/admin/PermanentDeleteButton";
import {
  githubListTrash,
  isGitHubContentEnabled,
} from "@/lib/github-content";
import { listTrash, type TrashItem } from "@/lib/trash";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "回收站",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ deleted?: string; purged?: string }>;
};

/** Prefer GitHub trash (Vercel source of truth); fall back to local disk. */
async function loadTrashItems(): Promise<TrashItem[]> {
  if (isGitHubContentEnabled()) {
    try {
      return await githubListTrash();
    } catch {
      return listTrash();
    }
  }
  return listTrash();
}

export default async function TrashPage({ searchParams }: Props) {
  await requireSession();
  const sp = await searchParams;
  const items = await loadTrashItems();

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Link
          href="/admin"
          className="text-sm font-medium text-violet-600 hover:underline"
        >
          ← 写作台
        </Link>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          回收站
        </h1>
        <p className="text-sm text-zinc-500">
          软删除的文档可恢复；永久删除不可撤销。
        </p>
      </header>

      {sp.deleted && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          已移入回收站
        </p>
      )}
      {sp.purged && (
        <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-900">
          已永久删除
        </p>
      )}

      <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {items.map((it) => (
          <li
            key={it.filename}
            className="flex flex-wrap items-center gap-3 bg-white px-4 py-3 dark:bg-zinc-950"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                {it.title}
              </p>
              <p className="text-xs text-zinc-400">
                {it.slug}
                {it.originalFolder ? ` · ${it.originalFolder}/` : ""} ·{" "}
                {new Date(it.deletedAt).toLocaleString("zh-CN", {
                  hour12: false,
                })}
              </p>
            </div>
            <form action={restoreTrashAction}>
              <input type="hidden" name="filename" value={it.filename} />
              <button
                type="submit"
                className="text-sm font-medium text-violet-600"
              >
                恢复
              </button>
            </form>
            <PermanentDeleteButton
              filename={it.filename}
              title={it.title}
            />
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-4 py-10 text-center text-sm text-zinc-500">
            回收站为空
          </li>
        )}
      </ul>
    </div>
  );
}
