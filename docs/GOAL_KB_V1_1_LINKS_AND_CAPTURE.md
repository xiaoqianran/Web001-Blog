# Goal — 知识库 v1.1：双链 · Lab 入库 · 真机可靠

> **调用（持续执行）**  
> `/goal 按 docs/GOAL_KB_V1_1_LINKS_AND_CAPTURE.md 执行。从阶段 A 开始，严格 Issue → branch → PR → CI → merge，一阶段一 PR；每阶段验收 DoD 后再进入下一阶段。遇到 Vercel/GitHub 真机问题当场修。直到阶段 D 完成。`

> **产品一句话**  
> 写作台 v1（文件夹 / 回收站 / GitHub 源）已可用；本 Goal 把它升级成 **「笔记之间能互相指、实验室内容能一键落进知识库、后台知道自己连的是不是真源」** —— 仍是 Markdown + Git + Vercel，不做协同/多租户。

> **前置**  
> `docs/GOAL_KNOWLEDGE_WORKSPACE.md` 阶段 A–F 及后续 harden（content-persist / loadTreeForAdmin / GitHub trash）已在 `main`。本 Goal **禁止**重做 v1 功能，只做增量。

---

## 0. 用户痛点（本 Goal 必须解决）

| # | 痛点 | 根因（当前） | 目标体验 |
|---|------|--------------|----------|
| P1 | 笔记之间没法像语雀/Obsidian 那样互相点 | 正文只有外链 / 站内绝对 URL，无 `[[slug]]`、无反链 | 写 `[[my-note]]` 即可跳转；编辑页 / 前台可见「被谁引用」 |
| P2 | HF 论文、RSS 好文还要手抄进知识库 | Lab 只读列表，与 `/admin` 脱节 | 卡片上「存为笔记」→ 选文件夹 → 生成草稿 md（含来源链接） |
| P3 | Vercel 上「树丢了 / 保存了但列表不对」心里没底 | 源在 GitHub，UI 不展示数据源与最近提交 | 编辑页只读 Git 历史；Admin 显示内容源（GitHub/本地）与健康提示 |

### 明确不做

| 不做 | 原因 |
|------|------|
| 完整图谱 / 力导向关系图 | 范围过大；v1.1 列表反链即可 |
| 实时协同、块级评论 | 非目标 |
| 镜像 Lab 全文到站内 SEO 抓取站 | 只存「笔记草稿 + 外链」 |
| 自建搜索引擎 / 向量库 | 已有 `/search`，本 Goal 不重做 |
| 抛弃 `content-persist` 契约 | **必须**继续：GitHub 优先读、本地 best-effort、禁止裸 `saveTreeToDisk` / `loadTreeFromDisk` 写路径 |

---

## 1. 内容与技术约束

| 约束 | 策略 |
|------|------|
| 双链语法 | Markdown 正文中的 `[[slug]]` 或 `[[slug\|显示名]]`；slug 须为已有文章（draft 在后台可见，前台仅 published） |
| 存储 | **不**新增双链表数据库；构建期 / 请求期扫 frontmatter+正文收集反向引用（可缓存于内存） |
| Lab 入库 | Server Action：读 Lab 条目 → `PostInput` 草稿 → `write` 走现有 GitHub/本地路径 + `registerDocInTreeBestEffort` + `loadTreeForAdmin` |
| 历史 | GitHub Commits API 只读最近 N 条；失败降级为「在 GitHub 打开」外链 |
| Vercel | 所有写 → 已有 GitHub Contents；树 mutate → `loadTreeForAdmin` + `persistTreeBestEffort` |
| 交付 | **一阶段一 PR**；Issue 标题 `feat(kb): v1.1 阶段X …` |

### 建议模块

```text
src/lib/wiki-links.ts          # 解析 [[slug]]、收集反链（纯函数优先）
src/components/WikiLinkText.tsx  # 或扩展现有 Markdown 渲染
src/app/actions/capture.ts     # Lab → 笔记
src/components/admin/GitHistory.tsx
src/components/admin/ContentSourceBadge.tsx
```

---

## 2. 阶段划分（顺序锁死）

```text
A 双链与反链  →  B Lab 一键入库  →  C Git 历史与健康  →  D 打磨与质量
```

---

### 阶段 A ✅/⏳ — 双链 `[[slug]]` + 反链（Must）

