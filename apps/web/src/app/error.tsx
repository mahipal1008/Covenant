"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Global error boundary — Next 16 App Router contract. Required so that an
 * uncaught render error in any route segment shows a graceful page instead of
 * the Next default. Production-readiness review §M1-web.
 *
 * We deliberately don't surface `error.message` to the user (it can leak
 * stack-trace info into the DOM); the digest is included so support can
 * cross-reference the Sentry capture.
 */
export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  useEffect(() => {
    // Surface to console in dev; in prod Sentry's instrumentation hook captures
    // these automatically via the React error boundary.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[covenant] route error", error);
    }
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold text-ink">Something went wrong</h1>
      <p className="mt-3 text-sm text-graphite/80">
        We hit an unexpected error rendering this page. The team has been
        notified.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-graphite/60">
          ref: {error.digest}
        </p>
      ) : null}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-line bg-white px-4 py-2 text-sm hover:bg-mist/40"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md bg-ink px-4 py-2 text-sm text-white hover:bg-ink/90"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
