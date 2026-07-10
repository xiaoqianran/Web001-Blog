---
title: "用 Tailwind 做深色模式的一点经验"
description: "prefers-color-scheme 与 class 策略怎么选，以及博客正文 prose 在深色下要注意什么。"
date: "2026-07-01"
tags: ["Tailwind", "CSS", "设计"]
---

深色模式不是简单反色。背景、边框、正文对比度都要重新想一遍。

## 两种常见策略

1. **跟随系统**：用 `prefers-color-scheme`，实现成本最低
2. **用户切换**：用 `class` 策略（如 `dark` 挂在 `html` 上），体验更好

本博客支持 **浅色 / 深色 / 跟随系统** 三种模式：把 `dark` class 挂在 `html` 上，并写入 `localStorage`。在 Tailwind v4 里用 `@custom-variant` 声明 class 策略后，配合 `dark:` 变体即可：

```html
<div class="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
  ...
</div>
```

## 正文排版

`@tailwindcss/typography` 的 `prose` 在深色下用：

```html
<article class="prose dark:prose-invert">
  ...
</article>
```

代码块建议单独加深背景，避免和卡片背景糊在一起：

```css
.prose pre {
  @apply rounded-xl bg-zinc-950 text-zinc-100;
}
```

## 对比度检查

- 正文与背景至少接近 WCAG AA
- 次要文字（日期、标签）可以淡一点，但别「看不见」
- 链接色在深色背景下略提亮（例如 violet-400）

设计上的克制，往往比多加动画更重要。
