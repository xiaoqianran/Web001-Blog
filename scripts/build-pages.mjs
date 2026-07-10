#!/usr/bin/env node
/**
 * Build a static export for GitHub Pages.
 *
 * GitHub Pages cannot run Server Actions / proxy / Route Handlers, so this script:
 * 1. Temporarily parks unsupported modules outside `src/`
 * 2. Swaps in a static AuthNav
 * 3. Runs `next build` with `output: 'export'`
 * 4. Writes `rss.xml` + `.nojekyll` into `out/`
 * 5. Restores the original tree
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bakRoot = path.join(root, ".pages-bak");
const outDir = path.join(root, "out");

/** Paths relative to repo root that are incompatible with static export */
const PARK = [
  "src/proxy.ts",
  "src/app/actions",
  "src/app/admin",
  "src/app/login",
  "src/app/rss.xml",
  "src/components/LoginForm.tsx",
  "src/components/DeletePostButton.tsx",
  "src/components/PostForm.tsx",
];

const STATIC_AUTH_NAV = `export async function AuthNav() {
  // Static GitHub Pages deploy — no session / admin
  return null;
}
`;

function run(cmd, args, env = {}) {
  const res = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...env },
    shell: process.platform === "win32",
  });
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function resolveBasePath() {
  if (process.env.BASE_PATH !== undefined) {
    const raw = process.env.BASE_PATH.trim();
    if (!raw || raw === "/") return "";
    return raw.startsWith("/")
      ? raw.replace(/\/$/, "")
      : `/${raw.replace(/\/$/, "")}`;
  }
  const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
  if (!repo || repo.endsWith(".github.io")) return "";
  return `/${repo}`;
}

function parkUnsupported() {
  fs.mkdirSync(bakRoot, { recursive: true });
  const parked = [];

  for (const rel of PARK) {
    const from = path.join(root, rel);
    if (!fs.existsSync(from)) continue;
    const to = path.join(bakRoot, rel);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.renameSync(from, to);
    parked.push(rel);
    console.log(`parked ${rel}`);
  }

  // Backup + replace AuthNav (imports Server Actions)
  const authNav = path.join(root, "src/components/AuthNav.tsx");
  const authNavBak = path.join(bakRoot, "src/components/AuthNav.tsx");
  if (fs.existsSync(authNav)) {
    fs.mkdirSync(path.dirname(authNavBak), { recursive: true });
    fs.copyFileSync(authNav, authNavBak);
    fs.writeFileSync(authNav, STATIC_AUTH_NAV);
    parked.push("src/components/AuthNav.tsx#stub");
    console.log("stubbed src/components/AuthNav.tsx");
  }

  return parked;
}

function restoreUnsupported() {
  // Restore AuthNav from copy
  const authNav = path.join(root, "src/components/AuthNav.tsx");
  const authNavBak = path.join(bakRoot, "src/components/AuthNav.tsx");
  if (fs.existsSync(authNavBak)) {
    fs.copyFileSync(authNavBak, authNav);
    console.log("restored src/components/AuthNav.tsx");
  }

  for (const rel of PARK) {
    const to = path.join(root, rel);
    const from = path.join(bakRoot, rel);
    if (!fs.existsSync(from)) continue;
    fs.mkdirSync(path.dirname(to), { recursive: true });
    // remove stub dir/file if any
    if (fs.existsSync(to)) {
      fs.rmSync(to, { recursive: true, force: true });
    }
    fs.renameSync(from, to);
    console.log(`restored ${rel}`);
  }

  // Clean bak
  fs.rmSync(bakRoot, { recursive: true, force: true });
}

function writeRss(siteUrl, basePath) {
  const postsDir = path.join(root, "content/posts");
  const files = fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const slug = f.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(postsDir, f), "utf8");
      const { data, content } = matter(raw);
      return {
        slug,
        title: data.title ?? slug,
        description: data.description ?? "",
        date: data.date ?? new Date().toISOString(),
        content,
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const origin = siteUrl.replace(/\/$/, "");
  const prefix = basePath && basePath !== "/" ? basePath.replace(/\/$/, "") : "";

  const items = files
    .map((post) => {
      const link = `${origin}${prefix}/blog/${post.slug}/`;
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description>${escapeXml(post.description || post.title)}</description>
      <content:encoded><![CDATA[${post.content}]]></content:encoded>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blog — 写一点，记一点</title>
    <link>${origin}${prefix}/</link>
    <description>一个用 Next.js 构建的简洁个人博客，支持 Markdown 文章与标签。</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${origin}${prefix}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;

  fs.writeFileSync(path.join(outDir, "rss.xml"), xml, "utf8");
  console.log("wrote out/rss.xml");
}

function main() {
  let parked = false;
  try {
    parkUnsupported();
    parked = true;

    const basePath = resolveBasePath();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.GITHUB_REPOSITORY
        ? `https://${process.env.GITHUB_REPOSITORY.split("/")[0]}.github.io/${process.env.GITHUB_REPOSITORY.split("/")[1]}`
        : "http://localhost:3000");

    run("npx", ["next", "build"], {
      GITHUB_PAGES: "true",
      STATIC_EXPORT: "true",
      NEXT_OUTPUT: "export",
      NEXT_TELEMETRY_DISABLED: "1",
      NEXT_PUBLIC_SITE_URL: siteUrl,
      BASE_PATH: process.env.BASE_PATH ?? basePath,
      GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY ?? "",
      SESSION_SECRET:
        process.env.SESSION_SECRET ||
        "pages-static-export-placeholder-secret-32",
      ADMIN_USERNAME: process.env.ADMIN_USERNAME || "admin",
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "unused",
    });

    if (!fs.existsSync(outDir)) {
      console.error("out/ directory missing after build");
      process.exit(1);
    }

    fs.writeFileSync(path.join(outDir, ".nojekyll"), "");
    writeRss(siteUrl, basePath || process.env.BASE_PATH || "");

    const notFound = path.join(outDir, "404.html");
    if (!fs.existsSync(notFound)) {
      const nested = path.join(outDir, "404", "index.html");
      if (fs.existsSync(nested)) {
        fs.copyFileSync(nested, notFound);
      }
    }

    console.log("\nGitHub Pages build ready: out/");
    console.log(`  basePath: ${basePath || "(root)"}`);
    console.log(`  siteUrl:  ${siteUrl}`);
  } finally {
    if (parked) {
      restoreUnsupported();
    }
  }
}

main();
