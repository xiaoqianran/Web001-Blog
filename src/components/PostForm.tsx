"use client";

import Link from "next/link";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  createPost,
  updatePost,
  type PostFormState,
} from "@/app/actions/posts";
import { uploadImage } from "@/app/actions/upload";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { appendMarkdown } from "@/lib/markdown-form";
import {
  isMarkdownFile,
  parseMarkdownImport,
} from "@/lib/import-markdown";
import { slugifyTitle } from "@/lib/slugify";

export type PostFormValues = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string;
  content: string;
  draft?: boolean;
  cover?: string;
  pinned?: boolean;
  series?: string;
};

type Props = {
  mode: "create" | "edit";
  initial: PostFormValues;
  originalSlug?: string;
};

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500";

const labelClass =
  "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export function PostForm({ mode, initial, originalSlug }: Props) {
  const action = mode === "create" ? createPost : updatePost;
  const [state, formAction, pending] = useActionState<PostFormState, FormData>(
    action,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const mdRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [description, setDescription] = useState(initial.description);
  const [date, setDate] = useState(initial.date);
  const [tags, setTags] = useState(initial.tags);
  const [cover, setCover] = useState(initial.cover ?? "");
  const [series, setSeries] = useState(initial.series ?? "");
  const [draft, setDraft] = useState(Boolean(initial.draft));
  const [pinned, setPinned] = useState(Boolean(initial.pinned));
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();

  const [slugOverride, setSlugOverride] = useState<string | null>(
    mode === "edit" ? initial.slug : initial.slug || null,
  );
  const slug =
    slugOverride !== null && slugOverride !== ""
      ? slugOverride
      : slugifyTitle(title);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onPickImage = (file: File | null) => {
    if (!file) return;
    setUploadMsg(null);
    const fd = new FormData();
    fd.set("file", file);
    startUpload(async () => {
      const res = await uploadImage(fd);
      if (!res.ok) {
        setUploadMsg(res.error);
        return;
      }
      setContent((c) => appendMarkdown(c, `![${file.name}](${res.path})`));
      setUploadMsg(`已插入：${res.path}`);
    });
  };

  const onImportMarkdown = async (file: File | null) => {
    if (!file) return;
    setImportMsg(null);
    if (!isMarkdownFile(file)) {
      setImportMsg("请选择 .md / .markdown 文件");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImportMsg("Markdown 文件需小于 2MB");
      return;
    }
    try {
      const raw = await file.text();
      const imported = parseMarkdownImport(raw, file.name);

      // Edit mode: keep original slug unless empty (avoid accidental rename)
      if (mode === "create") {
        setSlugOverride(imported.slug);
      } else if (!slugOverride) {
        setSlugOverride(imported.slug);
      }

      setTitle(imported.title);
      setDescription(imported.description);
      setDate(imported.date);
      setTags(imported.tags);
      setCover(imported.cover);
      setSeries(imported.series);
      setDraft(imported.draft);
      setPinned(imported.pinned);
      setContent(imported.content);

      const note =
        imported.notes.length > 0
          ? `（${imported.notes.join("；")}）`
          : "";
      setImportMsg(
        mode === "edit"
          ? `已导入 ${file.name}，请检查后保存${note}`
          : `已导入 ${file.name}，请检查 slug 后保存${note}`,
      );
    } catch (e) {
      setImportMsg(e instanceof Error ? e.message : "导入失败");
    } finally {
      if (mdRef.current) mdRef.current.value = "";
    }
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-6"
      data-testid="post-form"
    >
      {mode === "edit" && originalSlug && (
        <input type="hidden" name="originalSlug" value={originalSlug} />
      )}

      {state?.error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-violet-200 bg-violet-50/60 px-4 py-3 dark:border-violet-900/50 dark:bg-violet-950/30">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
            导入 Markdown 文件
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            支持带 YAML frontmatter 的 .md；会填充标题、slug、标签、正文等
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => mdRef.current?.click()}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-500"
            data-testid="import-md-button"
          >
            选择 .md 文件
          </button>
          <input
            ref={mdRef}
            type="file"
            accept=".md,.markdown,.mdx,text/markdown,text/plain"
            className="hidden"
            data-testid="import-md-input"
            onChange={(e) => onImportMarkdown(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>
      {importMsg && (
        <p
          className="text-xs text-violet-700 dark:text-violet-300"
          data-testid="import-md-msg"
        >
          {importMsg}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="title" className={labelClass}>
            标题
          </label>
          <input
            id="title"
            name="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="文章标题"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="slug" className={labelClass}>
            Slug （URL）
          </label>
          <input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => setSlugOverride(e.target.value.toLowerCase())}
            className={inputClass}
            placeholder="my-first-post"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="date" className={labelClass}>
            发布日期
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="description" className={labelClass}>
            摘要
          </label>
          <input
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="tags" className={labelClass}>
            标签
          </label>
          <input
            id="tags"
            name="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className={inputClass}
            placeholder="Next.js, 笔记"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="cover" className={labelClass}>
            封面图 URL（可选）
          </label>
          <input
            id="cover"
            name="cover"
            value={cover}
            onChange={(e) => setCover(e.target.value)}
            className={inputClass}
            placeholder="https://… 或 /uploads/…"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="series" className={labelClass}>
            系列（可选）
          </label>
          <input
            id="series"
            name="series"
            value={series}
            onChange={(e) => setSeries(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-3 sm:col-span-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <input
              type="checkbox"
              name="draft"
              value="true"
              checked={draft}
              onChange={(e) => setDraft(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-zinc-300 text-violet-600"
            />
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              存为草稿
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <input
              type="checkbox"
              name="pinned"
              value="true"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-zinc-300 text-violet-600"
            />
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              首页置顶
            </span>
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <label htmlFor="content" className={labelClass}>
              正文（Markdown）
            </label>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              可导入 .md，或工具栏编辑；支持 编辑 · 分栏 · 预览
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => mdRef.current?.click()}
              className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
            >
              导入 .md
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => imageRef.current?.click()}
              className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
            >
              {uploading ? "上传中…" : "插入图片"}
            </button>
            <input
              ref={imageRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="hidden"
              onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <MarkdownEditor
          id="content"
          name="content"
          value={content}
          onChange={setContent}
          height={560}
          required
        />

        {uploadMsg && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{uploadMsg}</p>
        )}
        <p className="text-xs text-zinc-400">快捷键 ⌘/Ctrl + S 保存</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "保存中…" : mode === "create" ? "保存文章" : "保存修改"}
        </button>
        <Link
          href="/admin"
          className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
        >
          取消
        </Link>
      </div>
    </form>
  );
}
