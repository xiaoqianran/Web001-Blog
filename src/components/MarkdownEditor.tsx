"use client";

import dynamic from "next/dynamic";
import { useEffect, useId } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { appendMarkdown } from "@/lib/markdown-form";

import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import "./MarkdownEditor.css";

export { appendMarkdown };

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => (
    <div
      className="flex min-h-[min(70vh,40rem)] items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400"
      data-testid="markdown-editor-loading"
    >
      加载 Markdown 编辑器…
    </div>
  ),
});

export type MarkdownEditorProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Form field name so server actions receive markdown body */
  name?: string;
  placeholder?: string;
  className?: string;
  /** Pixel height passed to the editor chrome (CSS also enforces min-height) */
  height?: number;
  required?: boolean;
};

/**
 * Production-grade Markdown editor (toolbar + edit / live / preview).
 * Bridges controlled value into a named form field for server actions.
 */
export function MarkdownEditor({
  id,
  value,
  onChange,
  name = "content",
  placeholder = "## 开始写作…\n\n支持 GFM：标题、列表、代码块、链接、图片、表格。",
  className = "",
  height = 560,
  required = true,
}: MarkdownEditorProps) {
  const autoId = useId();
  const fieldId = id ?? `md-editor-${autoId}`;
  const { resolved } = useTheme();
  const colorMode = resolved === "dark" ? "dark" : "light";

  // uiw also consults documentElement data-color-mode for chrome tokens
  useEffect(() => {
    document.documentElement.setAttribute("data-color-mode", colorMode);
  }, [colorMode]);

  return (
    <div
      className={`md-editor-shell ${className}`.trim()}
      data-color-mode={colorMode}
      data-testid="markdown-editor-shell"
    >
      {/* Server action / FormData bridge — plain Markdown string */}
      <textarea
        id={fieldId}
        name={name}
        value={value}
        required={required}
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        data-testid="markdown-form-field"
        className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
      />

      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? "")}
        height={height}
        visibleDragbar
        preview="live"
        overflow={false}
        textareaProps={{
          placeholder,
          spellCheck: false,
          id: `${fieldId}-surface`,
          "aria-label": "Markdown 正文",
        }}
      />
    </div>
  );
}

