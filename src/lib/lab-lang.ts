export type LabLang = "zh" | "en";

/** Prefer Chinese fields when lang=zh and non-empty; else English source. */
export function pickLocalized(
  lang: LabLang,
  en: string,
  zh?: string | null,
): string {
  if (lang === "zh" && zh?.trim()) return zh.trim();
  return en;
}

export function hasZhText(zh?: string | null): boolean {
  return Boolean(zh?.trim());
}

export const LAB_LANG_STORAGE_KEY = "lab-content-lang";
export const LAB_LANG_CHANGE_EVENT = "lab-content-lang-change";
