"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/**
 * ⌘K command palette + help search — Session 6 §1.
 *
 * Receives a snapshot of the help index from the server. Builds a
 * lightweight token-frequency inverted index in the browser so the
 * first key returns sub-frame results. No external search lib —
 * upgrade to FlexSearch when articles cross ~500.
 */

export interface HelpSearchEntry {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  body: string;
}

function tokens(s: string): string[] {
  return s.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function buildIndex(entries: HelpSearchEntry[]): Map<string, Set<number>> {
  const idx = new Map<string, Set<number>>();
  entries.forEach((entry, i) => {
    const haystack = `${entry.title} ${entry.category} ${entry.excerpt} ${entry.body}`;
    for (const tok of tokens(haystack)) {
      let bucket = idx.get(tok);
      if (!bucket) {
        bucket = new Set();
        idx.set(tok, bucket);
      }
      bucket.add(i);
    }
  });
  return idx;
}

function search(idx: Map<string, Set<number>>, query: string, entries: HelpSearchEntry[]): HelpSearchEntry[] {
  const qTokens = tokens(query);
  if (qTokens.length === 0) return entries.slice(0, 8);
  const counts = new Map<number, number>();
  for (const t of qTokens) {
    // Prefix match: union every key that starts with t.
    for (const [key, ids] of idx.entries()) {
      if (!key.startsWith(t)) continue;
      for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => entries[id]!)
    .filter(Boolean);
}

export function HelpSearch({ entries }: { entries: HelpSearchEntry[] }): JSX.Element {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const idx = useMemo(() => buildIndex(entries), [entries]);
  const results = useMemo(() => search(idx, q, entries), [idx, q, entries]);

  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "k") {
        ev.preventDefault();
        setOpen(true);
      } else if (ev.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded border border-line bg-paper px-3 py-1.5 text-sm text-ink/70"
        aria-label="Open command palette"
      >
        <span>Search help</span>
        <kbd className="rounded border border-line bg-mist px-1.5 text-xs">⌘K</kbd>
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Help search"
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink/50 p-4 pt-[10vh]"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded border border-line bg-paper shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search help articles…"
              className="w-full border-b border-line bg-transparent px-4 py-3 text-sm outline-none"
              aria-label="Search help"
            />
            <ul className="max-h-80 overflow-y-auto py-2" role="listbox">
              {results.length === 0 && (
                <li className="px-4 py-3 text-sm text-ink/60">No matches.</li>
              )}
              {results.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/help/${r.slug}`}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 hover:bg-mist"
                    role="option"
                    aria-selected={false}
                  >
                    <div className="text-xs uppercase tracking-wide text-ink/50">{r.category}</div>
                    <div className="text-sm font-medium">{r.title}</div>
                    {r.excerpt && (
                      <div className="text-xs text-ink/60">{r.excerpt}</div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
