/**
 * Global loading skeleton — Next 16 App Router contract. Shown while a route
 * segment's RSC payload is in-flight. Production-readiness review §M1-web.
 *
 * Kept intentionally minimal so it doesn't fight per-route loading states
 * defined further down the tree.
 */
export default function Loading(): JSX.Element {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-3xl flex-col items-center justify-center px-6 py-16">
      <div
        aria-hidden
        className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-ink"
      />
      <p className="mt-4 text-sm text-graphite/70">Loading…</p>
    </div>
  );
}
