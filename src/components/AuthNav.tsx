import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { getSession } from "@/lib/session";

export async function AuthNav() {
  const session = await getSession();

  if (!session) {
    return (
      <Link
        href="/login"
        className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 sm:px-3 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
      >
        登录
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Link
        href="/admin"
        className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-violet-600 transition-colors hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-950/40"
      >
        后台
      </Link>
      <form action={logout}>
        <button
          type="submit"
          className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 sm:px-3 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
        >
          退出
        </button>
      </form>
    </div>
  );
}
