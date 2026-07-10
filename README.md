# Blog — Next.js 个人博客

用 Next.js App Router + Markdown 搭建的个人技术博客。  
主站 [Vercel](https://web001-blog.vercel.app)；内容源 `content/posts`；在线写文经 GitHub API。

> **完成态目标**：[`docs/ULTIMATE_GOAL.md`](docs/ULTIMATE_GOAL.md) · **知识库写作台 v1**：[`docs/GOAL_KNOWLEDGE_WORKSPACE.md`](docs/GOAL_KNOWLEDGE_WORKSPACE.md) · **知识库 v1.1（下一 Goal）**：[`docs/GOAL_KB_V1_1_LINKS_AND_CAPTURE.md`](docs/GOAL_KB_V1_1_LINKS_AND_CAPTURE.md) · **验收**：[`docs/ACCEPTANCE.md`](docs/ACCEPTANCE.md)

## 功能矩阵（对标完成态）

| 能力 | 状态 | 说明 |
|------|------|------|
| 首页流 / 置顶 | ✅ | Lab 优先 + `pinned` |
| 文章列表分页 | ✅ | `/blog?page=` · 目录视图 `?view=dir` |
| 知识库树浏览 | ✅ | `/kb` |
| 文章详情 + TOC + 进度 + 相关 | ✅ | 面包屑 + 树序上下篇 |
| 代码高亮 + 复制 | ✅ | |
| 标签索引 / 归档分页 | ✅ | `/tags` |
| 日期归档 | ✅ | `/archive` |
| 系列 | ✅ | `series` frontmatter |
| 全文搜索 | ✅ | `/search` |
| 草稿隐藏 | ✅ | `draft: true` |
| 分享 | ✅ | 复制链接 / Share / X |
| Giscus 评论 | ✅ | 可选 env |
| 主题切换 | ✅ | |
| 登录 + 后台 CRUD | ✅ | JWT |
| 写作台：最近编辑 / 搜索 / 树 | ✅ | `/admin` |
| 文件夹知识树 | ✅ | `content/tree.json` + 子目录 |
| 模板 / 导入导出 md / ⌘K | ✅ | |
| 回收站软删除 | ✅ | `/admin/trash` |
| MD 预览 / 筛选 / 上传 | ✅ | |
| GitHub 写文 | ✅ | `GITHUB_TOKEN` |
| site.json 品牌配置 | ✅ | |
| Sitemap / robots / RSS / Atom | ✅ | |
| OG / Twitter / JSON-LD / canonical | ✅ | |
| CI lint+test+build | ✅ | |
| HF 论文热点实验室 | ✅ | `/lab/papers` + 日更 Actions |
| RSS 信息流实验室 | ✅ | `/lab/feeds`（HN + arXiv 等） |

## Hugging Face 论文日刊

每日自动拉取 [HF Daily Papers](https://huggingface.co/papers)：

```bash
npm run fetch:hf-daily
# 数据写入 content/data/hf-daily/YYYY-MM-DD.json
```

- 页面：`/lab/papers`（导航「论文」）；摘要默认中文机翻，可切换 EN 原文
- 定时：`.github/workflows/hf-daily-papers.yml`（每天 UTC 08:00，可手动 workflow_dispatch）
- 可选 Secret：`HF_TOKEN`（提高 API 限额；无 token 通常也可匿名拉取）
- 可选 Secret：`DEEPL_API_KEY`（更高质量翻译；未配置时用免费 Google 接口）
- 跳过翻译：`node scripts/fetch-hf-daily.mjs --no-translate`

深度长文仍建议人工筛选后写入 `content/posts`，避免污染主时间线。

## RSS 信息流（方案 A 聚合）

只聚合**标题 / 摘要 / 外链**，不镜像全文：

```bash
npm run fetch:rss
# 数据 → content/data/rss-feeds/latest.json 与 YYYY-MM-DD.json
```

- 源配置：`content/feeds.json`（默认 Hacker News Frontpage、arXiv cs.AI / cs.LG）
- 页面：`/lab/feeds`（导航「信息流」）；标题/摘要支持中文机翻
- 语言：与 `/lab/papers` **全局同步**（顶栏与卡片上的 中文/EN 任一处切换，全部跟着变）
- 定时：`.github/workflows/rss-feeds.yml`（每 6 小时，含机翻；可手动 workflow_dispatch）
- 跳过翻译：`node scripts/fetch-rss-feeds.mjs --no-translate`
- 加源：编辑 `feeds.json` 后重新 fetch 即可

## 快速开始

```bash
cp .env.example .env.local
npm install
npm run dev
```

- 前台：http://localhost:3000  
- 登录：`/login`（默认见 `.env.example`，生产请改强密码）  
- 后台：`/admin`

## 环境变量

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SITE_URL` | 站点 URL |
| `SESSION_SECRET` | 会话签名 |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | 管理员 |
| `ADMIN_PASSWORD_HASH` | 可选 bcrypt |
| `GITHUB_TOKEN` | Vercel 写文章 / 上传必需 |
| `GITHUB_REPO` / `GITHUB_BRANCH` | 可选 |
| `NEXT_PUBLIC_GISCUS_*` | 可选评论 |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | 可选统计 |

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发 |
| `npm run build` / `start` | 生产 |
| `npm run lint` / `test` / `ci` | 质量门 |

## 部署

**Vercel**：连接 GitHub 仓库后 push `main` 自动部署。  

**Docker**（可写磁盘）：

```bash
OUTPUT_STANDALONE=true  # Dockerfile 已设置
docker compose up --build -d
```

## 技术栈

Next.js 16 · TypeScript · Tailwind v4 · gray-matter / remark / rehype · jose · GitHub Contents API
