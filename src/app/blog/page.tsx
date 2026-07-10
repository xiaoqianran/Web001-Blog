import type { Metadata } from "next";
import Link from "next/link";
import {
  flattenDocOrder,
  getDocsInFolder,
  getFolderChildren,
  loadTreeFromDisk,
} from "@/lib/content-tree";
import { getAllPosts, getAllTags, type PostMeta } from "@/lib/posts";
import { paginate, parsePageParam } from "@/lib/pagination";
import { Pagination } from "@/components/Pagination";
import { PostCard } from "@/components/PostCard";
import { Tag } from "@/components/Tag";

export const metadata: Metadata = {
  title: "全部文章",
  description: "浏览博客中的全部文章。",
};

type Props = {
  searchParams: Promise<{ page?: string; view?: string }>;
};

export default async function BlogPage({ searchParams }: Props) {
  const params = await searchParams;
  const view = params.view === "dir" ? "dir" : "stream";
  const allPosts = getAllPosts();
  const tags = getAllTags();
  const { items, page, totalPages, total } = paginate(
    allPosts,
    parsePageParam(params.page),
  );
  const tree = loadTreeFromDisk();
  const bySlug = new Map(allPosts.map((p) => [p.slug, p]));

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          全部文章
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <span>
            共 {total} 篇
            {view === "stream" ? ` · 第 ${page} / ${totalPages} 页` : " · 目录视图"}
          </span>
          <span className="flex gap-1 rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700">
            <Link
              href="/blog"
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                view === "stream"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : ""
              }`}
            >
              时间流
            </Link>
            <Link
              href="/blog?view=dir"
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                view === "dir"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : ""
              }`}
            >
              目录
            </Link>
          </span>
        </div>
      </header>

      {tags.length > 0 && view === "stream" && (
        <div className="flex flex-wrap gap-2">
          {tags.map(({ tag, count }) => (
            <Tag key={tag} tag={tag} count={count} />
          ))}
        </div>
      )}

      {view === "dir" ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <DirLevel tree={tree} parentId={null} bySlug={bySlug} depth={0} />
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {items.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
          {total === 0 && (
            <p className="text-center text-zinc-500 dark:text-zinc-400">
              暂无文章
            </p>
          )}
          <Pagination page={page} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}

function DirLevel({
  tree,
  parentId,
  bySlug,
  depth,
}: {
  tree: ReturnType<typeof loadTreeFromDisk>;
  parentId: string | null;
  bySlug: Map<string, PostMeta>;
  depth: number;
}) {
  const folders = getFolderChildren(tree, parentId);
  const docs = getDocsInFolder(tree, parentId).filter((d) => bySlug.has(d.slug));
  // published not in tree
  const orphan =
    parentId === null
      ? [...bySlug.values()].filter(
          (p) => !flattenDocOrder(tree).includes(p.slug),
        )
      : [];

  return (
    <ul className="space-y-2" style={{ marginLeft: depth ? 14 : 0 }}>
      {folders.map((f) => (
        <li key={f.id}>
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            📁 {f.name}
          </p>
          <DirLevel
            tree={tree}
            parentId={f.id}
            bySlug={bySlug}
            depth={depth + 1}
          />
        </li>
      ))}
      {docs.map((d) => {
        const p = bySlug.get(d.slug)!;
        return (
          <li key={d.slug}>
            <Link
              href={`/blog/${d.slug}`}
              className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
            >
              {p.title}
            </Link>
          </li>
        );
      })}
      {orphan.map((p) => (
        <li key={p.slug}>
          <Link
            href={`/blog/${p.slug}`}
            className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            {p.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
