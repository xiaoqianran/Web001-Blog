import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { isStaticExport } from "@/lib/deploy";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "登录",
  description: "管理员登录",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ from?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  if (isStaticExport()) {
    return (
      <div className="mx-auto w-full max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          登录不可用
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          GitHub Pages 为静态托管，不支持管理员登录与写文章。请使用 Docker
          自托管版本。
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

  const session = await getSession();
  if (session) {
    redirect("/admin");
  }

  const params = await searchParams;
  const from =
    typeof params.from === "string" &&
    params.from.startsWith("/") &&
    !params.from.startsWith("//") &&
    !params.from.startsWith("/login")
      ? params.from
      : "/admin";

  return (
    <div className="mx-auto w-full max-w-md space-y-8">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          登录
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          使用管理员账号进入后台
        </p>
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <LoginForm from={from} />
      </div>
    </div>
  );
}
