"use client";

import { useEffect, useState } from "react";
import { HelpSearch, type HelpSearchEntry } from "@/components/help-search";

/**
 * In-product help drawer — Session 6 §1.
 *
 * A persistent floating button that opens a side drawer pulling the
 * exact same articles the public help center serves. The drawer
 * receives a snapshot of the index via props (server-rendered once)
 * to avoid a runtime fetch.
 */

export interface HelpDrawerProps {
  entries: HelpSearchEntry[];
}

export function HelpDrawer({ entries }: HelpDrawerProps): JSX.Element {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-30 rounded-full border border-line bg-paper px-4 py-2 text-sm shadow"
        aria-label="Open help drawer"
      >
        Help
      </button>
      {open && (
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Help drawer"
          className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-line bg-paper p-4 shadow-xl"
        >
          <header className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Help</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-ink/70 underline"
            >
              Close
            </button>
          </header>
          <HelpSearch entries={entries} />
          <ul className="mt-4 space-y-2">
            {entries.slice(0, 6).map((e) => (
              <li key={e.slug}>
                <a
                  href={`/help/${e.slug}`}
                  className="block rounded border border-line bg-paper px-3 py-2 text-sm hover:bg-mist"
                >
                  <div className="text-xs uppercase tracking-wide text-ink/50">{e.category}</div>
                  <div className="font-medium">{e.title}</div>
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </>
  );
}
