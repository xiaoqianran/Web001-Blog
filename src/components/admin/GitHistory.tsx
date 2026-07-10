import type { GitCommitRow } from "@/lib/github-history";

type Props = {
  commits: GitCommitRow[];
  historyUrl: string | null;
  githubEnabled: boolean;
};

export function GitHistory({ commits, historyUrl, githubEnabled }: Props) {
  return (
    <section
      className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/40"
      data-testid="git-history"
      aria-label="Git 历史"
    >
      <h3 className="mb-2 font-semibold text-zinc-800 dark:text-zinc-100">
        最近提交
      </h3>
      {!githubEnabled && (
        <p className="text-zinc-500" data-testid="git-history-no-token">
          未配置 GITHUB_TOKEN，无法拉取提交记录。
        </p>
      )}
      {githubEnabled && commits.length === 0 && (
        <p className="text-zinc-500" data-testid="git-history-empty">
          暂无提交记录
          {historyUrl ? "（可在 GitHub 查看）" : ""}
        </p>
      )}
      {commits.length > 0 && (
        <ul className="space-y-2" data-testid="git-history-list">
          {commits.map((c) => (
            <li key={c.sha} className="border-b border-zinc-100 pb-2 last:border-0 dark:border-zinc-800">
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-violet-600 hover:underline dark:text-violet-400"
              >
                {c.message}
              </a>
              <p className="mt-0.5 text-xs text-zinc-400">
                <span className="font-mono">{c.shortSha}</span>
                {c.date
                  ? ` · ${new Date(c.date).toLocaleString("zh-CN", { hour12: false })}`
                  : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
      {historyUrl && (
        <p className="mt-3">
          <a
            href={historyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-zinc-600 hover:text-violet-600 dark:text-zinc-400"
            data-testid="git-history-link"
          >
            在 GitHub 查看全部历史 →
          </a>
        </p>
      )}
    </section>
  );
}
