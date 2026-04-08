// Sentry server SDK init for the Next.js app — Session 7 §6.
//
// Loaded from instrumentation.ts via Next's instrumentation hook so
// it runs once per Node worker. Mirrors apps/api/src/observability.ts.

const dsn = process.env["SENTRY_DSN"];

export async function initSentryServer(): Promise<void> {
  if (!dsn) {
    // eslint-disable-next-line no-console
    console.info("[sentry:noop] SENTRY_DSN unset; server telemetry disabled");
    return;
  }
  try {
    const dyn = new Function("m", "return import(m)") as (m: string) => Promise<unknown>;
    const sentry = (await dyn("@sentry/nextjs")) as {
      init?: (options: Record<string, unknown>) => void;
    };
    sentry.init?.({
      dsn,
      tracesSampleRate: Number(process.env["SENTRY_TRACES_SAMPLE_RATE"] ?? "0.1"),
      environment: process.env["NODE_ENV"] ?? "development",
      release: process.env["SENTRY_RELEASE"]
    });
  } catch {
    // @sentry/nextjs not installed yet; silently noop.
  }
}
