import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
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
