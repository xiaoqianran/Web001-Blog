import type { Metadata } from "next";
import { getAllPosts, getAllTags } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { Tag } from "@/components/Tag";

export const metadata: Metadata = {
  title: "全部文章",
  description: "浏览博客中的全部文章。",
};

export default function BlogPage() {
  const posts = getAllPosts();
  const tags = getAllTags();

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          全部文章
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          共 {posts.length} 篇 · 按发布时间倒序排列
        </p>
      </header>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(({ tag, count }) => (
            <Tag key={tag} tag={tag} count={count} />
          ))}
        </div>
      )}

      <div className="grid gap-4">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>

      {posts.length === 0 && (
        <p className="text-center text-zinc-500 dark:text-zinc-400">暂无文章</p>
      )}
    </div>
  );
}
