# Blog — Next.js 个人博客

用 Next.js App Router + Markdown 搭建的简洁个人博客。

## 功能

- 首页精选文章 + 最近文章 + 标签云
- 文章列表与详情（Markdown + GFM）
- 代码块语法高亮（highlight.js）
- 文章目录（h2 / h3 自动生成）
- 标签筛选页
- 关于页
- 阅读时长、发布日期、上一篇/下一篇
- 手动深色 / 浅色 / 跟随系统主题
- SEO（Metadata / Open Graph / sitemap / robots）
- RSS 订阅（`/rss.xml`）
- 响应式布局
- Docker 部署（standalone + docker-compose）

## 快速开始

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

生产环境可设置站点地址（用于 sitemap / RSS / OG）：

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## 写文章

在 `content/posts/` 新建 Markdown 文件：

```md
---
title: "标题"
description: "摘要"
date: "2026-07-10"
tags: ["Next.js", "笔记"]
---

正文……
```

文件名即 slug，例如 `hello.md` → `/blog/hello`。

代码块可标注语言以获得高亮：

````md
```ts
const hello = "world";
```
````

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器 |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务 |
| `npm run lint` | ESLint |

## Docker

```bash
docker compose up --build -d
```

需已存在外部网络 `web`（例如与 Caddy 共用）。

## 技术栈

- Next.js 16（App Router）
- TypeScript
- Tailwind CSS v4 + Typography
- gray-matter / remark / rehype / remark-gfm
- highlight.js（代码高亮）
