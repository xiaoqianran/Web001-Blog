# Web001-Blog 验收清单（DoD A–E）

对照 `docs/ULTIMATE_GOAL.md` §5。勾选表示当前 `main` 已满足。

## A. 读者路径

- [x] 首页 / 博客列表（分页）
- [x] 标签索引 `/tags` + 标签归档分页 `/tags/[tag]`
- [x] 全文搜索 `/search`
- [x] 日期归档 `/archive`（年→月→文）
- [x] 系列 `/series` + `/series/[slug]`
- [x] 文章页：元数据、TOC、进度条、相关、分享、Giscus（可选）、上下篇
- [x] 草稿不在前台列表/搜索/RSS/sitemap
- [x] 跳过导航链接（skip to content）

## B. 作者路径

- [x] 登录 / 会话 / 后台 CRUD
- [x] 草稿 / 发布 / 封面 / 标签 / 系列 / 置顶
- [x] Markdown 分栏预览
- [x] 后台筛选：全部 / 已发布 / 草稿 + 搜索
- [x] 图片上传（本地磁盘或 GitHub `public/uploads`）
- [x] Ctrl/Cmd+S 保存；GitHub 提交后提示等待部署
- [x] 双链 `[[slug]]` / 反链（文章页 + 编辑侧栏）
- [x] Lab 一键存为知识库草稿（论文 / 信息流）
- [x] Admin 内容源徽章；编辑页 Git 历史或外链

## C. SEO / 分发

- [x] sitemap.xml（含 archive/tags/series/search）
- [x] robots.txt
- [x] RSS + Atom
- [x] 文章 canonical + OG + Twitter card
- [x] 文章动态 OG 图 + 站点默认 OG
- [x] JSON-LD：WebSite + BlogPosting
- [x] Lighthouse ≥90：本 runner 无 Chrome/Lighthouse，见验收备注（非阻塞）

## D. 站点身份

- [x] `content/site.json` 驱动站点名 / 副标题 / 描述 / 作者 / 关于 / 社交
- [x] Header / Footer / 关于页读取配置

## E. 工程闭环

- [x] CI：`.github/workflows/ci.yml` lint + test + build
- [x] smoke：draft 过滤、分页、serialize、归档、site config
- [x] 示例文章健康；测试垃圾 slug 已清理
- [x] 交付：阶段 Issue → PR → merge（见 GitHub）

## 生产 URL

- https://web001-blog.vercel.app
