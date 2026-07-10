import Link from "next/link";
import type { PostMeta } from "@/lib/posts";
import { formatDate } from "@/lib/posts";
import { Tag } from "./Tag";

type PostCardProps = {
  post: PostMeta;
  featured?: boolean;
};

export function PostCard({ post, featured }: PostCardProps) {
  if (featured) {
    return (
      <article className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-6 shadow-sm transition hover:border-violet-200 hover:shadow-md sm:p-8 dark:border-zinc-800 dark:from-violet-950/40 dark:via-zinc-950 dark:to-indigo-950/40 dark:hover:border-violet-800">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="rounded-full bg-violet-600 px-2 py-0.5 font-medium text-white">
            精选
          </span>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span>·</span>
          <span>{post.readingTime}</span>
        </div>
        {post.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover}
            alt=""
            className="mb-4 h-40 w-full rounded-xl object-cover"
          />
        )}
        <h2 className="mb-3 text-2xl font-bold tracking-tight text-zinc-900 transition group-hover:text-violet-700 sm:text-3xl dark:text-zinc-50 dark:group-hover:text-violet-300">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h2>
        <p className="mb-4 line-clamp-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          {post.description}
        </p>
        <div className="relative z-10 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Tag key={tag} tag={tag} />
          ))}
        </div>
      </article>
    );
  }

  return (
    <article className="group relative rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span>·</span>
        <span>{post.readingTime}</span>
      </div>
      {post.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover}
          alt=""
          className="mb-3 h-32 w-full rounded-lg object-cover"
        />
      )}
      <h2 className="mb-2 text-xl font-semibold tracking-tight text-zinc-900 transition group-hover:text-violet-700 dark:text-zinc-50 dark:group-hover:text-violet-300">
        <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
          {post.title}
        </Link>
      </h2>
      <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {post.description}
      </p>
      <div className="relative z-10 flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <Tag key={tag} tag={tag} />
        ))}
      </div>
    </article>
  );
}
