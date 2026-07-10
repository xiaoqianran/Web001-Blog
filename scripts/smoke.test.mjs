import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { pathToFileURL } from "node:url";

const root = process.cwd();

async function loadTs(rel) {
  const url = pathToFileURL(path.join(root, rel)).href;
  return import(url);
}

test("slugifyTitle from shipped module", async () => {
  const { slugifyTitle, isValidSlug } = await loadTs("src/lib/slugify.ts");
  assert.equal(slugifyTitle("Hello World"), "hello-world");
  assert.equal(slugifyTitle("  Foo   Bar__Baz "), "foo-bar-baz");
  assert.equal(isValidSlug("hello-world"), true);
  assert.equal(isValidSlug("Bad Slug"), false);
});

test("createPost/updatePost do not catch NEXT_REDIRECT inside try", () => {
  const src = fs.readFileSync(
    path.join(root, "src/app/actions/posts.ts"),
    "utf8",
  );
  assert.match(src, /rethrowNextControlFlow|isRedirectError/);
  // Multi-save: create overwrites if slug exists; update returns notice (no force redirect)
  assert.match(src, /exists|slugTaken/);
  assert.match(src, /notice:/);
  assert.match(src, /editUrl|\/admin\/posts\//);

  const form = fs.readFileSync(
    path.join(root, "src/components/PostForm.tsx"),
    "utf8",
  );
  // Status next to save buttons
  assert.match(form, /post-form-actions/);
  assert.match(form, /post-form-error|post-form-notice/);
  // Error banner should not be only at the top of the form
  const topErrorOnly =
    form.indexOf('role="alert"') < form.indexOf("post-form-actions") &&
    !form.includes("post-form-error");
  assert.equal(topErrorOnly, false);
});

test("parseMarkdownImport fills form fields from .md + frontmatter", async () => {
  const { parseMarkdownImport, isMarkdownFile } = await loadTs(
    "src/lib/import-markdown.ts",
  );
  const raw = `---
title: Imported Note
description: From disk
date: 2026-07-01
tags:
  - Next.js
  - 笔记
draft: true
pinned: false
series: Lab
cover: /uploads/a.png
slug: imported-note
---

# Body heading

Hello **world**.
`;
  const got = parseMarkdownImport(raw, "ignored.md");
  assert.equal(got.title, "Imported Note");
  assert.equal(got.slug, "imported-note");
  assert.equal(got.description, "From disk");
  assert.equal(got.date, "2026-07-01");
  assert.equal(got.tags, "Next.js, 笔记");
  assert.equal(got.draft, true);
  assert.equal(got.pinned, false);
  assert.equal(got.series, "Lab");
  assert.equal(got.cover, "/uploads/a.png");
  assert.match(got.content, /Hello \*\*world\*\*/);
  assert.doesNotMatch(got.content, /^---/);

  const plain = parseMarkdownImport("# Only Title\n\nbody", "my cool post.md");
  assert.equal(plain.title, "Only Title");
  assert.equal(plain.slug, "my-cool-post");
  assert.match(plain.content, /body/);

  // File type helper (browser File shape)
  assert.equal(
    isMarkdownFile({ name: "a.md", type: "" }),
    true,
  );
  assert.equal(
    isMarkdownFile({ name: "a.png", type: "image/png" }),
    false,
  );

  const formSrc = fs.readFileSync(
    path.join(root, "src/components/PostForm.tsx"),
    "utf8",
  );
  assert.match(formSrc, /parseMarkdownImport|import-markdown/);
  assert.match(formSrc, /import-md-button|选择 \.md|导入 \.md/);
});

test("paginate slices pages correctly", async () => {
  const { paginate, parsePageParam, POSTS_PER_PAGE } = await loadTs(
    "src/lib/pagination.ts",
  );
  const items = [1, 2, 3, 4, 5, 6, 7];
  const p1 = paginate(items, 1, 3);
  assert.deepEqual(p1.items, [1, 2, 3]);
  assert.equal(p1.page, 1);
  assert.equal(p1.totalPages, 3);
  assert.equal(p1.hasNext, true);
  const p2 = paginate(items, 2, 3);
  assert.deepEqual(p2.items, [4, 5, 6]);
  assert.equal(parsePageParam("2"), 2);
  assert.equal(parsePageParam("nope"), 1);
  assert.equal(POSTS_PER_PAGE, 6);
});

test("serializePost round-trips draft and cover", async () => {
  const { serializePost, isValidSlug } = await loadTs("src/lib/posts.ts");
  assert.equal(isValidSlug("hello-world"), true);
  assert.equal(isValidSlug("Bad"), false);

  const md = serializePost({
    slug: "sample",
    title: "Sample",
    description: "Desc",
    date: "2026-07-10",
    tags: ["A", "B"],
    content: "Hello **world**\n",
    draft: true,
    cover: "https://example.com/c.jpg",
  });
  const { data, content } = matter(md);
  assert.equal(data.title, "Sample");
  assert.equal(data.draft, true);
  assert.equal(data.cover, "https://example.com/c.jpg");
  assert.ok(Array.isArray(data.tags));
  assert.match(content, /Hello/);
});

test("getAllPosts excludes drafts by default", async () => {
  const dir = path.join(root, "content/posts");
  const draftPath = path.join(dir, "_smoke-draft-temp.md");
  fs.writeFileSync(
    draftPath,
    `---
title: "Smoke Draft"
description: "temp"
date: "2099-01-01"
tags: ["__smoke__"]
draft: true
---

draft body
`,
  );
  try {
    const { getAllPosts } = await loadTs("src/lib/posts.ts");
    const published = getAllPosts();
    assert.ok(
      !published.some((p) => p.slug === "_smoke-draft-temp"),
      "draft must not appear in public list",
    );
    const all = getAllPosts({ includeDrafts: true });
    assert.ok(
      all.some((p) => p.slug === "_smoke-draft-temp" && p.draft),
      "draft must appear when includeDrafts",
    );
  } finally {
    fs.unlinkSync(draftPath);
  }
});

test("search index source excludes drafts (getAllPosts)", async () => {
  // search.ts builds its index via getAllPosts() — prove drafts never enter that set
  const dir = path.join(root, "content/posts");
  const draftPath = path.join(dir, "_smoke-search-draft.md");
  fs.writeFileSync(
    draftPath,
    `---
title: "UniqueDraftTokenXYZ"
description: "temp"
date: "2099-01-02"
tags: ["__smoke__"]
draft: true
---

UniqueDraftTokenXYZ body
`,
  );
  try {
    const { getAllPosts } = await loadTs("src/lib/posts.ts");
    const published = getAllPosts();
    assert.ok(!published.some((p) => p.title === "UniqueDraftTokenXYZ"));
    // Real search.ts must use getAllPosts (static contract)
    const searchSrc = fs.readFileSync(
      path.join(root, "src/lib/search.ts"),
      "utf8",
    );
    assert.match(searchSrc, /getAllPosts\(\)/);
    assert.doesNotMatch(searchSrc, /getPostSlugs\(\)/);
  } finally {
    fs.unlinkSync(draftPath);
  }
});

test("getArchiveTree groups published posts", async () => {
  const { getArchiveTree, getAllPosts } = await loadTs("src/lib/posts.ts");
  const tree = getArchiveTree();
  const total = getAllPosts().length;
  const counted = tree.reduce(
    (n, y) => n + y.months.reduce((m, mo) => m + mo.posts.length, 0),
    0,
  );
  assert.equal(counted, total);
  if (total > 0) {
    assert.ok(tree.length >= 1);
    assert.ok(tree[0].year);
    assert.ok(tree[0].months.length >= 1);
  }
});

test("getSiteConfig loads content/site.json", async () => {
  const { getSiteConfig } = await loadTs("src/lib/site.ts");
  const site = getSiteConfig();
  assert.ok(site.name);
  assert.ok(site.tagline);
  assert.ok(Array.isArray(site.social));
});

test("channelTitle and RSS route use site config (not hard-coded brand)", async () => {
  const { getSiteConfig } = await loadTs("src/lib/site.ts");
  const { channelTitle } = await loadTs("src/lib/feeds.ts");
  const site = getSiteConfig();
  const title = channelTitle(site);
  assert.equal(title, `${site.name} — ${site.tagline}`);
  assert.ok(title.includes(site.name));
  assert.ok(title.includes(site.tagline));

  const rssSrc = fs.readFileSync(
    path.join(root, "src/app/rss.xml/route.ts"),
    "utf8",
  );
  assert.match(rssSrc, /getSiteConfig/);
  assert.match(rssSrc, /channelTitle/);
  assert.match(rssSrc, /site\.description/);
  assert.doesNotMatch(rssSrc, /Blog — 写一点，记一点/);
  assert.doesNotMatch(
    rssSrc,
    /一个用 Next\.js 构建的简洁个人博客，支持 Markdown 文章与标签。/,
  );
});

test("article OG image and revalidate paths use site identity routes", () => {
  const og = fs.readFileSync(
    path.join(root, "src/app/blog/[slug]/opengraph-image.tsx"),
    "utf8",
  );
  assert.match(og, /getSiteConfig/);
  assert.match(og, /site\.name|site\.tagline|brandLine/);
  assert.doesNotMatch(og, /Blog · 写一点，记一点/);

  const actions = fs.readFileSync(
    path.join(root, "src/app/actions/posts.ts"),
    "utf8",
  );
  assert.match(actions, /revalidatePath\("\/archive"\)/);
  assert.match(actions, /revalidatePath\("\/atom\.xml"\)/);
  assert.match(actions, /revalidatePath\("\/series"/);
});

test("HF daily papers data and helpers", async () => {
  // Pure helpers (no fs) — load shared module directly for Node ESM.
  const { paperDisplaySummary, paperDisplayTitle, hasChineseSummary } =
    await loadTs("src/lib/hf-paper-shared.ts");

  const dir = path.join(root, "content/data/hf-daily");
  assert.ok(fs.existsSync(dir), "hf-daily dir");
  const dates = fs
    .readdirSync(dir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .map((f) => f.replace(/\.json$/, ""))
    .sort((a, b) => b.localeCompare(a));
  assert.ok(dates.length >= 1, "seed JSON should exist after fetch");
  const latestPath = path.join(dir, `${dates[0]}.json`);
  const latest = JSON.parse(fs.readFileSync(latestPath, "utf8"));
  assert.ok(latest.papers.length > 0);
  assert.ok(latest.papers[0].id);
  assert.ok(latest.papers[0].title);
  assert.ok(latest.papers[0].urls.hf.includes("huggingface.co/papers"));
  assert.ok(latest.attribution);

  // Prefer translated fields when present (seed should include summaryZh).
  const withZh = latest.papers.find((p) => p.summaryZh?.trim());
  if (withZh) {
    assert.ok(hasChineseSummary(withZh));
    assert.equal(paperDisplaySummary(withZh, "zh"), withZh.summaryZh.trim());
    assert.equal(paperDisplaySummary(withZh, "en"), withZh.summary);
  }

  const sample = {
    id: "x",
    title: "Hello Paper",
    titleZh: "你好论文",
    summary: "English abstract here.",
    summaryZh: "这里是中文摘要。",
    authors: [],
    publishedAt: null,
    submittedOnDailyAt: null,
    submitter: null,
    upvotes: null,
    urls: { hf: "https://huggingface.co/papers/x", arxiv: null, pdf: null },
  };
  assert.equal(paperDisplayTitle(sample, "zh"), "你好论文");
  assert.equal(paperDisplayTitle(sample, "en"), "Hello Paper");
  assert.equal(paperDisplaySummary(sample, "zh"), "这里是中文摘要。");
  assert.equal(paperDisplaySummary(sample, "en"), "English abstract here.");
});

test("RSS feed parser and seed data", async () => {
  const { parseFeedXml } = await import(
    pathToFileURL(path.join(root, "scripts/lib/parse-rss.mjs")).href
  );
  const sample = `<?xml version="1.0"?>
<rss version="2.0"><channel>
<title>Demo</title><link>https://example.com/</link>
<item>
  <title><![CDATA[Hello RSS]]></title>
  <link>https://example.com/a</link>
  <guid>https://example.com/a</guid>
  <description><![CDATA[<p>Summary body</p>]]></description>
  <pubDate>Fri, 10 Jul 2026 12:00:00 +0000</pubDate>
</item>
</channel></rss>`;
  const parsed = parseFeedXml(sample);
  assert.equal(parsed.title, "Demo");
  assert.equal(parsed.items.length, 1);
  assert.equal(parsed.items[0].title, "Hello RSS");
  assert.equal(parsed.items[0].link, "https://example.com/a");
  assert.match(parsed.items[0].summary, /Summary body/);

  const feedsConfig = JSON.parse(
    fs.readFileSync(path.join(root, "content/feeds.json"), "utf8"),
  );
  assert.ok(Array.isArray(feedsConfig.feeds));
  assert.ok(feedsConfig.feeds.some((f) => f.id === "hacker-news"));
  assert.ok(feedsConfig.feeds.some((f) => String(f.id).startsWith("arxiv")));

  const dir = path.join(root, "content/data/rss-feeds");
  assert.ok(fs.existsSync(path.join(dir, "latest.json")), "rss seed latest.json");
  const latest = JSON.parse(
    fs.readFileSync(path.join(dir, "latest.json"), "utf8"),
  );
  assert.ok(latest.feeds?.length >= 1);
  assert.ok(latest.itemCount >= 1);
  const hn = latest.feeds.find((f) => f.id === "hacker-news");
  if (hn) {
    assert.ok(hn.items.length > 0);
    assert.ok(hn.items[0].title);
    assert.ok(hn.items[0].link);
  }
});

test("homepage prioritizes lab feeds over empty posts", () => {
  const home = fs.readFileSync(path.join(root, "src/app/page.tsx"), "utf8");
  assert.match(home, /HomePapersSection|getLatestHfDaily/);
  assert.match(home, /HomeRssSection|getLatestRssFeeds/);
  assert.match(home, /lab\/papers/);
  assert.match(home, /lab\/feeds/);
  // Empty-posts dashed CTA should not be the only home content path
  assert.doesNotMatch(
    home,
    /还没有文章。在\{\s*" "\s*\}/,
  );
  assert.doesNotMatch(home, /还没有文章。在/);
});

test("lab lang helpers and RSS zh fields", async () => {
  const { pickLocalized, hasZhText, LAB_LANG_STORAGE_KEY } = await loadTs(
    "src/lib/lab-lang.ts",
  );
  assert.equal(pickLocalized("zh", "Hello", "你好"), "你好");
  assert.equal(pickLocalized("en", "Hello", "你好"), "Hello");
  assert.equal(pickLocalized("zh", "Hello", ""), "Hello");
  assert.equal(pickLocalized("zh", "Hello", null), "Hello");
  assert.equal(hasZhText("中文"), true);
  assert.equal(hasZhText("  "), false);
  assert.equal(LAB_LANG_STORAGE_KEY, "lab-content-lang");

  const providerSrc = fs.readFileSync(
    path.join(root, "src/components/LabLangProvider.tsx"),
    "utf8",
  );
  assert.match(providerSrc, /LAB_LANG_STORAGE_KEY|lab-content-lang/);
  assert.match(providerSrc, /LAB_LANG_CHANGE_EVENT|lab-content-lang-change/);

  const paperCard = fs.readFileSync(
    path.join(root, "src/components/HfPaperCard.tsx"),
    "utf8",
  );
  assert.match(paperCard, /useLabLang/);
  assert.match(paperCard, /LabLangToggle/);
  assert.doesNotMatch(paperCard, /useState<Lang>|useState\("zh"\)/);

  const feedCard = fs.readFileSync(
    path.join(root, "src/components/RssFeedCard.tsx"),
    "utf8",
  );
  assert.match(feedCard, /useLabLang/);
  assert.match(feedCard, /LabLangToggle|pickLocalized/);

  const layout = fs.readFileSync(
    path.join(root, "src/app/layout.tsx"),
    "utf8",
  );
  assert.match(layout, /LabLangProvider/);

  const latestPath = path.join(root, "content/data/rss-feeds/latest.json");
  if (fs.existsSync(latestPath)) {
    const latest = JSON.parse(fs.readFileSync(latestPath, "utf8"));
    const withZh = latest.feeds
      ?.flatMap((f) => f.items || [])
      .find((it) => it.titleZh || it.summaryZh);
    // After translated fetch, at least one item should carry zh fields
    if (latest.locale?.translated) {
      assert.ok(withZh, "translated RSS snapshot should include titleZh/summaryZh");
    }
  }
});

test("admin Markdown editor form bridge and wide shell", async () => {
  const { appendMarkdown, markdownBodyFormData } = await loadTs(
    "src/lib/markdown-form.ts",
  );

  // Real shipped helper used by image-insert path
  const gfm = [
    "# Title",
    "",
    "Paragraph with **bold** and a [link](https://example.com).",
    "",
    "- list",
    "",
    "```js",
    "const x = 1;",
    "```",
  ].join("\n");
  const withImage = appendMarkdown(gfm, "![shot.png](/uploads/shot.png)");
  assert.match(withImage, /# Title/);
  assert.match(withImage, /!\[shot\.png\]\(\/uploads\/shot\.png\)/);
  assert.ok(withImage.indexOf("shot.png") > withImage.indexOf("const x"));

  // FormData bridge mirrors the named field server actions read
  const fd = markdownBodyFormData(withImage, {
    title: "Demo",
    slug: "demo",
  });
  assert.equal(fd.get("content"), withImage);
  assert.equal(fd.get("title"), "Demo");
  assert.equal(fd.get("slug"), "demo");

  // Structural: PostForm uses MarkdownEditor, not a bare primary content textarea
  const postForm = fs.readFileSync(
    path.join(root, "src/components/PostForm.tsx"),
    "utf8",
  );
  assert.match(postForm, /MarkdownEditor/);
  assert.match(postForm, /name="content"|name=\{name\}/);
  assert.doesNotMatch(
    postForm,
    /<textarea[\s\S]*name="content"[\s\S]*rows=\{18\}/,
  );
  assert.match(postForm, /@?\/?components\/MarkdownEditor|MarkdownEditor/);

  const editorSrc = fs.readFileSync(
    path.join(root, "src/components/MarkdownEditor.tsx"),
    "utf8",
  );
  assert.match(editorSrc, /@uiw\/react-md-editor/);
  assert.match(editorSrc, /markdown-form-field/);
  assert.match(editorSrc, /name=\{name\}/);
  assert.match(editorSrc, /preview="live"/);

  const adminLayout = fs.readFileSync(
    path.join(root, "src/app/admin/layout.tsx"),
    "utf8",
  );
  assert.match(adminLayout, /admin-wide-shell/);
  assert.match(adminLayout, /max-w-6xl|max-w-7xl/);
  // Break out without CSS transform (transform desyncs textarea caret)
  assert.match(adminLayout, /50% - 50vw|calc\(50% - 50vw\)/);
  assert.doesNotMatch(adminLayout, /-translate-x-1\/2|transform:/);

  const publicLayout = fs.readFileSync(
    path.join(root, "src/app/layout.tsx"),
    "utf8",
  );
  assert.match(publicLayout, /max-w-3xl/);

  const header = fs.readFileSync(
    path.join(root, "src/components/Header.tsx"),
    "utf8",
  );
  // Header must be wider than the reading column so desktop nav stays one row
  assert.match(header, /max-w-6xl|max-w-7xl/);
  assert.doesNotMatch(header, /max-w-3xl/);

  const nav = fs.readFileSync(
    path.join(root, "src/components/NavLinks.tsx"),
    "utf8",
  );
  assert.match(nav, /flex-nowrap|md:flex-nowrap|md:flex/);
  assert.match(nav, /md:hidden|hamburger|aria-expanded/);
  // Desktop nav must not wrap
  assert.doesNotMatch(nav, /className="flex flex-wrap/);

  const editorCss = fs.readFileSync(
    path.join(root, "src/components/MarkdownEditor.css"),
    "utf8",
  );
  // Caret-critical: fixed 14px/18px, not unitless line-height on text layers
  assert.match(editorCss, /line-height:\s*18px/);
  assert.doesNotMatch(editorCss, /line-height:\s*1\.65/);

  const pkg = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8"),
  );
  assert.ok(
    pkg.dependencies["@uiw/react-md-editor"],
    "editor dependency must be installed",
  );
});

test("content/posts markdown files are healthy when present", () => {
  const dir = path.join(root, "content/posts");
  assert.ok(fs.existsSync(dir));
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    assert.match(file, /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/);
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const { data, content } = matter(raw);
    assert.ok(data.title, `${file} missing title`);
    assert.ok(data.date, `${file} missing date`);
    assert.ok(content.trim().length > 0, `${file} empty body`);
  }
});
