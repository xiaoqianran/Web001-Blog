"use client";

import { useTransition } from "react";
import { deletePost } from "@/app/actions/posts";

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
          `确定删除「${title}」？\n\n此操作不可撤销。`,
        );
        if (!ok) return;
        startTransition(() => {
          void deletePost(formData);
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
