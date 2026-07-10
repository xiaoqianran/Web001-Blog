"use client";

import { permanentTrashAction } from "@/app/actions/trash";

type Props = {
  filename: string;
  title: string;
};

export function PermanentDeleteButton({ filename, title }: Props) {
  return (
    <form
      action={(fd) => {
        const ok = window.confirm(
          `永久删除「${title}」？\n\n此操作不可恢复。`,
        );
        if (!ok) return;
        void permanentTrashAction(fd);
      }}
    >
      <input type="hidden" name="filename" value={filename} />
      <button type="submit" className="text-sm font-medium text-red-600">
        永久删除
      </button>
    </form>
  );
}
