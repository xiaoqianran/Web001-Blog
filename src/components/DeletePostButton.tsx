"use client";

import { useTransition } from "react";
import { softDeletePostAction } from "@/app/actions/trash";

type Props = {
  slug: string;
  title: string;
};

export function DeletePostButton({ slug, title }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        const ok = window.confirm(
          `将「${title}」移入回收站？\n可稍后在回收站恢复。`,
        );
        if (!ok) return;
        startTransition(() => {
          void softDeletePostAction(formData);
        });
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
      >
        {pending ? "删除中…" : "删除"}
      </button>
    </form>
  );
}
