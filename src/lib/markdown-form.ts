/**
 * Helpers for admin Markdown editor ↔ form bridge.
 * Kept free of React/Next so smoke tests can load the real shipped module.
 */

/** Append a Markdown snippet (image upload insert, etc.). */
export function appendMarkdown(current: string, snippet: string): string {
  const base = current.replace(/\s*$/, "");
  const piece = snippet.replace(/^\s+/, "").replace(/\s+$/, "");
  if (!piece) return current;
  if (!base) return `${piece}\n`;
  return `${base}\n\n${piece}\n`;
}

/**
 * Build FormData fields the way the post form does for the body:
 * a named `content` field holding plain Markdown (server actions read this).
 */
export function markdownBodyFormData(
  markdown: string,
  extra: Record<string, string> = {},
): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(extra)) {
    fd.set(k, v);
  }
  fd.set("content", markdown);
  return fd;
}
