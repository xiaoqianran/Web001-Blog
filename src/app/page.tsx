import Link from "next/link";
import {
  HomePapersSection,
  HomeRssSection,
} from "@/components/HomeLabSections";
import { PostCard } from "@/components/PostCard";
import { SearchForm } from "@/components/SearchForm";
import { Tag } from "@/components/Tag";
import { getLatestHfDaily } from "@/lib/hf-papers";
import { getAllPosts, getAllTags, getPinnedPosts } from "@/lib/posts";
import { getLatestRssFeeds } from "@/lib/rss-feeds";
import { getSiteConfig } from "@/lib/site";

export default function HomePage() {
  const site = getSiteConfig();
  const posts = getAllPosts();
  const tags = getAllTags();
  const pinned = getPinnedPosts();
  const pinnedSlugs = new Set(pinned.map((p) => p.slug));
  const feed = posts.filter((p) => !pinnedSlugs.has(p.slug));
  const featured = pinned[0] ?? feed[0];
  const recent = (
    featured && !pinnedSlugs.has(featured.slug)
      ? feed.slice(1)
      : feed.filter((p) => p.slug !== featured?.slug)
  ).slice(0, 3);

  const hf = getLatestHfDaily();
  const papers = (hf?.data.papers ?? []).slice(0, 5);

  const rss = getLatestRssFeeds();
  const rssItems: {
    sourceTitle: string;
    sourceId: string;
    item: (NonNullable<typeof rss>["data"]["feeds"][number]["items"])[number];
  }[] = [];
  if (rss?.data.feeds) {
    // Round-robin a few items from each source so HN + arXiv both show
    const queues = rss.data.feeds.map((f) => ({
      sourceTitle: f.title,
      sourceId: f.id,
      items: f.items.slice(0, 6),
      i: 0,
    }));
    while (rssItems.length < 8) {
      let added = false;
      for (const q of queues) {
        if (q.i >= q.items.length) continue;
        rssItems.push({
          sourceTitle: q.sourceTitle,
          sourceId: q.sourceId,
          item: q.items[q.i]!,
        });
        q.i += 1;
        added = true;
        if (rssItems.length >= 8) break;
      }
      if (!added) break;
    }
  }

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
        <p className="max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          主页以实验室内容为主：Hugging Face 论文热点与 RSS 信息流会自动更新；博客文章只在有内容时展示。
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <LabLink
            href="/lab/papers"
            title="HF 论文"
            desc={
              hf
                ? `${hf.data.count} 篇 · ${hf.date}`
                : "Daily Papers 速览"
            }
          />
          <LabLink
            href="/lab/feeds"
            title="RSS 信息流"
            desc={
              rss
                ? `${rss.data.itemCount} 条 · ${rss.date}`
                : "HN · arXiv 等"
            }
          />
          <LabLink
            href="/blog"
            title="博客文章"
            desc={
              posts.length > 0
                ? `${posts.length} 篇精选`
                : "偶尔写，不硬凑"
            }
          />
        </div>

        <SearchForm />
      </section>

      <HomePapersSection date={hf?.date ?? null} papers={papers} />

      <HomeRssSection date={rss?.date ?? null} items={rssItems} />

      {posts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {pinned.length > 0 ? "置顶 / 文章" : "博客文章"}
            </h2>
            <Link
              href="/blog"
              className="text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
            >
              全部文章 →
            </Link>
          </div>
          {featured && <PostCard post={featured} featured />}
          {recent.length > 0 && (
            <div className="grid gap-4">
              {recent.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
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
    </div>
  );
}

function LabLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-violet-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-violet-800"
    >
      <p className="text-sm font-semibold text-zinc-900 group-hover:text-violet-700 dark:text-zinc-50 dark:group-hover:text-violet-300">
        {title}
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{desc}</p>
    </Link>
  );
}
