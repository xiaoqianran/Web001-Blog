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
  assert.match(form, /stripSavedQuery|replaceState/);

  const gh = fs.readFileSync(
    path.join(root, "src/lib/github-content.ts"),
    "utf8",
  );
  assert.match(gh, /githubReadPost/);

  const edit = fs.readFileSync(
    path.join(root, "src/app/admin/posts/[slug]/edit/page.tsx"),
    "utf8",
  );
  assert.match(edit, /githubReadPost/);
  assert.match(edit, /force-dynamic/);
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

test("content-tree build/move/folder and slug stable", async () => {
  const {
    buildTreeFromRelPaths,
    moveDocInTree,
    addFolderToTree,
    deleteFolderFromTree,
    flattenDocOrder,
    getDocFolderId,
  } = await loadTs("src/lib/content-tree.ts");

  const tree = buildTreeFromRelPaths([
    "root.md",
    "notes/a.md",
    "notes/deep/b.md",
  ]);
  assert.ok(tree.folders.some((f) => f.id === "notes"));
  assert.ok(tree.folders.some((f) => f.id === "notes/deep"));
  assert.equal(getDocFolderId(tree, "a"), "notes");
  assert.equal(getDocFolderId(tree, "root"), null);

  let t2 = moveDocInTree(tree, "root", "notes");
  assert.equal(getDocFolderId(t2, "root"), "notes");
  // slug identity preserved
  assert.ok(t2.docs.some((d) => d.slug === "root"));

  t2 = addFolderToTree(t2, "inbox", null);
  assert.ok(t2.folders.some((f) => f.id === "inbox"));
  t2 = deleteFolderFromTree(t2, "inbox");
  assert.ok(!t2.folders.some((f) => f.id === "inbox"));

  const order = flattenDocOrder(tree);
  assert.ok(order.includes("a") && order.includes("b"));
});

