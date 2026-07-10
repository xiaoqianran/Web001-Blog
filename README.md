# Blog — Next.js 个人博客

用 Next.js App Router + Markdown 搭建的简洁个人博客。

## 功能

- 首页精选文章 + 最近文章 + 标签云
- 文章列表与详情（Markdown + GFM）
- 代码块语法高亮（highlight.js）+ 一键复制
- 全文搜索（`/search`，标题 / 标签 / 正文）
- 草稿 `draft: true`（前台隐藏，后台可管理）
- 阅读进度条、相关文章、封面图
- 文章目录（h2 / h3 自动生成）
- 标签筛选页
- 关于页
- 阅读时长、发布日期、上一篇/下一篇
- 手动深色 / 浅色 / 跟随系统主题
- SEO（Metadata / Open Graph / sitemap / robots）
- RSS 订阅（`/rss.xml`）
- 管理员登录（JWT 会话 + 受保护后台）
- 后台新建 / 编辑 / 删除 Markdown 文章（Docker / 本地可写；Vercel 为只读）
- 响应式布局
- Docker 部署（standalone + docker-compose）
- Vercel 部署（完整 Node 运行时：登录与前台可用）

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

### 本地 / Docker

后台保存会写入 `content/posts/*.md`（Docker 下通过 volume 持久化）。

### Vercel

Vercel 磁盘只读。配置 **`GITHUB_TOKEN`** 后，后台保存/删除会通过 **GitHub Contents API** 写入 `content/posts/`，并触发自动重新部署（约 1 分钟后前台更新）。

| 变量 | 说明 |
|------|------|
| `GITHUB_TOKEN` | 有该仓库写权限的 PAT（contents:write / classic `repo`） |
| `GITHUB_REPO` | 可选，默认 `VERCEL_GIT_REPO_OWNER/SLUG` 或 `xiaoqianran/Web001-Blog` |
| `GITHUB_BRANCH` | 可选，默认 `main` |

未配置 Token 时仍可用登录与阅读；写文章会提示配置 Token。

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器 |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务 |
| `npm run lint` | ESLint |
| `npm test` | 冒烟测试 |
| `npm run ci` | lint + test + build |

## 部署到 Vercel

```bash
# 已登录 CLI 时
vercel link          # 首次关联项目
vercel env pull      # 可选
vercel --prod        # 生产部署
```

在 Vercel 项目 **Settings → Environment Variables** 配置：

| Name | 示例 |
|------|------|
| `SESSION_SECRET` | `openssl rand -base64 32` 的结果 |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | 强密码 |
| `NEXT_PUBLIC_SITE_URL` | `https://你的项目.vercel.app` |

也可在 GitHub 连接仓库后，由 Vercel 对 `main` 自动部署。

## Docker

```bash
docker compose up --build -d
```

需已存在外部网络 `web`（例如与 Caddy 共用）。Docker 构建会设置 `OUTPUT_STANDALONE=true`。

## 技术栈

- Next.js 16（App Router）
- TypeScript
- Tailwind CSS v4 + Typography
- gray-matter / remark / rehype / remark-gfm
- highlight.js（代码高亮）
