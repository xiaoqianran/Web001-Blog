/**
 * Deploy-target helpers.
 * GitHub Pages is a static host — no cookies, Server Actions, or Route Handlers.
 */
export function isStaticExport(): boolean {
  return (
    process.env.GITHUB_PAGES === "true" ||
    process.env.STATIC_EXPORT === "true" ||
    process.env.NEXT_OUTPUT === "export"
  );
}
