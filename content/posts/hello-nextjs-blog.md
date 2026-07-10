---
title: "你好，Next.js 博客"
description: "从零搭一个简洁的 Markdown 博客，聊聊结构、写作方式和后续可扩展的方向。"
date: "2026-07-10"
tags: ["Next.js", "博客", "入门"]
---

欢迎来到这个博客。它用 **Next.js App Router** 构建，文章以 Markdown 存放在仓库里，构建时生成静态页面。

## 为什么这样做？

- **简单**：不依赖 CMS，用 Git 管理内容即可
- **快**：静态生成，访问延迟低
- **可控**：样式、路由、SEO 都在自己手里

## 项目结构

```
content/posts/     # Markdown 文章
src/app/           # 页面路由
src/components/    # UI 组件
src/lib/posts.ts   # 读取与解析文章
```

每篇文章的 frontmatter 至少包含：

| 字段 | 说明 |
|------|------|
| `title` | 标题 |
| `description` | 摘要 |
| `date` | 发布日期 |
| `tags` | 标签数组 |

## 下一步

你可以继续加：

1. 全文搜索
2. RSS / sitemap
3. 评论系统
4. 基于 CMS 的远程写作

先从写下一篇开始吧。
