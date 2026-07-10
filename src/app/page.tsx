import Link from "next/link";
import { getAllPosts, getAllTags } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { SearchForm } from "@/components/SearchForm";
import { Tag } from "@/components/Tag";

export default function HomePage() {
  const posts = getAllPosts();
  const tags = getAllTags();
  const [featured, ...rest] = posts;
  const recent = rest.slice(0, 4);

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-widest text-violet-600 dark:text-violet-400">
          Welcome
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
          写一点，
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            记一点
          </span>
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          这是一个基于 Next.js 的个人博客。文章用 Markdown 撰写，支持标签分类、阅读时长与深色模式。
        </p>
        <SearchForm />
      </section>

      {featured && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              最新文章
            </h2>
            <Link
              href="/blog"
              className="text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
            >
              查看全部 →
            </Link>
          </div>
          <PostCard post={featured} featured />
        </section>
      )}

      {recent.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            更多文章
          </h2>
          <div className="grid gap-4">
            {recent.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}

      {tags.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            标签
          </h2>
          <div className="flex flex-wrap gap-2">
            {tags.map(({ tag, count }) => (
              <Tag key={tag} tag={tag} count={count} />
            ))}
          </div>
        </section>
      )}

      {posts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            还没有文章。在 <code className="text-violet-600">content/posts/</code>{" "}
            下添加 Markdown 文件即可。
          </p>
        </div>
      )}
    </div>
  );
}
