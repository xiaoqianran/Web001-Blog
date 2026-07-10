import type { Metadata } from "next";
import Link from "next/link";
import { PostForm } from "@/components/PostForm";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "新建文章",
  robots: { index: false, follow: false },
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function NewPostPage() {
  const session = await requireSession();
  if (session.userId === "static") return null;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Link
          href="/admin"
          className="text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
        >
          ← 返回后台
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          新建文章
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          填写 frontmatter 与 Markdown 正文。本地默认写入{" "}
          <code className="text-violet-600 dark:text-violet-400">content/posts/</code>
          ；Vercel 上配置 <code className="text-violet-600 dark:text-violet-400">GITHUB_TOKEN</code>{" "}
          后会提交到 GitHub 并自动重新部署。
        </p>
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <PostForm
          mode="create"
          initial={{
            slug: "",
            title: "",
            description: "",
            date: today(),
            tags: "",
            content: "",
          }}
        />
      </div>
    </div>
  );
}
