"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Props = {
  initialQuery?: string;
  autofocus?: boolean;
  compact?: boolean;
};

export function SearchForm({
  initialQuery = "",
  autofocus = false,
  compact = false,
}: Props) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <form onSubmit={onSubmit} className={compact ? "w-full" : "w-full max-w-xl"} role="search">
      <div className="flex gap-2">
        <input
          type="search"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索标题、标签或正文…"
          autoFocus={autofocus}
          autoComplete="off"
          className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          搜索
        </button>
      </div>
    </form>
  );
}
