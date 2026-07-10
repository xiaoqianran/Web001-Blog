"use client";

type Props = {
  filename: string;
  getMarkdown: () => string;
};

export function ExportMarkdownButton({ filename, getMarkdown }: Props) {
  return (
    <button
      type="button"
      data-testid="export-md"
      onClick={() => {
        const blob = new Blob([getMarkdown()], {
          type: "text/markdown;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename.endsWith(".md") ? filename : `${filename}.md`;
        a.click();
        URL.revokeObjectURL(url);
      }}
      className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
    >
      导出 .md
    </button>
  );
}
