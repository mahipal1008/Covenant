// Sentry browser SDK init for the Next.js app — Session 7 §6.
//
// Pattern matches apps/api/src/observability.ts: env-driven, dynamic
// import so the bundle stays light when no DSN is configured. The
// `instrumentationHook` system loader will pick this up via the
// `register` export in instrumentation.ts.

const dsn = process.env["NEXT_PUBLIC_SENTRY_DSN"];

export async function initSentryBrowser(): Promise<void> {
  if (!dsn) {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.info("[sentry:noop] NEXT_PUBLIC_SENTRY_DSN unset; browser telemetry disabled");
    }
    return;
  }
  try {
    const dyn = new Function("m", "return import(m)") as (m: string) => Promise<unknown>;
    const sentry = (await dyn("@sentry/nextjs")) as {
      init?: (options: Record<string, unknown>) => void;
    };
    sentry.init?.({
      dsn,
      tracesSampleRate: Number(process.env["NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE"] ?? "0.1"),
      environment: process.env["NEXT_PUBLIC_ENVIRONMENT"] ?? "development",
      release: process.env["NEXT_PUBLIC_RELEASE"]
    });
  } catch {
    // @sentry/nextjs not installed yet; silently noop.
  }
}

if (typeof window !== "undefined") {
  void initSentryBrowser();
}
