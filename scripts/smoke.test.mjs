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
  const { slugifyTitle } = await loadTs("src/lib/slugify.ts");
  assert.equal(slugifyTitle("Hello World"), "hello-world");
  assert.equal(slugifyTitle("  Foo   Bar__Baz "), "foo-bar-baz");
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

test("content/posts sample files are healthy", () => {
  const dir = path.join(root, "content/posts");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  assert.ok(files.length >= 1);
  for (const file of files) {
    assert.match(file, /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/);
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const { data, content } = matter(raw);
    assert.ok(data.title, `${file} missing title`);
    assert.ok(data.date, `${file} missing date`);
    assert.ok(content.trim().length > 0, `${file} empty body`);
  }
});
