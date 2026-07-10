# Ultimate Goal — Web001-Blog 完成态（产业对标重写）

> **调用**  
> `/goal 按 docs/ULTIMATE_GOAL.md 完成 Web001-Blog 终极目标。从阶段 0 开始，Issue→worktree→PR→merge，直到 DoD 全部完成。`

---

## 1. 为什么重写

上一版目标偏「功能清单堆叠」。  
本版在对照 **公开开源 / 主流博客产品** 的信息架构与能力后重写：先对齐行业对「完整博客」的共识，再落到 **我们能做、该做、不做** 的完成态。

### 对标对象（公开、可验证）

| 产品 | 类型 | 我们主要学什么 |
|------|------|----------------|
| **WordPress.org** | 自托管 CMS | 信息架构：首页流、分类/标签、日期归档、作者页、媒体库、草稿/发布、插件式扩展心智 |
| **Ghost** | 开源发布平台 | 写作体验优先、内置 SEO/社交、会员与 Newsletter 心智（我们只学理念，不照搬付费墙） |
| **Hugo + PaperMod** 等主题 | 开发者向静态博客 | 搜索、归档、taxonomy、代码复制、多语言钩子、极简导航 |
| **Astro / Hexo / 11ty** | SSG 生态 | 内容即文件、构建期 SEO、主题与内容分离、性能默认优秀 |
| **Bear / Micro.blog 等极简站** | Indie blog | 少即是多：阅读路径干净，避免 CMS 膨胀 |

> 结论：完整博客 = **读者好找 + 作者好写 + 搜索引擎好懂 + 运维可重复**。  
> 不是把 WordPress 插件市场搬过来。

---

## 2. 产品定位（对标后的取舍）

### 我们是什么

**个人 / 小团队技术博客**：Markdown 源内容 + Next.js 前台 + 轻量管理后台 + Vercel 发布。

对位关系：

| 对标 | 关系 |
|------|------|
| WordPress | 借鉴 **内容模型与信息架构**，不做插件宇宙与通用建站 |
| Ghost | 借鉴 **写作优先 + 内置 SEO/分享**，不做会员订阅电商核心 |
| Hugo/PaperMod | 借鉴 **归档/搜索/taxonomy/代码体验**，保留动态能力（登录、API 写文） |
| Medium/Substack | 不竞争算法分发与 newsletter 商业化（可选后期） |

### 硬约束

| 项 | 决策 |
|----|------|
| 内容源 | `content/posts/*.md` + frontmatter（Git 可审计） |
| 主站 | **Vercel** |
| 在线写文 | **GitHub Contents API** → 自动部署 |
| 评论 | **Giscus**（可选 env） |
| 交付 | **Issue → worktree → PR → merge** |
| 明确不做 | 多作者协作工作流、付费会员、电商、多租户、自建评论库、主题市场 |

---

## 3. 行业能力地图 → 我们的完成态

下表是「成熟博客产品通常具备的能力」与本项目目标映射。  
**Must** = 完成态必达；**Should** = 强烈建议；**Later** = 有意识延后。

### 3.1 读者侧（WordPress 归档心智 + PaperMod 阅读体验）

| 能力 | WP / Ghost / Hugo 常见形态 | 本项目现状 | 目标 |
|------|---------------------------|------------|------|
| 首页内容流 | 最新文章列表 | ✅ | Must 保持 |
| 文章详情 | 正文 + 元数据 + 导航 | ✅ | Must 保持 |
| 分类 | WP Categories（层级） | ❌ 仅 tags | **Should：categories 或把 tags 当主 taxonomy 并做标签索引页增强** |
| 标签 | Tags + 标签归档 | ✅ 标签页 | Must：分页 + 空状态 |
| 日期归档 | `/2024/07/`、归档总览 | ❌ | **Must：`/archive` 年/月** |
| 搜索 | WP 搜索 / PaperMod Fuse | ✅ | Must：体验打磨 |
| 分页 | 列表分页 | ✅ `/blog` | Must：标签/搜索结果复用 |
| 相关文章 | 同分类/标签 | ✅ | Must 保持 |
| 评论 | WP 评论 / Giscus | ✅ 组件 | Must：文档化一键配置 |
| 暗色模式 | 主题标配 | ✅ | Must 保持 |
| 代码体验 | 高亮 + 复制 | ✅ | Must 保持 |
| 分享 | 社交分享按钮 | ❌ | **Must：复制链接 + 系统 Share** |
| 系列文章 | 主题/插件 | ❌ | **Should：`series` frontmatter** |
| 作者页 | Author archive | ❌ 单作者 | **Should：关于/作者页合一（site config）** |
| 订阅 | RSS / Newsletter | 半 ✅ RSS | **Must：RSS+Atom；Later：邮件订阅** |
| 多语言 | WPML / PaperMod i18n | ❌ | Later |

