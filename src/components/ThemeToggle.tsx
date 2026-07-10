"use client";

import { useTheme, type Theme } from "./ThemeProvider";

const options: { value: Theme; label: string; icon: string }[] = [
  { value: "light", label: "浅色", icon: "☀" },
  { value: "dark", label: "深色", icon: "☾" },
  { value: "system", label: "系统", icon: "◐" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="flex items-center rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700"
      role="group"
      aria-label="主题切换"
    >
      {options.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            title={opt.label}
            aria-label={opt.label}
            aria-pressed={active}
            onClick={() => setTheme(opt.value)}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-sm transition ${
              active
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            }`}
          >
            <span aria-hidden>{opt.icon}</span>
          </button>
        );
      })}
    </div>
  );
}