test("admin post helpers: filter/sort/updatedAt/recursive list", async () => {
  const {
    filterAdminPosts,
    sortAdminPosts,
    listPostRelPaths,
    serializePost,
    parsePostMarkdown,
  } = await loadTs("src/lib/posts.ts");

  const sample = serializePost({
    slug: "t",
    title: "T",
    description: "d",
    date: "2026-01-01",
    tags: ["a"],
    content: "hello body",
    updatedAt: "2026-07-10T12:00:00.000Z",
  });
  assert.match(sample, /updatedAt:/);
  const parsed = parsePostMarkdown("t", sample);
  assert.equal(parsed.updatedAt, "2026-07-10T12:00:00.000Z");

  const rows = [
    {
      slug: "a",
      title: "Alpha",
      description: "",
      date: "2026-01-01",
      tags: [],
      draft: false,
      pinned: false,
      readingTime: "1 min",
      content: "foo bar",
      updatedAt: "2026-07-01T00:00:00.000Z",
    },
    {
      slug: "b",
      title: "Beta draft",
      description: "x",
      date: "2026-02-01",
      tags: ["ml"],
      draft: true,
      pinned: false,
      readingTime: "1 min",
      content: "secret keyword xyz",
      updatedAt: "2026-07-11T00:00:00.000Z",
    },
  ];
  const byBody = filterAdminPosts(rows, { q: "secret keyword" });
  assert.equal(byBody.length, 1);
  assert.equal(byBody[0].slug, "b");
  const drafts = filterAdminPosts(rows, { filter: "draft" });
  assert.equal(drafts.length, 1);
  const sorted = sortAdminPosts(rows, "updated");
  assert.equal(sorted[0].slug, "b");

  const rels = listPostRelPaths();
  assert.ok(Array.isArray(rels));

  const adminPage = fs.readFileSync(
    path.join(root, "src/app/admin/page.tsx"),
    "utf8",
  );
  assert.match(adminPage, /loadAdminPosts|admin-recent|最近编辑/);
  assert.match(
    fs.readFileSync(path.join(root, "src/components/EditorChrome.tsx"), "utf8"),
    /editor-chrome|复制前台链接/,
  );
  assert.match(
    fs.readFileSync(path.join(root, "src/components/PostForm.tsx"), "utf8"),
    /beforeunload|isDirty/,
  );
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

test("folder wire-through: nested write/read and form field", async () => {
  const {
    writePost,
    getPostBySlug,
    deletePostFile,
    getPostRelPath,
    findPostFile,
  } = await loadTs("src/lib/posts.ts");
  const slug = "kb-nested-smoke";
  const folder = "notes/deep";
  try {
    writePost({
      slug,
      title: "Nested",
      description: "d",
      date: "2026-07-01",
      tags: ["kb"],
      content: "nested body",
      folder,
    });
    assert.equal(getPostRelPath(slug, folder), "notes/deep/kb-nested-smoke.md");
    const found = findPostFile(slug);
    assert.ok(found && found.replace(/\\/g, "/").endsWith("notes/deep/kb-nested-smoke.md"));
    const post = getPostBySlug(slug);
    assert.equal(post.folder, "notes/deep");
    assert.match(post.content, /nested body/);
    // re-save without wiping folder (simulate update that keeps folder)
    writePost({
      slug,
      title: "Nested 2",
      description: "d",
      date: "2026-07-01",
      tags: ["kb"],
      content: "nested body v2",
      folder: post.folder,
    });
    assert.equal(getPostBySlug(slug).title, "Nested 2");
    assert.equal(getPostBySlug(slug).folder, "notes/deep");
  } finally {
    try {
      deletePostFile(slug);
    } catch {}
  }

  const form = fs.readFileSync(
    path.join(root, "src/components/PostForm.tsx"),
    "utf8",
  );
  assert.match(form, /name="folder"|data-testid="post-folder"/);
  assert.match(form, /folder-input|setFolder/);

  const newPage = fs.readFileSync(
    path.join(root, "src/app/admin/posts/new/page.tsx"),
    "utf8",
  );
  // folder passed into PostForm initial (shorthand property ok)
  assert.match(newPage, /folder[,}]/);
  assert.match(newPage, /searchParams.*folder|folder\?:/);

  const actions = fs.readFileSync(
    path.join(root, "src/app/actions/posts.ts"),
    "utf8",
  );
  assert.match(actions, /folderRaw|folder:/);

  // soft-delete embeds originalFolder (local path used by restore)
  const { softDeleteLocal, listTrash, permanentDeleteLocal } = await loadTs(
    "src/lib/trash.ts",
  );
  const dir = path.join(root, "content/posts", "tmpfold");
  fs.mkdirSync(dir, { recursive: true });
  const src = path.join(dir, "soft-me.md");
  fs.writeFileSync(
    src,
    `---\ntitle: Soft\ndate: "2026-01-01"\ntags: []\n---\n\nbody\n`,
  );
  const fn = softDeleteLocal(src, "soft-me", "tmpfold");
  const item = listTrash().find((t) => t.filename === fn);
  assert.ok(item);
  assert.equal(item.originalFolder, "tmpfold");
  permanentDeleteLocal(fn);
  try {
    fs.rmdirSync(dir);
  } catch {}

  // permanent delete has confirm button component
  assert.ok(
    fs.existsSync(
      path.join(root, "src/components/admin/PermanentDeleteButton.tsx"),
    ),
  );
  const perm = fs.readFileSync(
    path.join(root, "src/components/admin/PermanentDeleteButton.tsx"),
    "utf8",
  );
  assert.match(perm, /confirm/);

  // GitHub soft-delete must not only hard-delete
  const gh = fs.readFileSync(
    path.join(root, "src/lib/github-content.ts"),
    "utf8",
  );
  assert.match(gh, /githubSoftDeletePost/);
  assert.match(gh, /githubRestoreTrash/);
  assert.match(gh, /content\/posts\/trash\//);
  // rename must preserve path when folder undefined
  assert.match(gh, /folderFromRepoPath|input\.folder !== undefined/);
});

test("trash soft-delete helpers round-trip metadata", async () => {
  const dir = path.join(root, "content/posts");
  const trashDir = path.join(dir, "trash");
  fs.mkdirSync(trashDir, { recursive: true });
  const src = path.join(dir, "_smoke-trash-me.md");
  fs.writeFileSync(
    src,
    `---
title: TrashMe
date: "2026-01-01"
tags: []
---

body
`,
  );
  const { softDeleteLocal, listTrash, restoreFromTrashLocal, permanentDeleteLocal } =
    await loadTs("src/lib/trash.ts");
  const fn = softDeleteLocal(src, "smoke-trash-me", "notes");
  assert.ok(!fs.existsSync(src));
  const listed = listTrash();
  assert.ok(listed.some((t) => t.filename === fn));
  const restored = restoreFromTrashLocal(fn);
  assert.equal(restored.slug, "smoke-trash-me");
  assert.ok(fs.existsSync(path.join(dir, "notes", "smoke-trash-me.md")));
  // cleanup
  const again = softDeleteLocal(
    path.join(dir, "notes", "smoke-trash-me.md"),
    "smoke-trash-me",
    "notes",
  );
  permanentDeleteLocal(again);
  try {
    fs.rmdirSync(path.join(dir, "notes"));
  } catch {}
});

test("content-persist shared module: actions must not bare saveTreeToDisk", async () => {
  const persistPath = path.join(root, "src/lib/content-persist.ts");
  assert.ok(fs.existsSync(persistPath), "content-persist.ts must exist");
  const persistSrc = fs.readFileSync(persistPath, "utf8");
  assert.match(persistSrc, /export async function persistTreeBestEffort/);
  assert.match(persistSrc, /export function bestEffortMkdir/);
  assert.match(persistSrc, /export async function loadPostForAdmin/);
  assert.match(persistSrc, /export async function loadTreeForAdmin/);
  assert.match(persistSrc, /githubReadPost|isGitHubContentEnabled/);
  assert.match(persistSrc, /putTreeJson/);
  // GitHub-first tree load (fetchTreeJson) before falling back to disk
  assert.match(persistSrc, /fetchTreeJson/);
  assert.match(
    persistSrc,
    /loadTreeForAdmin[\s\S]*fetchTreeJson[\s\S]*loadTreeFromDisk/,
  );
  // local save is inside try/catch
  assert.match(
    persistSrc,
    /try\s*\{[\s\S]*saveTreeToDisk[\s\S]*\}\s*catch/,
  );
  // registerDoc must load tree via loadTreeForAdmin, not disk-only
  assert.match(
    persistSrc,
    /registerDocInTreeBestEffort[\s\S]*loadTreeForAdmin/,
  );
  assert.ok(
    !/registerDocInTreeBestEffort[\s\S]*loadTreeFromDisk\s*\(/.test(persistSrc),
    "registerDocInTreeBestEffort must not call loadTreeFromDisk directly",
  );

  // github-tree must expose fetch (not put-only)
  const ghTree = fs.readFileSync(
    path.join(root, "src/lib/github-tree.ts"),
    "utf8",
  );
  assert.match(ghTree, /export async function fetchTreeJson/);
  assert.match(ghTree, /export async function putTreeJson/);

  // pure parseTreeJson rejects garbage
  const { parseTreeJson, emptyTree } = await loadTs("src/lib/content-tree.ts");
  assert.equal(parseTreeJson(null), null);
  assert.equal(parseTreeJson({ version: 2 }), null);
  const ok = emptyTree();
  assert.deepEqual(parseTreeJson(ok), ok);
  assert.ok(
    parseTreeJson({
      version: 1,
      folders: [{ id: "a", name: "a", parentId: null, order: 0 }],
      docs: [{ slug: "x", folderId: "a", order: 0 }],
    }),
  );

  const actionsDir = path.join(root, "src/app/actions");
  const actionFiles = fs
    .readdirSync(actionsDir)
    .filter((f) => f.endsWith(".ts"));
  assert.ok(actionFiles.length >= 3, "expected multiple action modules");

  for (const file of actionFiles) {
    const src = fs.readFileSync(path.join(actionsDir, file), "utf8");
    // Actions must not call saveTreeToDisk directly — only via content-persist
    assert.ok(
      !/\bsaveTreeToDisk\s*\(/.test(src),
      `${file} must not call saveTreeToDisk() directly; use persistTreeBestEffort`,
    );
    // Mutators must not load tree from disk only (wipes GitHub on put)
    assert.ok(
      !/\bloadTreeFromDisk\s*\(/.test(src),
      `${file} must not call loadTreeFromDisk(); use loadTreeForAdmin (GitHub-first)`,
    );
    if (file === "tree.ts") {
      assert.ok(
        !/fs\.mkdirSync\s*\(/.test(src),
        "tree.ts must use bestEffortMkdir, not fs.mkdirSync",
      );
    }
  }

  const treeSrc = fs.readFileSync(
    path.join(actionsDir, "tree.ts"),
    "utf8",
  );
  assert.match(treeSrc, /persistTreeBestEffort/);
  assert.match(treeSrc, /bestEffortMkdir/);
  assert.match(treeSrc, /loadPostForAdmin/);
  assert.match(treeSrc, /loadTreeForAdmin/);

  // createFolderAction: loadTreeForAdmin before persist
  const createSlice = treeSrc.slice(
    treeSrc.indexOf("export async function createFolderAction"),
    treeSrc.indexOf("export async function renameFolderAction"),
  );
  assert.ok(
    createSlice.indexOf("loadTreeForAdmin") <
      createSlice.indexOf("persistTreeBestEffort"),
    "createFolder must loadTreeForAdmin before put",
  );

  // movePostAction must load via loadPostForAdmin, not bare getPostBySlug
  const moveSlice = treeSrc.slice(
    treeSrc.indexOf("export async function movePostAction"),
    treeSrc.indexOf("export async function reorderPostAction"),
  );
  assert.match(moveSlice, /loadPostForAdmin/);
  assert.match(moveSlice, /loadTreeForAdmin/);
  assert.ok(
    !/\bgetPostBySlug\s*\(/.test(moveSlice),
    "movePostAction must not call getPostBySlug; use loadPostForAdmin (GitHub-first)",
  );

  const trashSrc = fs.readFileSync(
    path.join(actionsDir, "trash.ts"),
    "utf8",
  );
  assert.match(trashSrc, /from ["']@\/lib\/content-persist["']/);
  assert.match(trashSrc, /persistTreeBestEffort/);
  assert.match(trashSrc, /loadTreeForAdmin/);
  assert.ok(
    !/async function persistTreeBestEffort/.test(trashSrc),
    "trash.ts must import persistTreeBestEffort, not redefine it",
  );

  const postsSrc = fs.readFileSync(
    path.join(actionsDir, "posts.ts"),
    "utf8",
  );
  assert.match(postsSrc, /registerDocInTreeBestEffort/);
  assert.ok(
    !/\bregisterDocInTree\s*\(/.test(postsSrc),
    "posts.ts must use registerDocInTreeBestEffort (not bare registerDocInTree)",
  );

  // Admin page display/mutate path also GitHub-first
  const adminPage = fs.readFileSync(
    path.join(root, "src/app/admin/page.tsx"),
    "utf8",
  );
  assert.match(adminPage, /loadTreeForAdmin/);
  assert.ok(
    !/\bloadTreeFromDisk\s*\(/.test(adminPage),
    "admin page must not loadTreeFromDisk (risk of put wiping remote)",
  );
});

test("trash GitHub list + soft-delete order (Vercel RO FS safe)", async () => {
  // Pure parser shared by local listTrash and githubListTrash
  const { parseTrashMarkdown } = await loadTs("src/lib/trash.ts");
  const raw = `---
title: FromGitHub
slug: gh-trash-item
deletedAt: "2026-07-10T12:00:00.000Z"
originalFolder: notes/deep
---

body
`;
  const item = parseTrashMarkdown("gh-trash-item__171000.md", raw);
  assert.equal(item.slug, "gh-trash-item");
  assert.equal(item.title, "FromGitHub");
  assert.equal(item.originalFolder, "notes/deep");
  assert.equal(item.filename, "gh-trash-item__171000.md");
  assert.match(item.deletedAt, /^2026-07-10/);

  // Admin trash page must load GitHub list when token path is enabled
  const trashPage = fs.readFileSync(
    path.join(root, "src/app/admin/trash/page.tsx"),
    "utf8",
  );
  assert.match(trashPage, /githubListTrash/);
  assert.match(trashPage, /isGitHubContentEnabled/);
  // Must not only call listTrash() without GitHub branch
  assert.match(trashPage, /loadTrashItems|await githubListTrash/);

  // github-content exports list with parseTrashMarkdown (not filenames-only UI)
  const gh = fs.readFileSync(
    path.join(root, "src/lib/github-content.ts"),
    "utf8",
  );
  assert.match(gh, /export async function githubListTrash\b/);
  assert.match(gh, /parseTrashMarkdown/);

  // softDelete: content delete BEFORE tree persist (via shared content-persist)
  const actions = fs.readFileSync(
    path.join(root, "src/app/actions/trash.ts"),
    "utf8",
  );
  assert.match(actions, /persistTreeBestEffort/);
  const softFn = actions.slice(
    actions.indexOf("export async function softDeletePostAction"),
    actions.indexOf("export async function restoreTrashAction"),
  );
  const softGh = softFn.indexOf("githubSoftDeletePost");
  const softSave = softFn.indexOf("persistTreeBestEffort");
  assert.ok(softGh >= 0 && softSave >= 0 && softGh < softSave,
    "github soft-delete must run before tree persist in softDeletePostAction");
  // RO FS catch lives in content-persist (single place)
  const persist = fs.readFileSync(
    path.join(root, "src/lib/content-persist.ts"),
    "utf8",
  );
  assert.match(persist, /putTreeJson/);
  assert.match(persist, /try\s*\{[\s\S]*saveTreeToDisk[\s\S]*\}\s*catch/);
});

test("wiki-links: parse pipe alias, skip code fences, backlinks", async () => {
  const {
    extractWikiLinks,
    extractWikiSlugs,
    expandWikiLinks,
    collectBacklinks,
    knownSlugMap,
    normalizeWikiSlug,
  } = await loadTs("src/lib/wiki-links.ts");

  assert.equal(normalizeWikiSlug("  Hello World "), "hello-world");

  const md = `
See [[kb-wiki-beta|Beta 样例]] and [[kb-wiki-alpha]].

\`\`\`md
[[should-not-extract]]
\`\`\`

Inline \`[[also-not]]\` stays raw.
`;
  const links = extractWikiLinks(md);
  assert.equal(links.length, 2);
  assert.equal(links[0].slug, "kb-wiki-beta");
  assert.equal(links[0].label, "Beta 样例");
  assert.equal(links[1].slug, "kb-wiki-alpha");
  const slugs = extractWikiSlugs(md);
  assert.ok(!slugs.includes("should-not-extract"));
  assert.ok(!slugs.includes("also-not"));

  const known = knownSlugMap([
    { slug: "kb-wiki-beta", title: "Beta" },
    { slug: "kb-wiki-alpha", title: "Alpha" },
  ]);
  const expanded = expandWikiLinks(md, known);
  assert.match(expanded, /\[Beta 样例\]\(\/blog\/kb-wiki-beta\)/);
  assert.match(expanded, /\[kb-wiki-alpha\]\(\/blog\/kb-wiki-alpha\)/);
  assert.match(expanded, /```md[\s\S]*\[\[should-not-extract\]\]/);
  assert.match(expanded, /`\[\[also-not\]\]`/);

  // missing target → plain label, no href
  const miss = expandWikiLinks("go [[missing-note|Missing]]", new Set(["other"]));
  assert.equal(miss.includes("/blog/missing"), false);
  assert.match(miss, /Missing/);

  const posts = [
    {
      slug: "kb-wiki-alpha",
      title: "Alpha",
      content: "link to [[kb-wiki-beta]]",
      draft: false,
    },
    {
      slug: "kb-wiki-beta",
      title: "Beta",
      content: "no link",
      draft: false,
    },
    {
      slug: "draft-ref",
      title: "Draft",
      content: "also [[kb-wiki-beta]]",
      draft: true,
    },
  ];
  const pub = collectBacklinks("kb-wiki-beta", posts, { includeDrafts: false });
  assert.equal(pub.length, 1);
  assert.equal(pub[0].slug, "kb-wiki-alpha");
  const all = collectBacklinks("kb-wiki-beta", posts, { includeDrafts: true });
  assert.equal(all.length, 2);

  // shipped sample files interlink
  const alpha = fs.readFileSync(
    path.join(root, "content/posts/notes/kb-wiki-alpha.md"),
    "utf8",
  );
  const beta = fs.readFileSync(
    path.join(root, "content/posts/notes/kb-wiki-beta.md"),
    "utf8",
  );
  assert.ok(extractWikiSlugs(alpha).includes("kb-wiki-beta"));
  assert.ok(extractWikiSlugs(beta).includes("kb-wiki-alpha"));

  // render path uses expandWikiLinks
  const postsTs = fs.readFileSync(
    path.join(root, "src/lib/posts.ts"),
    "utf8",
  );
  assert.match(postsTs, /expandWikiLinks/);
  assert.ok(
    fs.existsSync(path.join(root, "src/components/Backlinks.tsx")),
  );
  assert.ok(
    fs.existsSync(path.join(root, "src/components/admin/WikiLinksPanel.tsx")),
  );
  const blogPage = fs.readFileSync(
    path.join(root, "src/app/blog/[slug]/page.tsx"),
    "utf8",
  );
  assert.match(blogPage, /Backlinks|collectBacklinks/);
});

test("lab-capture: build draft PostInput with folder and source URL", async () => {
  const { buildLabCapturePost, uniquifySlug } = await loadTs(
    "src/lib/lab-capture.ts",
  );
  const paper = buildLabCapturePost({
    kind: "paper",
    title: "Attention Is All You Need",
    summary: "Transformers abstract",
    sourceUrl: "https://huggingface.co/papers/1706.03762",
    idHint: "1706.03762",
    folder: "notes/papers",
    extraLinks: [{ label: "arXiv", url: "https://arxiv.org/abs/1706.03762" }],
  });
  assert.equal(paper.draft, true);
  assert.ok(paper.tags.includes("from-lab") || paper.tags.includes("lab"));
  assert.equal(paper.folder, "notes/papers");
  assert.match(paper.content, /huggingface\.co\/papers/);
  assert.match(paper.content, /arxiv\.org/);
  assert.match(paper.slug, /^lab-/);
  assert.ok(paper.title.includes("Attention") || paper.title.includes("论文"));

  const feed = buildLabCapturePost({
    kind: "feed",
    title: "HN Story",
    summary: "hello",
    sourceUrl: "https://news.ycombinator.com/item?id=1",
    idHint: "hn-1",
  });
  assert.equal(feed.draft, true);
  assert.ok(feed.tags.includes("from-lab") || feed.tags.includes("lab"));
  assert.match(feed.content, /news\.ycombinator\.com/);
  assert.equal(feed.folder, undefined);

  const taken = new Set(["lab-foo"]);
  assert.equal(uniquifySlug("lab-foo", (s) => taken.has(s)), "lab-foo-2");
  assert.equal(uniquifySlug("lab-bar", (s) => taken.has(s)), "lab-bar");

  // action wiring
  const cap = fs.readFileSync(
    path.join(root, "src/app/actions/capture.ts"),
    "utf8",
  );
  assert.match(cap, /captureLabNoteAction/);
  assert.match(cap, /registerDocInTreeBestEffort/);
  assert.match(cap, /githubWritePost|writePost/);
  assert.match(cap, /login\?from=/);
  assert.ok(!/\bsaveTreeToDisk\s*\(/.test(cap));
  assert.ok(!/\bloadTreeFromDisk\s*\(/.test(cap));

  const btn = fs.readFileSync(
    path.join(root, "src/components/CaptureNoteButton.tsx"),
    "utf8",
  );
  assert.match(btn, /capture-note-button|存为笔记/);
  assert.match(btn, /folder/);

  const papers = fs.readFileSync(
    path.join(root, "src/app/lab/papers/page.tsx"),
    "utf8",
  );
  assert.match(papers, /CaptureNote|captureFolders|captureLoggedIn/);
  const feeds = fs.readFileSync(
    path.join(root, "src/app/lab/feeds/page.tsx"),
    "utf8",
  );
  assert.match(feeds, /captureFolders|CaptureNote/);
});

test("content source badge + git history UI wiring", () => {
  const badge = fs.readFileSync(
    path.join(root, "src/components/admin/ContentSourceBadge.tsx"),
    "utf8",
  );
  assert.match(badge, /content-source-badge/);
  assert.match(badge, /内容源：GitHub|githubEnabled/);
  assert.match(badge, /GITHUB_TOKEN|本地磁盘/);
  // branches for github vs local based on token flag
  assert.match(badge, /source === "github"|githubEnabled/);
  assert.match(badge, /内容源：本地/);

  const hist = fs.readFileSync(
    path.join(root, "src/components/admin/GitHistory.tsx"),
    "utf8",
  );
  assert.match(hist, /git-history/);
  assert.match(hist, /最近提交/);

  const ghHist = fs.readFileSync(
    path.join(root, "src/lib/github-history.ts"),
    "utf8",
  );
  assert.match(ghHist, /fetchFileCommits/);
  assert.match(ghHist, /per_page|commits\?/);

  const admin = fs.readFileSync(
    path.join(root, "src/app/admin/page.tsx"),
    "utf8",
  );
  assert.match(admin, /ContentSourceBadge/);

  const edit = fs.readFileSync(
    path.join(root, "src/app/admin/posts/[slug]/edit/page.tsx"),
    "utf8",
  );
  assert.match(edit, /GitHistory|fetchFileCommits/);
  assert.match(edit, /ContentSourceBadge/);
});
