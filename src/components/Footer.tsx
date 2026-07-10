import Link from "next/link";
import { getSiteConfig } from "@/lib/site";

export function Footer() {
  const site = getSiteConfig();

  return (
    <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-zinc-500 sm:flex-row sm:px-6 dark:text-zinc-400">
        <p>
          © {new Date().getFullYear()} {site.name}
          {site.author ? ` · ${site.author}` : ""}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {site.social.map((s) => (
            <Link
              key={s.href + s.label}
              href={s.href}
              className="text-zinc-400 transition hover:text-violet-600 dark:text-zinc-500 dark:hover:text-violet-400"
              {...(s.href.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {s.label}
            </Link>
          ))}
          <p className="text-zinc-400 dark:text-zinc-500">{site.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
