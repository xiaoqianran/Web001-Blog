"use client";

import { captureLabNoteAction } from "@/app/actions/capture";

export type CaptureFolderOption = { id: string; name: string };

type Props = {
  kind: "paper" | "feed";
  title: string;
  summary?: string;
  sourceUrl: string;
  idHint?: string;
  authors?: string;
  extraArxiv?: string;
  extraPdf?: string;
  returnTo: string;
  folders?: CaptureFolderOption[];
  /** When false, form still posts — action redirects to login with returnTo */
  loggedIn?: boolean;
};

/**
 * Server-friendly form: "存为笔记" → draft under optional folder.
 */
export function CaptureNoteButton({
  kind,
  title,
  summary = "",
  sourceUrl,
  idHint = "",
  authors = "",
  extraArxiv = "",
  extraPdf = "",
  returnTo,
  folders = [],
  loggedIn = false,
}: Props) {
  return (
    <form
      action={captureLabNoteAction}
      className="inline-flex flex-wrap items-center gap-2"
      data-testid="capture-note-form"
    >
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="summary" value={summary.slice(0, 4000)} />
      <input type="hidden" name="sourceUrl" value={sourceUrl} />
      <input type="hidden" name="idHint" value={idHint} />
      <input type="hidden" name="authors" value={authors} />
      <input type="hidden" name="extraArxiv" value={extraArxiv} />
      <input type="hidden" name="extraPdf" value={extraPdf} />
      <input type="hidden" name="returnTo" value={returnTo} />
      {folders.length > 0 && (
        <label className="sr-only" htmlFor={`capture-folder-${idHint || title.slice(0, 12)}`}>
          文件夹
        </label>
      )}
      {folders.length > 0 && (
        <select
          name="folder"
          id={`capture-folder-${(idHint || title).slice(0, 24)}`}
          className="max-w-[10rem] rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          defaultValue=""
          data-testid="capture-folder"
        >
          <option value="">根目录</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      )}
      <button
        type="submit"
        className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300 dark:hover:bg-violet-950"
        data-testid="capture-note-button"
        title={loggedIn ? "存为知识库草稿" : "登录后存为知识库草稿"}
      >
        {loggedIn ? "存为笔记" : "登录并存为笔记"}
      </button>
    </form>
  );
}
