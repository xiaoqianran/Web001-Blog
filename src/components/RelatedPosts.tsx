import Link from "next/link";
import type { PostMeta } from "@/lib/posts";
import { formatDate } from "@/lib/posts";

type Props = {
  posts: PostMeta[];
};

export function RelatedPosts({ posts }: Props) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-16 border-t border-zinc-200 pt-10 dark:border-zinc-800">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        相关文章
      </h2>
      <ul className="grid gap-3 sm:grid-cols-3">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group flex h-full flex-col rounded-xl border border-zinc-200 p-4 transition hover:border-violet-300 hover:bg-violet-50/40 dark:border-zinc-800 dark:hover:border-violet-800 dark:hover:bg-violet-950/20"
            >
              <span className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                {formatDate(post.date)}
              </span>
              <span className="font-medium text-zinc-900 group-hover:text-violet-700 dark:text-zinc-50 dark:group-hover:text-violet-300">
                {post.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
