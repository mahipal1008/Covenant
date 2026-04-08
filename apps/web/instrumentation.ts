// Next.js instrumentation hook — Session 7 §6. Wires Sentry init for
// both server runtimes; client init lives in sentry.client.config.ts.

export async function register(): Promise<void> {
  if (process.env["NEXT_RUNTIME"] === "nodejs") {
    const mod = await import("./sentry.server.config");
    await mod.initSentryServer();
  }
  if (process.env["NEXT_RUNTIME"] === "edge") {
    // No edge Sentry shim wired yet; keep the surface ready.
    // eslint-disable-next-line no-console
    if (process.env["SENTRY_DSN"]) console.info("[sentry] edge runtime not yet instrumented");
  }
}
