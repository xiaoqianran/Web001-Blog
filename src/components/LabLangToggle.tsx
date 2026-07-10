"use client";

import { useLabLang, type LabLang } from "@/components/LabLangProvider";

type Props = {
  className?: string;
  /** When false, still render but both options always clickable (global sync). */
  size?: "sm" | "md";
};

/**
 * Global Lab language control — 论文 / 信息流 共享同一状态。
 */
export function LabLangToggle({ className = "", size = "sm" }: Props) {
  const { lang, setLang } = useLabLang();

  const btn = (value: LabLang, label: string) => {
    const active = lang === value;
    const pad = size === "md" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs";
    return (
      <button
        type="button"
        onClick={() => setLang(value)}
        aria-pressed={active}
        className={`${pad} font-medium transition ${
          active
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <span
      className={`inline-flex overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-700 ${className}`}
      role="group"
      aria-label="内容语言：论文与信息流同步"
      data-testid="lab-lang-toggle"
    >
      {btn("zh", "中文")}
      {btn("en", "EN")}
    </span>
  );
}