| ID | 功能 | 验收 |
|----|------|------|
| A1 | 解析器：`[[slug]]`、`[[slug\|title]]`；非法/空安全 | 单测覆盖 |
| A2 | 前台文章正文渲染为站内链接（published）；缺失 slug 显示为普通文本或弱提示 | 点开可达 `/blog/{slug}` |
| A3 | 编辑页或预览可见双链高亮/列表（至少一侧） | 作者写时知道链上了 |
| A4 | **反链**：某文被哪些文 `[[引用]]`（published；后台可含 draft） | 文章页或编辑侧栏有「反向链接」 |
| A5 | 不破坏现有 MD（代码块内 `[[x]]` 不解析） | 代码块回归 |

**DoD A**：至少 2 篇样例笔记互链；前台可点；反链列表正确；`npm test` 含 wiki-links 纯函数。

---

### 阶段 B — Lab 一键入库（Must）

| ID | 功能 | 验收 |
|----|------|------|
| B1 | `/lab/papers` 条目「存为笔记」：需登录；默认模板「论文笔记」 | 跳转编辑页或提示成功 |
| B2 | `/lab/feeds` 条目「存为笔记」：默认「读书/摘录」类模板 | 同上 |
| B3 | 可选目标 **folder**（下拉或 query，复用树 folder 列表） | 文件落在 `content/posts/{folder}/…` |
| B4 | 草稿 frontmatter：`draft: true`、title、description、来源 URL、tags 含 `lab` 或 `from-lab` | GitHub 可见 |
| B5 | 未登录 → 登录后回跳意图（from= 或等价） | 不丢上下文 |
| B6 | 走 `content-persist` / 现有 write，**禁止**新写裸盘路径 | 结构测试 |

**DoD B**：在有 `GITHUB_TOKEN` 的配置下，从 Lab 存一篇草稿，Admin 树/最近可见，编辑打开内容含外链。

---

### 阶段 C — Git 历史与内容源健康（Should）

| ID | 功能 | 验收 |
|----|------|------|
| C1 | 编辑页：最近 ≤5 条 commit message（GitHub API）；失败则仅外链 | 只读 |
| C2 | Admin 顶栏或状态区：内容源 `GitHub` / `本地`；Vercel 且无 token 明确告警 | 一眼可见 |
| C3 | 可选：tree 上次成功 put 的提示不要求；至少不在 UI 撒谎 | 文案诚实 |

**DoD C**：作者能判断「我现在连的是 GitHub 还是本地」；历史区不 500。

---

### 阶段 D — 打磨与质量（Must 收尾）

| ID | 功能 | 验收 |
|----|------|------|
| D1 | 空状态：无反链 / Lab 未配置时的文案 | 不空白惊吓 |
| D2 | smoke：wiki-links、capture action 结构（content-persist 门禁保持） | CI 绿 |
| D3 | README + 本 Goal 勾选；`docs/ACCEPTANCE` 若有条目则同步 | 文档一致 |
| D4 | lint + test + build；主路径手测清单写入 PR | 可宣称 v1.1 |

**DoD D**：`npm test` + `npm run lint` + `npm run build` 全绿；阶段 A–C 均已 merge。

---

## 3. 验收总表（Goal 完成定义）

1. **双链**：正文 `[[slug]]` 可点到站内文；代码块不误解析。  
2. **反链**：被引用文能列出引用方。  
3. **Lab 入库**：论文与信息流均可存为指定文件夹下的 **草稿**，来源 URL 保留。  
4. **可信**：Admin 标明内容源；编辑页有历史或 GitHub 外链。  
5. **契约**：仍遵守 GitHub 优先、`content-persist`、actions 无裸 `saveTreeToDisk` / `loadTreeFromDisk`。  
6. **过程**：A→D 各 Issue→PR→CI→merge；非目标未膨胀。

---

## 4. 每阶段标准作业（强制）

1. `gh issue create`：阶段 ID + 验收勾选  
2. `git checkout -b feat/kb-v11-phase-X`  
3. 实现 + `npm test` + `npm run lint` + `npm run build`  
4. PR：痛点 / 方案 / 测试计划  
5. CI 绿 → merge → 删分支  
6. 本文件阶段表勾 `✅`  
7. 进入下一阶段（无需再问是否继续，直到 D 或 blocker）

### Blocker 才暂停

- 无 `GITHUB_TOKEN` 且无法用本地盘验证写路径  
- GitHub API 限流无法测历史/入库  
- 用户改优先级  

---

## 5. 成功画像

刷 `/lab/papers` 看到一篇好论文 → **存为笔记** → 落在 `papers/2026/` 草稿 → 打开写作台补两句，写上 `[[related-method]]` → 保存 → 打开相关文能看到反链。  
全程知道数据在 **GitHub**，刷新不丢、Vercel 不装瞎。

---

## 6. 修订记录

| 日期 | 说明 |
|------|------|
| 2026-07-10 | 初版：知识库 v1 之后的 v1.1（双链 · Lab 入库 · 真机可信） |
