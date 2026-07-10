import Link from "next/link";

type TagProps = {
  tag: string;
  count?: number;
  active?: boolean;
};

export function Tag({ tag, count, active }: TagProps) {
  return (
    <Link
      href={`/tags/${encodeURIComponent(tag)}`}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
        active
          ? "bg-violet-600 text-white"
          : "bg-zinc-100 text-zinc-700 hover:bg-violet-100 hover:text-violet-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-violet-950 dark:hover:text-violet-300"
      }`}
    >
      {tag}
      {typeof count === "number" && (
        <span className={active ? "text-violet-200" : "text-zinc-400 dark:text-zinc-500"}>
          {count}
        </span>
      )}
    </Link>
  );
}
