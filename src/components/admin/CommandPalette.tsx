"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type CmdItem = {
  id: string;
  label: string;
  href: string;
  group: string;
};

type Props = {
  items: CmdItem[];
};

export function CommandPalette({ items }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items.slice(0, 20);
    return items
      .filter((i) => i.label.toLowerCase().includes(s) || i.id.includes(s))
      .slice(0, 20);
  }, [items, q]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs text-zinc-500 dark:border-zinc-700"
        data-testid="cmdk-open"
      >
        ⌘K 搜索
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[80]" data-testid="cmdk-dialog">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="关闭"
        onClick={() => setOpen(false)}
      />
      <div className="relative mx-auto mt-[15vh] w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-3 shadow-2xl dark:border-zinc-700 dark:bg-zinc-950">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索文档、新建、打开前台…"
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <ul className="mt-2 max-h-72 overflow-y-auto">
          {filtered.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <span>{item.label}</span>
                <span className="text-[10px] text-zinc-400">{item.group}</span>
              </Link>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-zinc-400">
              无匹配
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
