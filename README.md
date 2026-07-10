# Blog — Next.js 个人博客

用 Next.js App Router + Markdown 搭建的个人技术博客。  
主站 [Vercel](https://web001-blog.vercel.app)；内容源 `content/posts`；在线写文经 GitHub API。

> **完成态目标**：[`docs/ULTIMATE_GOAL.md`](docs/ULTIMATE_GOAL.md) · **验收**：[`docs/ACCEPTANCE.md`](docs/ACCEPTANCE.md)

## 功能矩阵（对标完成态）

| 能力 | 状态 | 说明 |
|------|------|------|
| 首页流 / 置顶 | ✅ | `pinned` |
| 文章列表分页 | ✅ | `/blog?page=` |
| 文章详情 + TOC + 进度 + 相关 | ✅ | |
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
| MD 预览 / 筛选 / 上传 | ✅ | |
| GitHub 写文 | ✅ | `GITHUB_TOKEN` |
| site.json 品牌配置 | ✅ | |
| Sitemap / robots / RSS / Atom | ✅ | |
| OG / Twitter / JSON-LD / canonical | ✅ | |
| CI lint+test+build | ✅ | |

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
