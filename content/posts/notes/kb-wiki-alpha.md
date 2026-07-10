---
title: 知识库双链样例 Alpha
description: v1.1 双链演示 — 引用 Beta
date: "2026-07-10"
tags:
  - kb
  - wiki
draft: false
updatedAt: "2026-07-10T12:00:00.000Z"
---

# Alpha

这是知识库 v1.1 的双链样例。正文可引用另一篇笔记：

请阅读 [[kb-wiki-beta|Beta 样例]] 以验证互链。

也支持无别名形式：[[kb-wiki-beta]]。

代码块内不应被解析为链接：

```md
示例：[[kb-wiki-beta]] 在 fence 里保持原样
```

行内代码：`[[kb-wiki-beta]]` 也不应变成链接。
