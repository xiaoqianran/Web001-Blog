import type { Metadata } from "next";
import Link from "next/link";
import {
  flattenDocOrder,
  getDocsInFolder,
  getFolderChildren,
  loadTreeFromDisk,
} from "@/lib/content-tree";
import { getAllPosts, type PostMeta } from "@/lib/posts";

export const metadata: Metadata = {
  title: "知识库",
  description: "按文件夹浏览已发布文档。",
};

export default function KnowledgeBasePage() {
  const tree = loadTreeFromDisk();
  const published = new Map(
    getAllPosts().map((p) => [p.slug, p] as const),
  );
  // Only show published docs in tree order
  const order = flattenDocOrder(tree).filter((s) => published.has(s));
  // Also include published not yet in tree
  for (const p of published.keys()) {
    if (!order.includes(p)) order.push(p);
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-widest text-violet-600 dark:text-violet-400">
          Knowledge
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          知识库
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          按文件夹浏览已发布文章（仅公开内容）。
        </p>
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
        <KbLevel
          tree={tree}
          parentId={null}
          published={published}
          depth={0}
        />
        {order.length === 0 && (
          <p className="text-sm text-zinc-500">暂无已发布文档。</p>
        )}
      </div>
    </div>
  );
}

function KbLevel({
  tree,
  parentId,
  published,
  depth,
}: {
  tree: ReturnType<typeof loadTreeFromDisk>;
  parentId: string | null;
  published: Map<string, PostMeta>;
  depth: number;
}) {
  const folders = getFolderChildren(tree, parentId);
  const docs = getDocsInFolder(tree, parentId).filter((d) =>
    published.has(d.slug),
  );

  return (
    <ul className="space-y-2" style={{ marginLeft: depth ? 16 : 0 }}>
      {folders.map((f) => (
        <li key={f.id}>
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            📁 {f.name}
          </p>
          <KbLevel
            tree={tree}
            parentId={f.id}
            published={published}
            depth={depth + 1}
          />
        </li>
      ))}
      {docs.map((d) => {
        const p = published.get(d.slug)!;
        return (
          <li key={d.slug}>
            <Link
              href={`/blog/${d.slug}`}
              className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
            >
              {p.title}
            </Link>
            {p.description && (
              <p className="text-xs text-zinc-500 line-clamp-1">
                {p.description}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
