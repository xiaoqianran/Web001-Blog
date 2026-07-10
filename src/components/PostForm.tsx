"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  createPost,
  updatePost,
  type PostFormState,
} from "@/app/actions/posts";
import { slugifyTitle } from "@/lib/slugify";

export type PostFormValues = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string;
  content: string;
  draft?: boolean;
  cover?: string;
  pinned?: boolean;
  series?: string;
};

type Props = {
  mode: "create" | "edit";
  initial: PostFormValues;
  originalSlug?: string;
};

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500";

const labelClass =
  "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export function PostForm({ mode, initial, originalSlug }: Props) {
  const action = mode === "create" ? createPost : updatePost;
  const [state, formAction, pending] = useActionState<PostFormState, FormData>(
    action,
    undefined,
  );

  const [title, setTitle] = useState(initial.title);
  /** null = auto-generate from title (create mode only) */
  const [slugOverride, setSlugOverride] = useState<string | null>(
    mode === "edit" ? initial.slug : null,
  );
  const slug =
    slugOverride !== null ? slugOverride : slugifyTitle(title);

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && originalSlug && (
        <input type="hidden" name="originalSlug" value={originalSlug} />
      )}

      {state?.error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          {state.error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="title" className={labelClass}>
            标题
          </label>
          <input
            id="title"
            name="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="文章标题"
          />
          {state?.fieldErrors?.title && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {state.fieldErrors.title}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="slug" className={labelClass}>
            Slug （URL）
          </label>
          <input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => setSlugOverride(e.target.value.toLowerCase())}
            className={inputClass}
            placeholder="my-first-post"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            title="小写字母、数字与连字符"
          />
          {state?.fieldErrors?.slug && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {state.fieldErrors.slug}
            </p>
          )}
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            访问路径：/blog/{slug || "…"}
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="date" className={labelClass}>
            发布日期
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={initial.date}
            className={inputClass}
          />
          {state?.fieldErrors?.date && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {state.fieldErrors.date}
            </p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="description" className={labelClass}>
            摘要
          </label>
          <input
            id="description"
            name="description"
            defaultValue={initial.description}
            className={inputClass}
            placeholder="一句话介绍这篇文章"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="tags" className={labelClass}>
            标签
          </label>
          <input
            id="tags"
            name="tags"
            defaultValue={initial.tags}
            className={inputClass}
            placeholder="Next.js, 笔记, 博客（逗号分隔）"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="cover" className={labelClass}>
            封面图 URL（可选）
          </label>
          <input
            id="cover"
            name="cover"
            type="url"
            defaultValue={initial.cover ?? ""}
            className={inputClass}
            placeholder="https://…"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="series" className={labelClass}>
            系列（可选）
          </label>
          <input
            id="series"
            name="series"
            defaultValue={initial.series ?? ""}
            className={inputClass}
            placeholder="例如：Next.js 入门"
          />
        </div>

        <div className="space-y-3 sm:col-span-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <input
              type="checkbox"
              name="draft"
              value="true"
              defaultChecked={Boolean(initial.draft)}
              className="mt-1 h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                存为草稿
              </span>
              <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                草稿不会出现在首页、列表、搜索、RSS 与 sitemap
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <input
              type="checkbox"
              name="pinned"
              value="true"
              defaultChecked={Boolean(initial.pinned)}
              className="mt-1 h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                首页置顶
              </span>
              <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                在首页「置顶」区域展示（仅已发布文章）
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="content" className={labelClass}>
          正文（Markdown）
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={18}
          defaultValue={initial.content}
          className={`${inputClass} font-mono text-[13px] leading-relaxed`}
          placeholder={"## 小节标题\n\n正文从这里开始……"}
          spellCheck={false}
        />
        {state?.fieldErrors?.content && (
          <p className="text-xs text-red-600 dark:text-red-400">
            {state.fieldErrors.content}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {pending
            ? "保存中…"
            : mode === "create"
              ? "保存文章"
              : "保存修改"}
        </button>
        <Link
          href="/admin"
          className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          取消
        </Link>
      </div>
    </form>
  );
}
