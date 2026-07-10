import type { Metadata } from "next";
import Link from "next/link";
import { PostForm } from "@/components/PostForm";
import { POST_TEMPLATES, getTemplate } from "@/lib/post-templates";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "新建文章",
  robots: { index: false, follow: false },
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

type Props = {
  searchParams: Promise<{ template?: string; folder?: string }>;
};

export default async function NewPostPage({ searchParams }: Props) {
  const session = await requireSession();
  if (session.userId === "static") return null;

  const sp = await searchParams;
  const tpl = getTemplate(sp.template ?? "blank") ?? POST_TEMPLATES[0]!;
  const folder = (sp.folder ?? "").replace(/^\/+|\/+$/g, "");

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
          选择模板或导入 .md
          {folder ? ` · 文件夹：${folder}` : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          {POST_TEMPLATES.map((t) => (
            <Link
              key={t.id}
              href={`/admin/posts/new?template=${t.id}${folder ? `&folder=${encodeURIComponent(folder)}` : ""}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                t.id === tpl.id
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 lg:p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <PostForm
          mode="create"
          initial={{
            slug: "",
            title: tpl.title,
            description: "",
            date: today(),
            tags: tpl.tags,
            content: tpl.content,
            draft: true,
            cover: "",
            pinned: false,
            series: "",
          }}
        />
      </div>
    </div>
  );
}
