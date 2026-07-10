type Props = {
  /** true when GITHUB_TOKEN is configured */
  githubEnabled: boolean;
  /** list/load source reported by admin loader */
  listSource?: "github" | "local";
  onVercel?: boolean;
};

/**
 * Honest badge: never claims GitHub when token is absent.
 */
export function ContentSourceBadge({
  githubEnabled,
  listSource,
  onVercel = false,
}: Props) {
  const source = githubEnabled
    ? listSource === "local"
      ? "github-fallback-local"
      : "github"
    : "local";

  let label: string;
  let detail: string;
  let tone: string;

  if (source === "github") {
    label = "内容源：GitHub";
    detail = "读写以仓库 Contents API 为准";
    tone =
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200";
  } else if (source === "github-fallback-local") {
    label = "内容源：GitHub（列表回退本地）";
    detail = "Token 已配置，但本次列表读了本地盘";
    tone =
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100";
  } else {
    label = "内容源：本地磁盘";
    detail = onVercel
      ? "Vercel 上未配置 GITHUB_TOKEN — 无法可靠保存"
      : "本地开发：未配置 GITHUB_TOKEN";
    tone = onVercel
      ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
      : "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300";
  }

  return (
    <div
      className={`rounded-xl border px-3 py-2 text-xs sm:text-sm ${tone}`}
      data-testid="content-source-badge"
      data-source={source}
      role="status"
    >
      <p className="font-semibold">{label}</p>
      <p className="mt-0.5 opacity-90">{detail}</p>
    </div>
  );
}
