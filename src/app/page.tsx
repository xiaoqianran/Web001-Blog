import Link from "next/link";
import { getAllPosts, getAllTags, getPinnedPosts } from "@/lib/posts";
import { getSiteConfig } from "@/lib/site";
import { PostCard } from "@/components/PostCard";
import { SearchForm } from "@/components/SearchForm";
import { Tag } from "@/components/Tag";

export default function HomePage() {
  const site = getSiteConfig();
  const posts = getAllPosts();
  const tags = getAllTags();
  const pinned = getPinnedPosts();
  const pinnedSlugs = new Set(pinned.map((p) => p.slug));
  const feed = posts.filter((p) => !pinnedSlugs.has(p.slug));
  const featured = pinned[0] ?? feed[0];
  const recent = (featured && !pinnedSlugs.has(featured.slug)
    ? feed.slice(1)
    : feed.filter((p) => p.slug !== featured?.slug)
  ).slice(0, 4);

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-widest text-violet-600 dark:text-violet-400">
          Welcome
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
          {site.tagline.includes("，") ? (
            <>
              {site.tagline.split("，")[0]}，
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                {site.tagline.split("，").slice(1).join("，")}
              </span>
            </>
          ) : (
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              {site.tagline}
            </span>
          )}
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          {site.description}
        </p>
        <SearchForm />
      </section>

      {featured && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {pinned.length > 0 ? "置顶" : "最新文章"}
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
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              标签
            </h2>
            <Link
              href="/tags"
              className="text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
            >
              全部 →
            </Link>
          </div>
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
            还没有文章。在{" "}
            <code className="text-violet-600">content/posts/</code>{" "}
            下添加 Markdown 文件即可。
          </p>
        </div>
      )}
    </div>
  );
}
