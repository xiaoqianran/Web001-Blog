import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { DeletePostButton } from "@/components/DeletePostButton";
import { isStaticExport } from "@/lib/deploy";
import { isGitHubContentEnabled } from "@/lib/github-content";
import { getAllPosts, getAllTags, formatDate } from "@/lib/posts";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "管理后台",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    deleted?: string;
    error?: string;
    via?: string;
  }>;
};

export default async function AdminPage({ searchParams }: Props) {
  if (isStaticExport()) {
    // layout already shows the notice; avoid cookies/searchParams on static export
    return null;
  }

  const session = await requireSession();
  const posts = getAllPosts();
  const tags = getAllTags();
  const params = await searchParams;
  const viaGithub = params.via === "github";
  const gitEnabled = isGitHubContentEnabled();
  const onVercel = Boolean(process.env.VERCEL);

  const githubHint = viaGithub
    ? " 已提交到 GitHub，Vercel 重新部署后前台会更新（通常约 1 分钟）。"
    : "";

  const flash =
    params.created
      ? {
          type: "ok" as const,
          text: `已发布文章：${params.created}${githubHint}`,
        }
      : params.updated
        ? {
            type: "ok" as const,
            text: `已更新文章：${params.updated}${githubHint}`,
          }
        : params.deleted
          ? {
              type: "ok" as const,
              text: `已删除文章：${params.deleted}${githubHint}`,
            }
          : params.error === "notfound"
            ? { type: "err" as const, text: "文章不存在或已被删除" }
            : params.error === "delete"
              ? { type: "err" as const, text: "删除失败，请检查 GitHub Token 权限" }
              : params.error === "readonly"
                ? {
                    type: "err" as const,
                    text: "未配置 GITHUB_TOKEN：Vercel 无法写盘。请在环境变量中添加有 contents:write 权限的 Token。",
                  }
                : null;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-violet-600 dark:text-violet-400">
            Admin
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            管理后台
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            你好，
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {session.username}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/posts/new"
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
          >
            新建文章
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
            >
              退出登录
            </button>
          </form>
        </div>
      </header>

      {flash && (
        <p
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm ${
            flash.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          }`}
        >
          {flash.text}
        </p>
      )}

      <div
        className={`rounded-xl border px-4 py-3 text-sm ${
          gitEnabled
            ? "border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-200"
            : onVercel
              ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
              : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400"
        }`}
      >
        {gitEnabled ? (
          <>
            <span className="font-medium">存储：GitHub</span>
            <span className="mx-1.5">·</span>
            保存文章会提交到仓库并触发 Vercel 重新部署。
          </>
        ) : onVercel ? (
          <>
            <span className="font-medium">存储未就绪</span>
            <span className="mx-1.5">·</span>
            请配置环境变量 <code className="text-xs">GITHUB_TOKEN</code>{" "}
            才能在线写文章。
          </>
        ) : (
          <>
            <span className="font-medium">存储：本地磁盘</span>
            <span className="mx-1.5">·</span>
            写入 <code className="text-xs">content/posts/</code>
            。配置 <code className="text-xs">GITHUB_TOKEN</code> 可改为提交到
            GitHub。
          </>
        )}
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="文章" value={posts.length} />
        <StatCard label="标签" value={tags.length} />
        <StatCard label="会话" value="7 天" hint="JWT 有效期" />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            文章列表
          </h2>
          <Link
            href="/blog"
            className="text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
          >
            查看前台 →
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">标题</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">
                  日期
                </th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">
                  标签
                </th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {posts.map((post) => (
                <tr key={post.slug} className="bg-white dark:bg-zinc-950">
                  <td className="px-4 py-3">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="font-medium text-zinc-900 hover:text-violet-600 dark:text-zinc-50 dark:hover:text-violet-400"
                    >
                      {post.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                      {post.slug}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-500 sm:table-cell dark:text-zinc-400">
                    {formatDate(post.date)}
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-500 md:table-cell dark:text-zinc-400">
                    {post.tags.join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/posts/${encodeURIComponent(post.slug)}/edit`}
                        className="text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
                      >
                        编辑
                      </Link>
                      <DeletePostButton slug={post.slug} title={post.title} />
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    暂无文章。
                    <Link
                      href="/admin/posts/new"
                      className="ml-1 font-medium text-violet-600 hover:underline dark:text-violet-400"
                    >
                      写第一篇
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{hint}</p>
      )}
    </div>
  );
}
