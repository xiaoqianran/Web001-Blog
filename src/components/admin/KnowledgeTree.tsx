import Link from "next/link";
import {
  createFolderAction,
  deleteFolderAction,
  movePostAction,
  reorderPostAction,
  syncTreeFromPostsAction,
} from "@/app/actions/tree";
import type { ContentTree } from "@/lib/content-tree";
import {
  getDocsInFolder,
  getFolderChildren,
} from "@/lib/content-tree";
import type { AdminPostRow } from "@/lib/posts";

type Props = {
  tree: ContentTree;
  postsBySlug: Map<string, AdminPostRow>;
  folders: { id: string; name: string }[];
};

export function KnowledgeTree({ tree, postsBySlug, folders }: Props) {
  const empty =
    tree.folders.length === 0 && tree.docs.length === 0;

  return (
    <div
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"
      data-testid="knowledge-tree"
    >
      {/* Mobile: collapsible drawer */}
      <details className="lg:hidden group" open={false}>
        <summary className="cursor-pointer list-none text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          📁 知识树（点开）
        </summary>
        <div className="mt-3 space-y-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <TreeBody
            tree={tree}
            postsBySlug={postsBySlug}
            folders={folders}
            empty={empty}
          />
        </div>
      </details>
      <div className="hidden space-y-4 lg:block">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            知识树
          </h2>
          <form action={syncTreeFromPostsAction}>
            <button
              type="submit"
              className="text-xs font-medium text-violet-600 hover:underline"
            >
              从磁盘同步
            </button>
          </form>
        </div>
        <TreeBody
          tree={tree}
          postsBySlug={postsBySlug}
          folders={folders}
          empty={empty}
        />
      </div>
    </div>
  );
}

function TreeBody({
  tree,
  postsBySlug,
  folders,
  empty,
}: Props & { empty: boolean }) {
  return (
    <>
      <div className="flex items-center justify-between gap-2 lg:hidden">
        <form action={syncTreeFromPostsAction}>
          <button
            type="submit"
            className="text-xs font-medium text-violet-600 hover:underline"
          >
            从磁盘同步
          </button>
        </form>
      </div>

      <form action={createFolderAction} className="flex gap-2">
        <input type="hidden" name="parentId" value="" />
        <input
          name="name"
          placeholder="新建根文件夹"
          className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-2 py-1 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          添加
        </button>
      </form>

      {empty ? (
        <p className="rounded-lg border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-500 dark:border-zinc-700">
          还没有文件夹。先「添加」一个，或点「从磁盘同步」导入已有文章。
          <br />
          <Link href="/admin/posts/new" className="text-violet-600 hover:underline">
            写第一篇 →
          </Link>
        </p>
      ) : (
        <TreeLevel
          tree={tree}
          parentId={null}
          postsBySlug={postsBySlug}
          folders={folders}
          depth={0}
        />
      )}
    </>
  );
}

function TreeLevel({
  tree,
  parentId,
  postsBySlug,
  folders,
  depth,
}: {
  tree: ContentTree;
  parentId: string | null;
  postsBySlug: Map<string, AdminPostRow>;
  folders: { id: string; name: string }[];
  depth: number;
}) {
  const childFolders = getFolderChildren(tree, parentId);
  const docs = getDocsInFolder(tree, parentId);

  return (
    <ul className="space-y-1" style={{ marginLeft: depth ? 12 : 0 }}>
      {childFolders.map((f) => (
        <li key={f.id} className="space-y-1">
          <div className="flex items-center gap-1 rounded-lg bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
            <span className="truncate">📁 {f.name}</span>
            <span className="flex-1" />
            <Link
              href={`/admin/posts/new?folder=${encodeURIComponent(f.id)}`}
              className="text-[10px] text-violet-600"
              title="在此文件夹新建"
            >
              新文
            </Link>
            <form action={createFolderAction} className="flex gap-1">
              <input type="hidden" name="parentId" value={f.id} />
              <input
                name="name"
                placeholder="子文件夹"
                className="w-16 rounded border border-zinc-200 px-1 py-0.5 text-[10px] dark:border-zinc-700 dark:bg-zinc-950"
              />
              <button type="submit" className="text-[10px] text-violet-600">
                +
              </button>
            </form>
            <form action={deleteFolderAction}>
              <input type="hidden" name="folderId" value={f.id} />
              <button type="submit" className="text-[10px] text-red-500">
                删
              </button>
            </form>
          </div>
          <TreeLevel
            tree={tree}
            parentId={f.id}
            postsBySlug={postsBySlug}
            folders={folders}
            depth={depth + 1}
          />
        </li>
      ))}
      {docs.map((d) => {
        const meta = postsBySlug.get(d.slug);
        return (
          <li
            key={d.slug}
            className="flex flex-wrap items-center gap-1 rounded-lg px-2 py-1 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <Link
              href={`/admin/posts/${encodeURIComponent(d.slug)}/edit`}
              className="min-w-0 flex-1 truncate font-medium text-zinc-800 hover:text-violet-600 dark:text-zinc-100"
            >
              📄 {meta?.title ?? d.slug}
            </Link>
            <form action={reorderPostAction} className="flex gap-0.5">
              <input type="hidden" name="slug" value={d.slug} />
              <button
                name="direction"
                value="up"
                type="submit"
                className="text-[10px] text-zinc-400"
              >
                ↑
              </button>
              <button
                name="direction"
                value="down"
                type="submit"
                className="text-[10px] text-zinc-400"
              >
                ↓
              </button>
            </form>
            <form action={movePostAction} className="flex gap-1">
              <input type="hidden" name="slug" value={d.slug} />
              <select
                name="folderId"
                defaultValue={d.folderId ?? "__root__"}
                className="max-w-[7rem] rounded border border-zinc-200 text-[10px] dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="__root__">根目录</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.id}
                  </option>
                ))}
              </select>
              <button type="submit" className="text-[10px] text-violet-600">
                移
              </button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}
