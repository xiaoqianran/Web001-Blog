"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  title: string;
  onTitleChange: (v: string) => void;
  slug: string;
  draft: boolean;
};

export function EditorChrome({ title, onTitleChange, slug, draft }: Props) {
  const [copied, setCopied] = useState(false);
  const frontPath = draft ? null : `/blog/${slug}`;

  const copyLink = async () => {
    if (!frontPath || typeof window === "undefined") return;
    const url = `${window.location.origin}${frontPath}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="space-y-2 border-b border-zinc-200 pb-4 dark:border-zinc-800"
      data-testid="editor-chrome"
    >
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="无标题"
        className="w-full border-0 bg-transparent text-3xl font-bold tracking-tight text-zinc-900 outline-none placeholder:text-zinc-300 focus:ring-0 dark:text-zinc-50 dark:placeholder:text-zinc-600"
        aria-label="文章标题"
      />
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span className="font-mono text-zinc-400">{slug || "slug"}</span>
        {draft && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            草稿
          </span>
        )}
        <span className="flex-1" />
        {frontPath && (
          <>
            <button
              type="button"
              onClick={copyLink}
              className="rounded-lg border border-zinc-200 px-2.5 py-1 font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              {copied ? "已复制链接" : "复制前台链接"}
            </button>
            <Link
              href={frontPath}
              target="_blank"
              className="rounded-lg border border-zinc-200 px-2.5 py-1 font-medium text-violet-600 hover:bg-violet-50 dark:border-zinc-700 dark:text-violet-400"
            >
              打开前台 ↗
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
