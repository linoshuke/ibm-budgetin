"use client";

import { useEffect, useMemo } from "react";

function getNonceFromMeta() {
  if (typeof document === "undefined") return "";
  const meta = document.querySelector('meta[name="csp-nonce"]');
  return meta?.getAttribute("content") ?? "";
}

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function useNonceStyle(declarations: string) {
  const className = useMemo(
    () => `nonce-style-${hashString(declarations)}`,
    [declarations],
  );
  const rule = useMemo(() => `.${className}{${declarations}}`, [className, declarations]);

  useEffect(() => {
    const styleId = `nonce-style-${className}`;
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      const nonce = getNonceFromMeta();
      if (nonce) styleTag.setAttribute("nonce", nonce);
      styleTag.textContent = rule;
      document.head.appendChild(styleTag);
      return;
    }
    if (styleTag.textContent !== rule) {
      styleTag.textContent = rule;
    }
  }, [className, rule]);

  return className;
}
