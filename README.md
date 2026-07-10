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
- 管理员登录（JWT 会话 + 受保护后台）
- 后台新建 / 编辑 / 删除 Markdown 文章
- 响应式布局
- Docker 部署（standalone + docker-compose，content 目录可写）

## 快速开始

```bash
cp .env.example .env.local
# 编辑 .env.local：SESSION_SECRET / ADMIN_USERNAME / ADMIN_PASSWORD
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

- 登录页：[/login](http://localhost:3000/login)
- 管理后台：[/admin](http://localhost:3000/admin)（需登录）
- 新建文章：[/admin/posts/new](http://localhost:3000/admin/posts/new)

后台保存的文章会写入 `content/posts/*.md`，Docker 下通过 volume 挂载该目录以持久化。

### 环境变量

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SITE_URL` | 站点地址（sitemap / RSS / OG） |
| `SESSION_SECRET` | JWT 签名密钥（`openssl rand -base64 32`） |
| `ADMIN_USERNAME` | 管理员用户名 |
| `ADMIN_PASSWORD` | 管理员密码（开发可用） |
| `ADMIN_PASSWORD_HASH` | bcrypt 哈希（生产推荐，设置后优先于明文密码） |

生成 bcrypt 哈希：

```bash
node -e "require('bcryptjs').hash('your-password',10).then(console.log)"
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