### 3.2 作者侧（Ghost 编辑器心智 + WP 发布流）

| 能力 | 行业形态 | 现状 | 目标 |
|------|----------|------|------|
| 草稿 / 发布 | WP draft / Ghost drafts | ✅ draft | Must：状态清晰 |
| 可视化/预览 | Ghost 编辑器、WP 预览 | ❌ 无预览 | **Must：Markdown 分栏预览** |
| 媒体库 | WP Media Library | ❌ 外链/手写 | **Must：上传至 `public/uploads`（GitHub API）** |
| SEO 字段 | Yoast / Ghost SEO | 部分 | **Must：description、cover、canonical；Should：og 覆盖说明** |
| 定时发布 | WP schedule | ❌ | Later（可用 draft + 手动） |
| 修订历史 | WP revisions | Git 天然 | Must：依赖 Git，不在 UI 重做 |
| 写作快捷键 | 常见 | ❌ | Should：Ctrl/Cmd+S 保存 |
| 后台列表过滤 | 草稿/发布筛选 | 弱 | **Must：Tab + 搜索** |

### 3.3 发现与 SEO（Ghost「内置 SEO」标准）

Ghost 宣传点：sitemap、canonical、OG、Twitter Card、语义 HTML，**不靠一堆插件**。  
我们应对齐这个 **「开箱即 SEO」** 标准：

| 能力 | 行业 | 现状 | 目标 |
|------|------|------|------|
| Sitemap | 标配 | ✅ | Must + 归档等新路由 |
| robots.txt | 标配 | ✅ | Must |
| RSS | 标配 | ✅ | Must + Atom |
| Canonical | Ghost/WP SEO | ❌ | **Must** |
| Open Graph | 标配 | 文章 ✅ | **Must：站点默认 OG** |
| Twitter Card | 标配 | 弱 | **Must** |
| JSON-LD | 插件/主题 | ❌ | **Must：WebSite + BlogPosting** |
| 语义 HTML / 微格式 | Ghost | 部分 | Should |
| 性能 | Ghost/SSG 强调 | 未验收 | **Must：Lighthouse 移动端 Performance ≥ 90（文章页）** |

### 3.4 站点身份（所有成熟博客都有）

| 能力 | 行业 | 现状 | 目标 |
|------|------|------|------|
| 站点名 / 副标题 | 设置页 | 硬编码 | **Must：`content/site.json`** |
| 导航可配置 | 菜单 | 硬编码 | **Should** |
| 社交链接 | 页脚 | 无/弱 | **Must** |
| 关于页 | 固定页 | 静态文案 | **Must：配置或 `content/pages/about.md`** |
| Favicon / 品牌 | 主题 | 基础 | Should |
| 法律页 | 隐私/条款 | ❌ | Later（个人站可选） |

### 3.5 工程与运维

| 能力 | 行业 | 现状 | 目标 |
|------|------|------|------|
| CI | 开源项目标配 | 曾有后删 | **Must：恢复 lint/test/build** |
| 预览环境 | Vercel Preview | 可用 | Must 文档化 |
| 环境变量清单 | 12-factor | 部分 | Must 完整 |
| 备份 | Git = 备份 | ✅ | Must 保持「内容在 Git」 |
| 监控/分析 | Plausible/GA | ❌ | **Should：可选隐私友好统计** |

