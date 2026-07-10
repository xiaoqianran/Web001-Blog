"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

const nav = [
  { href: "/", label: "首页" },
  { href: "/blog", label: "文章" },
  { href: "/kb", label: "知识库" },
  { href: "/lab/papers", label: "论文" },
  { href: "/lab/feeds", label: "信息流" },
  { href: "/archive", label: "归档" },
  { href: "/tags", label: "标签" },
  { href: "/search", label: "搜索" },
  { href: "/about", label: "关于" },
];

function linkClass(active: boolean) {
  return `whitespace-nowrap rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
    active
      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
  }`;
}

function isActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  // Escape + body scroll lock while open (links already close the sheet on navigate)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {/* Desktop / tablet: single row, never wrap */}
      <nav
        className="hidden items-center gap-0.5 md:flex md:flex-nowrap lg:gap-1"
        aria-label="主导航"
      >
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={linkClass(isActive(pathname, item.href))}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Mobile: hamburger + sheet */}
      <div className="md:hidden">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? "关闭菜单" : "打开菜单"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "关闭" : "菜单"}</span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            {open ? (
              <>
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </>
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>

        {open && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[1px]"
              aria-label="关闭菜单遮罩"
              onClick={() => setOpen(false)}
            />
            <nav
              id={panelId}
              className="fixed top-16 right-3 left-3 z-[70] max-h-[min(70vh,28rem)] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
              aria-label="主导航"
            >
              <ul className="flex flex-col gap-0.5">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block ${linkClass(isActive(pathname, item.href))}`}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </>
        )}
      </div>
    </>
  );
}
