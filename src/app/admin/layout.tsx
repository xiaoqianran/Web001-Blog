import Link from "next/link";
import { isStaticExport } from "@/lib/deploy";
import { requireSession } from "@/lib/session";

/**
 * Admin shell breaks out of the public reading column (`main.max-w-3xl`)
 * without CSS transforms (transform breaks textarea caret alignment in
 * overlay editors like @uiw/react-md-editor).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isStaticExport()) {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          管理后台不可用
        </h1>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          当前站点部署在 GitHub Pages（纯静态）。登录、写文章等需要 Node 服务，请使用
          Docker / 自托管部署。
        </p>
        <Link
          href="/"
          className="inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          返回首页
        </Link>
      </div>
    );
  }

  await requireSession();

  return (
    <div
      className="admin-wide-shell w-screen max-w-[100vw] px-4 sm:px-6 lg:px-10"
      data-testid="admin-wide-shell"
      style={{
        // Break out of main.max-w-3xl using margins only — no transform
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
      }}
    >
      <div className="mx-auto w-full max-w-6xl xl:max-w-7xl">{children}</div>
    </div>
  );
}
