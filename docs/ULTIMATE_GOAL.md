# Ultimate Goal — Web001-Blog 完成态

> 调用方式：在对话里执行  
> `/goal` + 下方「一键目标正文」整段粘贴  
> 或：`/goal 按 docs/ULTIMATE_GOAL.md 完成 Web001-Blog 终极目标`

---

## 一句话目标

把 **Web001-Blog** 做成可长期运营的 **Next.js 个人技术博客完整产品**：访客体验、内容生产、SEO/订阅、质量与部署闭环均达到「几乎不用再补基础功能」的完成态，并持续以 **Issue → worktree → PR → 合并** 交付。

---

## 产品定位（约束）

| 项 | 决策 |
|----|------|
| 形态 | 个人博客 / 技术笔记，非多租户 CMS |
| 内容源 | Markdown + frontmatter（`content/posts/`） |
| 主部署 | **Vercel**（Node 运行时） |
| 写内容 | **GitHub Contents API**（`GITHUB_TOKEN`）提交 → 自动部署；本地可直写磁盘 |
| 评论 | **Giscus**（可选配置） |
| 协作交付 | 每个能力切片：`gh issue` → `git worktree` → `PR` → `merge main` |
| 不做 | 多用户注册、电商、复杂 RBAC、自建评论库、重型 Headless CMS |

---

## 现状快照（已完成，约 60%）

### 前台

- [x] 首页精选 + 最近 + 标签云  
- [x] 文章列表 / 详情 / 标签筛选  
- [x] Markdown + GFM + 代码高亮 + 一键复制  
- [x] TOC、阅读时长、上一篇/下一篇  
- [x] 搜索、草稿隐藏、相关文章、进度条、封面  
- [x] 分页、动态 OG 图  
- [x] 主题切换、响应式  

### 后台与安全

- [x] 登录 / JWT 会话 / proxy 守卫  
- [x] 后台 CRUD（本地磁盘 / GitHub API）  
- [x] 草稿开关  

### SEO / 订阅 / 部署

- [x] Metadata、sitemap、robots、RSS  
- [x] Vercel + Docker 能力  
- [x] Giscus 组件（需配置 env）  

### 已知债务

- [ ] 测试文章 slug 不规范（如 `202626-0711-01`）需清理或正规化  
- [ ] 无 CI 后缺少合并门禁  
- [ ] 关于页 / 站点配置硬编码  
- [ ] 无归档、系列、JSON-LD、Atom、键盘快捷键等  
- [ ] 后台无 Markdown 预览、无媒体上传、无仪表盘洞察  
- [ ] 无无障碍与性能专项验收  

---

## 完成态定义（Definition of Done）

当且仅当下列 **全部** 满足，目标可标记 `completed`：

### A. 访客体验完成

1. 阅读路径完整：列表分页、搜索、标签、归档（按年/月）、系列/合集（可选 frontmatter `series`）  
2. 文章页完整：TOC、进度条、相关文章、分享按钮、评论（Giscus 可开关）、键盘友好  
3. 无障碍：焦点可见、语义标题、图片 alt、对比度基本达标  
4. 移动端布局无横向溢出、主路径可点可读  

### B. 内容生产完成

5. 后台：新建 / 编辑 / 删除 / 草稿 / 封面 / 标签；**Markdown 实时预览**  
6. 后台：文章筛选（全部/已发布/草稿）、按标题搜索  
7. 媒体：支持上传图片到仓库 `public/uploads/`（经 GitHub API）或粘贴外链；表单内可插入图片 Markdown  
8. 站点配置：关于页内容、站点名/副标题/社交链接可配置（`content/site.json` 或 frontmatter 文件），非硬编码  

### C. 发现与 SEO 完成

9. JSON-LD `BlogPosting` / `WebSite`  
10. 站点级默认 OG + 文章动态 OG（已有）+ Twitter card  
11. RSS + **Atom**；sitemap 含归档/重要静态页  
12. `robots` 正确；404 体验良好  

### D. 质量与工程完成

13. 恢复 **CI**（lint + test + build），PR 合入前必须绿  
14. 冒烟测试扩展：分页、草稿过滤、搜索、serialize frontmatter  
15. 清理无效/测试 posts；示例文章质量统一  
16. README / `.env.example` 与真实能力一致；无过时 Pages 说明  

### E. 运维完成

17. Vercel 环境变量清单完整且文档化  
18. 生产冒烟：首页、文章、搜索、登录、后台列表可达  
19. 安全基线：无默认弱密码写死在文档生产示例；Token 不入库  

---

## 执行计划（按 PR 切片，可并行组队）

> 每个切片 = 1 Issue + 1 worktree + 1 PR。顺序可调，但依赖关系如下。

### 阶段 0 — 基线与卫生（先做）

