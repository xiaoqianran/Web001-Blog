"use client";

import { useEffect } from "react";

/**
 * Enhance markdown <pre> blocks with a copy button.
 * Mount once on the article page after HTML is injected.
 */
export function CodeCopy() {
  useEffect(() => {
    const root = document.querySelector("article .prose");
    if (!root) return;

    const pres = root.querySelectorAll("pre");
    const cleanups: Array<() => void> = [];

    pres.forEach((pre) => {
      if (pre.parentElement?.classList.contains("code-block")) return;

      const wrapper = document.createElement("div");
      wrapper.className = "code-block";
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "code-copy-btn";
      btn.textContent = "复制";
      btn.setAttribute("aria-label", "复制代码");
      wrapper.appendChild(btn);

      const onClick = async () => {
        const code = pre.querySelector("code")?.textContent ?? pre.textContent ?? "";
        try {
          await navigator.clipboard.writeText(code);
          btn.textContent = "已复制";
          btn.classList.add("code-copy-btn--ok");
          window.setTimeout(() => {
            btn.textContent = "复制";
            btn.classList.remove("code-copy-btn--ok");
          }, 1600);
        } catch {
          btn.textContent = "失败";
          window.setTimeout(() => {
            btn.textContent = "复制";
          }, 1600);
        }
      };

      btn.addEventListener("click", onClick);
      cleanups.push(() => btn.removeEventListener("click", onClick));
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return null;
}
