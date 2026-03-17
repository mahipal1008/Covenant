/**
 * Runtime observability — master plan §11.
 *
 * Wires three pillars and gates each one on its DSN/endpoint env var so
 * the process is a clean no-op when run without external accounts:
 *
 *   - Logs: Fastify's built-in pino logger (configured in app.ts)
 *   - Metrics: prom-client (`/metrics` route)
 *   - Traces: OpenTelemetry SDK with OTLP/HTTP exporter
 *   - Errors: Sentry Node SDK
 *
 * Call `initObservability()` once at process boot, before importing any
 * application module that might be auto-instrumented.
 */

let started = false;

export function initObservability(): void {
  if (started) return;
  started = true;

  const sentryDsn = process.env["SENTRY_DSN"];
  if (sentryDsn && sentryDsn.length > 0) {
    // Dynamic import — keeps the SDK out of the hot path when the DSN
    // is absent (most local dev and tests).
    void import("@sentry/node").then((Sentry) => {
      Sentry.init({
        dsn: sentryDsn,
        environment: process.env["NODE_ENV"] ?? "development",
        tracesSampleRate: Number(process.env["SENTRY_TRACES_SAMPLE_RATE"] ?? "0.1"),
        release: process.env["GIT_SHA"] ?? undefined
      });
    });
  }

  const otlpEndpoint = process.env["OTEL_EXPORTER_OTLP_ENDPOINT"];
  if (otlpEndpoint && otlpEndpoint.length > 0) {
    // The SDK auto-detects context propagators and instruments http,
    // fastify, ioredis, prisma, undici via auto-instrumentations.
    void Promise.all([
      import("@opentelemetry/sdk-node"),
      import("@opentelemetry/auto-instrumentations-node"),
      import("@opentelemetry/exporter-trace-otlp-http")
    ]).then(([sdkNode, auto, otlp]) => {
      const sdk = new sdkNode.NodeSDK({
        traceExporter: new otlp.OTLPTraceExporter({ url: otlpEndpoint }),
        instrumentations: [auto.getNodeAutoInstrumentations()]
      });
      sdk.start();
      const shutdown = () => {
        void sdk.shutdown().catch(() => undefined);
      };
      process.once("SIGTERM", shutdown);
      process.once("SIGINT", shutdown);
    });
  }
}
