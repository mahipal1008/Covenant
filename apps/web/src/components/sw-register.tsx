"use client";

import { useEffect } from "react";

/**
 * Service worker registrar — Session 6 §9.
 *
 * Mounted once in the root layout. Disabled in development so HMR
 * isn't shadowed by a cached shell, and silently no-ops on browsers
 * without service worker support.
 */

export function ServiceWorkerRegister(): null {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failures are non-fatal; the page still works.
      });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
