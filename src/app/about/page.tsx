import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "关于",
  description: "关于这个博客与作者。",
};

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          关于
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          你好，欢迎来到这个用 Next.js 搭建的个人博客。
        </p>
      </header>

      <div className="prose prose-zinc max-w-none dark:prose-invert">
        <p>
          这里用来记录技术笔记、产品思考与生活碎片。文章以 Markdown
          撰写，放在项目的 <code>content/posts/</code> 目录下，构建时静态生成。
        </p>
        <h2>技术栈</h2>
        <ul>
          <li>
            <strong>Next.js</strong> — App Router、静态生成
          </li>
          <li>
            <strong>TypeScript</strong> — 类型安全
          </li>
          <li>
            <strong>Tailwind CSS</strong> — 样式与排版
          </li>
          <li>
            <strong>Markdown + gray-matter</strong> — 文章内容与 frontmatter
          </li>
        </ul>
        <h2>如何写文章</h2>
        <p>
          在 <code>content/posts/</code> 新建 <code>.md</code> 文件，例如{" "}
          <code>my-first-post.md</code>：
        </p>
        <pre>
          <code>{`---
title: "文章标题"
description: "一句话摘要"
date: "2026-07-10"
tags: ["Next.js", "笔记"]
---

正文从这里开始……`}</code>
        </pre>
        <p>
          保存后刷新本地开发服务器，文章就会出现在{" "}
          <Link href="/blog">文章列表</Link> 中。
        </p>
      </div>
    </div>
  );
}
