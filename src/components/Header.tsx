import Link from "next/link";
import { AuthNav } from "./AuthNav";
import { NavLinks } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";
import { getSiteConfig } from "@/lib/site";

export function Header() {
  const site = getSiteConfig();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-5 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-sm shadow-violet-500/25 transition group-hover:shadow-md group-hover:shadow-violet-500/30">
            {site.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="hidden sm:inline">{site.name}</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <NavLinks />
          <AuthNav />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