---

## 4. 信息架构（对标 WordPress 归档模型）

完成态路由图（读者视角）：

```
/                     首页：最新 + 精选/置顶 + 标签云 + 搜索入口
/blog                 全部文章（分页）
/blog/[slug]          文章：正文 · TOC · 进度 · 相关 · 分享 · 评论 · 上下篇
/tags                 标签索引（全部标签）
/tags/[tag]           标签归档（分页）
/archive              日期归档总览（年 → 月 → 文章）
/series               系列索引（若有 series）
/series/[name]        系列内文章列表
/search               全文搜索
/about                关于 / 作者
/rss.xml · /atom.xml  订阅
/sitemap.xml          SEO
/admin/**             作者后台（鉴权）
```

Frontmatter 完成态约定：

```yaml
title: ""
description: ""
date: "YYYY-MM-DD"
tags: []
categories: []      # 可选；若实现分类
series: ""          # 可选
cover: ""           # URL 或 /uploads/...
draft: false
pinned: false       # 首页置顶
```

---

## 5. 完成态 Definition of Done

目标 **completed** 当且仅当：

### A. 读者路径（对标 WP 浏览 + PaperMod 体验）

1. 能按 **时间 / 标签 / 搜索 / 归档** 找到任意已发布文章  
2. 文章页具备：元数据、TOC、进度条、相关、分享、可选评论、上下篇  
3. 移动端主路径可用；无严重横向溢出  
4. 基础无障碍：跳过导航、标题层级、焦点可见、有意义的链接文案  

### B. 作者路径（对标 Ghost「写作优先」）

5. 登录后台可完成：写、改、删、草稿、封面、标签、（可选）系列  
6. 编辑器 **实时预览**；保存成功反馈含「GitHub 已提交 / 等待部署」  
7. 图片可上传进仓库或明确引导外链；插入 Markdown 无摩擦  
8. 后台可按 全部/已发布/草稿 过滤  

### C. SEO / 分发（对标 Ghost 内置 SEO）

9. Sitemap + robots + RSS + Atom  
10. Canonical + OG + Twitter Card + 文章动态 OG 图 + 站点默认 OG  
11. JSON-LD：`WebSite` + `BlogPosting`  
12. 文章页 Lighthouse Performance（移动）≥ 90（合理网络；不含第三方评论阻塞的口径需在验收文档注明）  

### D. 站点身份

13. 站点名、副标题、社交链接、关于文案 **可配置**，非散落硬编码  
14. 页脚与导航展示社交与版权信息  

### E. 工程闭环

15. CI：PR 上 lint + test + build 必须通过  
16. 测试覆盖：草稿过滤、分页、搜索、slug、serialize  
17. 示例内容健康：无垃圾测试 slug；README 功能矩阵与实现一致  
18. 生产 URL 冒烟通过；密钥不进库  

---

## 6. 执行切片（按产品阶段，非纯技术堆砌）

每个切片 = **1 Issue + 1 worktree + 1 PR**。  
顺序可微调，但 **阶段 0 优先**。

### 阶段 0 — 对齐工程基线（对标开源项目）

| ID | 切片 | 对标理由 |
|----|------|----------|
| P0-1 | 恢复 CI 门禁 | 开源仓库默认有质量门 |
| P0-2 | 清理测试文章 + frontmatter 规范 | 内容卫生 = 产品可信 |
| P0-3 | 扩展 smoke tests | 回归保护信息架构规则 |

### 阶段 1 — 信息架构补齐（对标 WordPress 归档）

| ID | 切片 | 对标理由 |
|----|------|----------|
| P1-1 | `/archive` 年/月归档 | WP 日期归档是博客标配 |
| P1-2 | `/tags` 索引 + 标签页分页 | WP/PaperMod taxonomy |
| P1-3 | `series` 系列 | 长文/教程站刚需 |
| P1-4 | `content/site.json` + 关于页数据化 | 所有 CMS 都有「站点设置」 |
| P1-5 | `pinned` 首页置顶 | WP sticky / 精选 |

