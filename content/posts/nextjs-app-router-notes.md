---
title: "App Router 笔记：路由、元数据与静态生成"
description: "整理 Next.js App Router 里写博客最常碰到的三个点：文件路由、Metadata API，以及 generateStaticParams。"
date: "2026-07-05"
tags: ["Next.js", "React"]
---

App Router 把「约定大于配置」推得更远：文件夹即路由，特殊文件名即职责。

## 文件即路由

```
app/
  page.tsx           → /
  blog/page.tsx      → /blog
  blog/[slug]/page.tsx → /blog/:slug
  about/page.tsx     → /about
```

动态段用方括号：`[slug]`。需要静态预渲染时，导出 `generateStaticParams`：

```ts
export async function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}
```

## 元数据

页面可以导出 `metadata` 对象，也可以用异步函数按文章生成：

```ts
export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);
  return {
    title: post.title,
    description: post.description,
  };
}
```

搜索引擎与社交分享卡片会用到这些字段。

## Server Components 与数据读取

在 Server Component 里可以直接读文件系统、查数据库，不必再包一层 API Route。博客从 `content/posts` 读 Markdown，就是典型用法：

```ts
// 仅在服务端运行
const posts = getAllPosts();
```

## 小结

| 需求 | 做法 |
|------|------|
| 列表页 | `app/blog/page.tsx` |
| 详情页 | `app/blog/[slug]/page.tsx` |
| SEO | `metadata` / `generateMetadata` |
| 静态路径 | `generateStaticParams` |

把路由和数据层理清后，UI 怎么写都顺手很多。
