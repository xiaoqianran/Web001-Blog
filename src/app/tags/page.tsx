import type { Metadata } from "next";
import { getAllTags } from "@/lib/posts";
import { Tag } from "@/components/Tag";

export const metadata: Metadata = {
  title: "标签",
  description: "浏览全部标签。",
};

export default function TagsIndexPage() {
  const tags = getAllTags();

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          标签
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          共 {tags.length} 个标签
        </p>
      </header>

      {tags.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          还没有标签。写文章时添加 tags 即可。
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map(({ tag, count }) => (
            <Tag key={tag} tag={tag} count={count} />
          ))}
        </div>
      )}
    </div>
  );
}
