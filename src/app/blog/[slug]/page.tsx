import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatDate,
  getAllPosts,
  getPostWithHtml,
  getRelatedPosts,
  seriesToSlug,
} from "@/lib/posts";
import { CodeCopy } from "@/components/CodeCopy";
import { GiscusComments } from "@/components/GiscusComments";
import { JsonLd } from "@/components/JsonLd";
import { ReadingProgress } from "@/components/ReadingProgress";
import { RelatedPosts } from "@/components/RelatedPosts";
import { ShareButtons } from "@/components/ShareButtons";
import { Tag } from "@/components/Tag";
import { TableOfContents } from "@/components/TableOfContents";
import {
  flattenDocOrder,
  folderBreadcrumb,
  getDocFolderId,
  loadTreeFromDisk,
} from "@/lib/content-tree";
import { getSiteConfig } from "@/lib/site";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  // Only published posts for public static paths
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await getPostWithHtml(slug);
    if (post.draft) {
      return { title: "文章未找到", robots: { index: false, follow: false } };
    }
    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    ).replace(/\/$/, "");
    const canonical = `${siteUrl}/blog/${slug}`;
    return {
      title: post.title,
      description: post.description,
      alternates: { canonical },
      openGraph: {
        title: post.title,
        description: post.description,
        type: "article",
        url: canonical,
        publishedTime: post.date,
        tags: post.tags,
        ...(post.cover ? { images: [{ url: post.cover }] } : {}),
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.description,
      },
    };
  } catch {
    return { title: "文章未找到" };
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;

  let post;
  try {
    post = await getPostWithHtml(slug);
  } catch {
    notFound();
  }

  // Drafts are admin-only (not linked publicly)
  if (post.draft) {
    notFound();
  }

  const allPosts = getAllPosts();
  const tree = loadTreeFromDisk();
  const treeOrder = flattenDocOrder(tree).filter((s) =>
    allPosts.some((p) => p.slug === s && !p.draft),
  );
  // Prefer knowledge-tree order for prev/next when available
  const order =
    treeOrder.length > 0 ? treeOrder : allPosts.map((p) => p.slug);
  const index = order.indexOf(slug);
  const prevSlug = index > 0 ? order[index - 1] : null;
  const nextSlug =
    index >= 0 && index < order.length - 1 ? order[index + 1] : null;
  const prev = prevSlug
    ? allPosts.find((p) => p.slug === prevSlug) ?? null
    : null;
  const next = nextSlug
    ? allPosts.find((p) => p.slug === nextSlug) ?? null
    : null;
  const related = getRelatedPosts(slug, 3);
  const site = getSiteConfig();
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  const pageUrl = `${siteUrl}/blog/${slug}`;
  const folderId = getDocFolderId(tree, slug) ?? post.folder ?? null;
  const crumbs = folderBreadcrumb(tree, folderId);

  return (
    <article>
      {(crumbs.length > 0 || true) && (
        <nav
          aria-label="面包屑"
          className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400"
          data-testid="post-breadcrumb"
        >
          <Link href="/blog" className="hover:text-violet-600">
            文章
          </Link>
          {crumbs.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1.5">
              <span aria-hidden>/</span>
              <span>{c.name}</span>
            </span>
          ))}
          <span aria-hidden>/</span>
          <span className="text-zinc-700 dark:text-zinc-300">{post.title}</span>
        </nav>
      )}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          author: { "@type": "Person", name: site.author },
          mainEntityOfPage: pageUrl,
          image: post.cover ? [post.cover] : undefined,
          keywords: post.tags.join(", "),
        }}
      />
      <ReadingProgress />

      <header className="mb-10 space-y-4 border-b border-zinc-200 pb-10 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Link
            href="/blog"
            className="font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400"
          >
            ← 文章
          </Link>
          <span>·</span>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span>·</span>
          <span>{post.readingTime}</span>
          {post.series && (
            <>
              <span>·</span>
              <Link
                href={`/series/${encodeURIComponent(seriesToSlug(post.series))}`}
                className="hover:text-violet-600"
              >
                {post.series}
              </Link>
            </>
          )}
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          {post.title}
        </h1>

        {post.description && (
          <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            {post.description}
          </p>
        )}

        {post.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover}
            alt=""
            className="mt-2 w-full rounded-xl border border-zinc-200 object-cover dark:border-zinc-800"
          />
        )}

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {post.tags.map((tag) => (
              <Tag key={tag} tag={tag} />
            ))}
          </div>
        )}

        <ShareButtons title={post.title} url={pageUrl} />
      </header>

      <TableOfContents items={post.toc} />

      <div
        className="prose prose-zinc max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-headings:tracking-tight"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />
      <CodeCopy />

      <RelatedPosts posts={related} />

      <GiscusComments />

      <nav className="mt-16 grid gap-4 border-t border-zinc-200 pt-10 sm:grid-cols-2 dark:border-zinc-800">
        {prev ? (
          <Link
            href={`/blog/${prev.slug}`}
            className="group rounded-xl border border-zinc-200 p-4 transition hover:border-violet-300 hover:bg-violet-50/50 dark:border-zinc-800 dark:hover:border-violet-800 dark:hover:bg-violet-950/30"
          >
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              上一篇
            </span>
            <span className="font-medium text-zinc-900 group-hover:text-violet-700 dark:text-zinc-50 dark:group-hover:text-violet-300">
              {prev.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
        {next && (
          <Link
            href={`/blog/${next.slug}`}
            className="group rounded-xl border border-zinc-200 p-4 text-right transition hover:border-violet-300 hover:bg-violet-50/50 dark:border-zinc-800 dark:hover:border-violet-800 dark:hover:bg-violet-950/30"
          >
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              下一篇
            </span>
            <span className="font-medium text-zinc-900 group-hover:text-violet-700 dark:text-zinc-50 dark:group-hover:text-violet-300">
              {next.title}
            </span>
          </Link>
        )}
      </nav>
    </article>
  );
}
