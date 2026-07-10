import type { Metadata } from "next";
import Link from "next/link";
import { getSiteConfig } from "@/lib/site";

export function generateMetadata(): Metadata {
  const site = getSiteConfig();
  return {
    title: "关于",
    description: `关于 ${site.name} 与 ${site.author}`,
  };
}

export default function AboutPage() {
  const site = getSiteConfig();

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          关于
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          {site.author} · {site.name}
        </p>
      </header>

      <div className="prose prose-zinc max-w-none dark:prose-invert">
        <p>{site.about}</p>
        <p>
          站点标语：{site.tagline}。欢迎从{" "}
          <Link href="/blog">文章列表</Link>、<Link href="/archive">归档</Link>{" "}
          或 <Link href="/search">搜索</Link> 开始阅读。
        </p>
        {site.social.length > 0 && (
          <>
            <h2>链接</h2>
            <ul>
              {site.social.map((s) => (
                <li key={s.href + s.label}>
                  <a
                    href={s.href}
                    {...(s.href.startsWith("http")
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