| ID | 切片 | 产出 |
|----|------|------|
| P0-1 | 恢复 CI 门禁 | `.github/workflows/ci.yml`：lint/test/build；README 更新 |
| P0-2 | 内容卫生 | 删除/重命名测试 slug 文章；规范示例 frontmatter |
| P0-3 | 测试加固 | smoke：draft 过滤、paginate、slugify、serialize |

### 阶段 1 — 内容与信息架构

| ID | 切片 | 产出 |
|----|------|------|
| P1-1 | 归档页 | `/archive` 按年/月分组；导航入口 |
| P1-2 | 系列/合集 | frontmatter `series`；系列列表与系列内上下篇 |
| P1-3 | 站点配置 | `content/site.json`：name、tagline、social、about；前台读取 |
| P1-4 | 关于页数据化 | 关于页从 site 配置 / `content/about.md` 渲染 |

### 阶段 2 — 后台生产力

| ID | 切片 | 产出 |
|----|------|------|
| P2-1 | 编辑器预览 | 后台 Markdown 分栏预览（GFM） |
| P2-2 | 后台筛选 | 全部/发布/草稿 Tab + 标题过滤 |
| P2-3 | 图片上传 | 上传到 `public/uploads/` via GitHub API；插入语法 |
| P2-4 | 后台体验 | 保存 loading 态、冲突/失败提示优化、快捷键 Ctrl/Cmd+S |

### 阶段 3 — 前台打磨

| ID | 切片 | 产出 |
|----|------|------|
| P3-1 | 分享 | 复制链接、Twitter/X、（可选）原生 share API |
| P3-2 | 标签/归档分页 | 与 blog 一致的分页组件复用 |
| P3-3 | 无障碍与 UX | skip-link、focus ring、减少 layout shift |
| P3-4 | 首页增强 | 可选 pinned 文章（`pinned: true`）、空状态文案 |

### 阶段 4 — SEO / 订阅 / 结构化数据

| ID | 切片 | 产出 |
|----|------|------|
| P4-1 | JSON-LD | WebSite + BlogPosting |
| P4-2 | Atom feed | `/atom.xml` |
| P4-3 | 默认 OG | 站点根 `opengraph-image` |
| P4-4 | SEO 收尾 | canonical、twitter card 字段补全 |

### 阶段 5 — 验收与收口

| ID | 切片 | 产出 |
|----|------|------|
| P5-1 | 生产验收清单 | `docs/ACCEPTANCE.md` 勾选；Vercel 冒烟 |
| P5-2 | 文档完成态 | README 功能矩阵「全部 ✅」；CHANGELOG 或版本笔记 |
| P5-3 | 最终审查 | `/review` 或 reviewer 扫一遍；修 critical/high |

---

## 执行纪律（每次推进必须遵守）

1. **先 Issue，再 worktree**，禁止长时间直接在 `main` 堆功能  
2. Commit 规范：`feat|fix|docs|refactor|test|chore: …`  
3. 本地：`npm run lint && npm test && npm run build` 通过再开 PR  
4. PR 合并后同步 `main`，清理 worktree  
5. 每完成 1～2 个切片，用 `update_goal` 汇报进度；阶段结束做一次汇总  
6. 涉及密钥只写 Vercel env / `.env.local`，永不提交  
7. 优先 **可合并的薄切片**，避免巨型 PR  

---

## 进度计量

- **阶段 0～5** 共约 **18 个切片**  
- 完成度建议：`完成切片数 / 18`  
- 目标完成时：所有 DoD 勾选 + 生产 URL 可演示 + 文档一致  

---

## 一键目标正文（复制到 /goal）

```
终极目标：完成 Web001-Blog 个人技术博客产品完成态（详见仓库 docs/ULTIMATE_GOAL.md）。

约束：
- 主站 Vercel；内容 Markdown + GitHub API 写入；评论 Giscus（可配置）
- 交付纪律：Issue → git worktree → PR → merge main；conventional commits
- 本地每切片必须 lint + test + build 通过
- 不做多用户/自建评论库/重型 CMS

按 docs/ULTIMATE_GOAL.md 的阶段 0→5 切片顺序推进（可合理微调顺序），直到 Definition of Done 全部满足。
每完成切片：创建/关闭 Issue、开 PR 并合并、汇报进度与剩余切片。
最终：生产冒烟通过、README 与功能矩阵更新为完成态、标记 goal completed。
```

---

## 建议你怎么调用

```text
/goal 按 docs/ULTIMATE_GOAL.md 完成 Web001-Blog 终极目标。从阶段 0 开始，Issue→worktree→PR→merge，直到 DoD 全部完成。
```

若只想跑一段：

```text
/goal 仅执行 docs/ULTIMATE_GOAL.md 阶段 0（CI + 内容卫生 + 测试加固），完成后汇报。
```
