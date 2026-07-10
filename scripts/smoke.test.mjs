import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/** Mirror of src/lib/slugify.ts for lightweight CI smoke tests */
function slugifyTitle(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

test("slugifyTitle normalizes english titles", () => {
  assert.equal(slugifyTitle("Hello World"), "hello-world");
  assert.equal(slugifyTitle("  Foo   Bar__Baz "), "foo-bar-baz");
});

test("slug pattern accepts valid slugs only", () => {
  assert.equal(SLUG_PATTERN.test("my-first-post"), true);
  assert.equal(SLUG_PATTERN.test("Post"), false);
  assert.equal(SLUG_PATTERN.test("-bad-"), false);
});

test("content/posts has markdown files with frontmatter", () => {
  const dir = path.join(process.cwd(), "content/posts");
  assert.ok(fs.existsSync(dir), "content/posts should exist");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  assert.ok(files.length > 0, "expected at least one post");

  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const { data, content } = matter(raw);
    assert.ok(data.title, `${file} missing title`);
    assert.ok(data.date, `${file} missing date`);
    assert.ok(content.trim().length > 0, `${file} empty body`);
  }
});
