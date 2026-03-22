"use client";

import { useEffect } from "react";

// #region agent log
const INGEST =
  "http://127.0.0.1:7242/ingest/5b21ff9a-408f-493c-b269-17392d0670a5";
const SESSION = "6295dc";

function sendLog(data: Record<string, unknown>) {
  fetch(INGEST, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": SESSION,
    },
    body: JSON.stringify({ sessionId: SESSION, ...data, timestamp: Date.now() }),
  }).catch(() => {});
}
// #endregion

/**
 * Dev-only: capture failed loads for /_next/* assets (chunks, CSS) to debug intermittent 404s.
 */
export function DevResourceErrorLogger() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    // #region agent log
    const handler = (event: Event) => {
      const t = event.target;
      if (!t || t === window || !(t instanceof HTMLElement)) return;
      const src =
        (t as HTMLScriptElement).src || (t as HTMLLinkElement).href || "";
      if (!src.includes("/_next/")) return;
      sendLog({
        location: "DevResourceErrorLogger.tsx:error",
        message: "next static asset failed to load",
        data: {
          url: src.split("?")[0],
          query: src.includes("?") ? src.slice(src.indexOf("?")) : "",
          tagName: t.tagName,
          visibility: document.visibilityState,
          path: window.location.pathname,
        },
        hypothesisId: "H1-H4",
      });
    };
    window.addEventListener("error", handler, true);
    return () => window.removeEventListener("error", handler, true);
    // #endregion
  }, []);

  return null;
}