### 阶段 2 — 作者体验（对标 Ghost 写作）

| ID | 切片 | 对标理由 |
|----|------|----------|
| P2-1 | Markdown 分栏预览 | Ghost/WP 都强调写作预览 |
| P2-2 | 后台筛选与搜索 | WP 文章列表筛选 |
| P2-3 | 图片上传（GitHub → `public/uploads`） | WP 媒体库的轻量版 |
| P2-4 | 保存 UX + Cmd/Ctrl+S | 专业编辑器标配 |

### 阶段 3 — 读者打磨（对标 PaperMod + 社交）

| ID | 切片 | 对标理由 |
|----|------|----------|
| P3-1 | 分享：复制链接 / Web Share API | 现代博客标配 |
| P3-2 | 搜索/归档分页与空状态统一 | 列表模式一致 |
| P3-3 | 无障碍与跳过链接 | 合格站点底线 |
| P3-4 | 可选：隐私友好统计位（Plausible 脚本开关） | Ghost/WP 都有分析心智 |

### 阶段 4 — SEO 开箱（对标 Ghost「no plugins」）

| ID | 切片 | 对标理由 |
|----|------|----------|
| P4-1 | JSON-LD WebSite + BlogPosting | 结构化数据 |
| P4-2 | Atom + RSS 双 feed | 订阅生态 |
| P4-3 | 根 opengraph-image + Twitter card 补全 | 社交分享 |
| P4-4 | canonical + sitemap 扩展 | Ghost SEO 清单 |

### 阶段 5 — 验收与产品化收口

| ID | 切片 | 产出 |
|----|------|------|
| P5-1 | `docs/ACCEPTANCE.md` 按 DoD 勾选 | 可演示清单 |
| P5-2 | README 功能矩阵（对标表）全部 ✅ | 对外说明 |
| P5-3 | 生产冒烟 + 最终 code review | 修 critical/high |

**切片计数**：约 **20**（0:3 + 1:5 + 2:4 + 3:4 + 4:4 + 5:3）。  
进度：`完成数 / 20`。

---

## 7. 执行纪律

1. 禁止长期直接在 `main` 堆功能；**Issue → worktree → PR → merge**  
2. Conventional commits：`feat|fix|docs|refactor|test|chore|ci`  
3. 每切片本地：`npm run lint && npm test && npm run build`  
4. 密钥只进 Vercel / `.env.local`  
5. 薄 PR，可回滚；大功能拆切片  
6. 每完成切片更新 goal 进度；阶段结束小结  
7. 对标是 **能力对齐**，不是复制 UI 像素或 GPL 主题代码  

---

## 8. 一键 /goal 正文

```
终极目标：按 docs/ULTIMATE_GOAL.md（产业对标重写版）完成 Web001-Blog 产品完成态。

对标原则：
- WordPress：信息架构（归档/标签/列表/发布流）
- Ghost：写作优先 + 开箱 SEO/社交
- Hugo PaperMod：搜索/归档/taxonomy/阅读体验
- 不做 WP 插件宇宙、不做 Ghost 会员付费墙核心

约束：Vercel 主站；Markdown+GitHub API 写文；Giscus 可选；Issue→worktree→PR→merge。

从阶段 0 起按切片推进，直至 Definition of Done 全部满足。
每切片开 Issue、PR 并合并；阶段结束汇报进度与剩余。
最终：生产冒烟、README 对标矩阵完成、标记 goal completed。
```

---

## 9. 调用示例

**全量：**

```text
/goal 按 docs/ULTIMATE_GOAL.md 完成 Web001-Blog 终极目标。从阶段 0 开始，Issue→worktree→PR→merge，直到 DoD 全部完成。
```

**单阶段：**

```text
/goal 仅执行 docs/ULTIMATE_GOAL.md 阶段 1（信息架构：归档/标签/系列/站点配置），完成后汇报。
```
