"use client";

import { Cookie, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "cov_consent_v1";

export function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(KEY);
      if (!stored) setOpen(true);
    } catch {
      // localStorage may be blocked — keep banner closed silently
    }
  }, []);

  function persist(choice: "accept" | "reject") {
    try {
      window.localStorage.setItem(
        KEY,
        JSON.stringify({ choice, decidedAt: new Date().toISOString() })
      );
    } catch {
      // ignore
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-3 z-50 flex justify-center sm:inset-x-auto sm:bottom-4 sm:right-4"
    >
      <div className="relative w-full max-w-md rounded-panel border border-line bg-white p-4 shadow-crisp">
        <button
          type="button"
          onClick={() => persist("reject")}
          className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-md text-graphite hover:bg-mist"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 flex-none place-items-center rounded-full bg-mist text-ink">
            <Cookie size={16} />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-ink">Cookies on covenant.dev</h2>
            <p className="mt-1 text-xs leading-5 text-graphite/85">
              Strictly necessary cookies keep you signed in. Analytics cookies are off until you accept — they help us
              prioritise the next feature, never sold or shared.{" "}
              <Link href="/cookies" className="font-semibold text-ink underline">
                Details
              </Link>
              .
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => persist("accept")}
                className="focus-ring inline-flex h-9 items-center rounded-panel border border-ink bg-ink px-3 text-xs font-semibold text-white"
              >
                Accept all
              </button>
              <button
                type="button"
                onClick={() => persist("reject")}
                className="focus-ring inline-flex h-9 items-center rounded-panel border border-line bg-white px-3 text-xs font-semibold text-ink"
              >
                Necessary only
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
