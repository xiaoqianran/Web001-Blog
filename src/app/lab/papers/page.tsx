import type { Metadata } from "next";
import Link from "next/link";
import { HfPaperCard } from "@/components/HfPaperCard";
import { LabLangToggle } from "@/components/LabLangToggle";
import { loadTreeForAdmin } from "@/lib/content-persist";
import { getHfDailyOrFallback, listHfDailyDates } from "@/lib/hf-papers";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "HF 论文热点",
  description:
    "Hugging Face Daily Papers 热点速览（中文机翻摘要，与信息流语言同步）。",
};

type Props = {
  searchParams: Promise<{ date?: string; captureError?: string }>;
};

export default async function HfPapersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const preferred = typeof sp.date === "string" ? sp.date : undefined;
  const captureError = typeof sp.captureError === "string" ? sp.captureError : "";
  const { date, data, availableDates } = getHfDailyOrFallback(preferred);
  const dates = availableDates.length ? availableDates : listHfDailyDates();
  const session = await getSession();
  const tree = await loadTreeForAdmin();
  const captureFolders = tree.folders.map((f) => ({
    id: f.id,
    name: f.name,
  }));
  const returnTo =
    preferred && preferred !== dates[0]
      ? `/lab/papers?date=${preferred}`
      : "/lab/papers";

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-widest text-violet-600 dark:text-violet-400">
          Lab
        </p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            Hugging Face 论文热点
          </h1>
          <LabLangToggle size="md" />
        </div>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          自动拉取{" "}
          <a
            href="https://huggingface.co/papers"
            className="font-medium text-violet-600 hover:underline dark:text-violet-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            HF Daily Papers
          </a>
          ，写入仓库后展示；摘要默认中文机翻。语言与{" "}
          <Link
            href="/lab/feeds"
            className="font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            RSS 信息流
          </Link>{" "}
          全局同步。不进入主文章流——深度解读仍人工筛选发博。
        </p>
      </header>

      {captureError && (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          data-testid="capture-error"
        >
          {captureError === "no-github"
            ? "Vercel 未配置 GITHUB_TOKEN，无法保存笔记。"
            : captureError === "missing"
              ? "缺少标题或来源链接，无法存为笔记。"
              : "保存笔记失败，请稍后重试。"}
        </p>
      )}

      {dates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {dates.slice(0, 14).map((d) => (
            <Link
              key={d}
              href={d === dates[0] && !preferred ? "/lab/papers" : `/lab/papers?date=${d}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                d === date
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {d}
            </Link>
          ))}
        </div>
      )}

      {!data || !date ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <p className="text-zinc-600 dark:text-zinc-400">
            还没有日刊数据。本地可运行：
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-zinc-950 p-4 text-left text-xs text-zinc-100">
            node scripts/fetch-hf-daily.mjs
          </pre>
          <p className="mt-3 text-sm text-zinc-500">
            或等待 GitHub Actions 每日定时任务写入{" "}
            <code className="text-violet-600">content/data/hf-daily/</code>
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            <span>
              数据日期 <strong className="text-zinc-800 dark:text-zinc-200">{date}</strong>
            </span>
            <span>·</span>
            <span>{data.count} 篇</span>
            <span>·</span>
            <span>排序 {data.sort}</span>
            <span>·</span>
            <span>
              抓取于{" "}
              {new Date(data.fetchedAt).toLocaleString("zh-CN", {
                hour12: false,
              })}
            </span>
            {data.locale?.translated !== false && (
              <>
                <span>·</span>
                <span>摘要含中文机翻</span>
              </>
            )}
          </div>

          <ul className="space-y-4">
            {data.papers.map((paper, i) => (
              <li key={paper.id}>
                <HfPaperCard
                  paper={paper}
                  index={i}
                  captureFolders={captureFolders}
                  captureLoggedIn={Boolean(session)}
                  returnTo={returnTo}
                />
              </li>
            ))}
          </ul>

          <p className="text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
            {data.attribution} 本页仅作导航与摘要展示，不替代原文。
          </p>
        </>
      )}
    </div>
  );
}
