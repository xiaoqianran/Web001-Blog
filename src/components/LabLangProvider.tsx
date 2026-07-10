"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  LAB_LANG_CHANGE_EVENT,
  LAB_LANG_STORAGE_KEY,
  type LabLang,
} from "@/lib/lab-lang";

export type { LabLang };
export { pickLocalized, hasZhText } from "@/lib/lab-lang";

type LabLangContextValue = {
  lang: LabLang;
  setLang: (lang: LabLang) => void;
};

const LabLangContext = createContext<LabLangContextValue | null>(null);

function readLang(): LabLang {
  try {
    const v = localStorage.getItem(LAB_LANG_STORAGE_KEY);
    if (v === "zh" || v === "en") return v;
  } catch {
    /* ignore */
  }
  return "zh";
}

function subscribe(onStoreChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === LAB_LANG_STORAGE_KEY || e.key === null) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(LAB_LANG_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(LAB_LANG_CHANGE_EVENT, onStoreChange);
  };
}

/**
 * Shared 中文 / EN preference for Lab pages (papers + feeds).
 * One toggle updates every card on every lab page (localStorage + event bus).
 */
export function LabLangProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, readLang, () => "zh" as const);

  const setLang = useCallback((next: LabLang) => {
    try {
      localStorage.setItem(LAB_LANG_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(LAB_LANG_CHANGE_EVENT));
  }, []);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);

  return (
    <LabLangContext.Provider value={value}>{children}</LabLangContext.Provider>
  );
}

export function useLabLang(): LabLangContextValue {
  const ctx = useContext(LabLangContext);
  if (!ctx) {
    throw new Error("useLabLang must be used within LabLangProvider");
  }
  return ctx;
}
