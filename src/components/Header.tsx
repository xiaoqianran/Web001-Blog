import Link from "next/link";
import { AuthNav } from "./AuthNav";
import { NavLinks } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";
import { getSiteConfig } from "@/lib/site";

export function Header() {
  const site = getSiteConfig();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
      {/* Wider than the reading column so primary nav stays one row on desktop */}
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:max-w-7xl lg:px-8">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-sm shadow-violet-500/25 transition group-hover:shadow-md group-hover:shadow-violet-500/30">
            {site.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="hidden sm:inline">{site.name}</span>
        </Link>

        <div className="flex min-w-0 items-center gap-1 sm:gap-2">
          <NavLinks />
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <AuthNav />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
