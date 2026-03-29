import type { FastifyPluginAsync } from "fastify";
import { collectDefaultMetrics, Counter, Histogram, Registry } from "prom-client";

/**
 * Prometheus /metrics endpoint — master plan §11.
 *
 * Process-level metrics via prom-client's collectDefaultMetrics, plus two
 * application counters/histograms for request volume and latency. Exposed
 * unauthenticated on /metrics — operators should restrict by network ACL
 * or put behind an internal LB.
 */

const registry = new Registry();
collectDefaultMetrics({ register: registry, prefix: "covenant_" });

const httpRequestsTotal = new Counter({
  name: "covenant_http_requests_total",
  help: "Total HTTP requests by method, route, status",
  labelNames: ["method", "route", "status"] as const,
  registers: [registry]
});

const httpRequestDurationSeconds = new Histogram({
  name: "covenant_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry]
});

export const metricsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("onResponse", async (request, reply) => {
    const route = request.routeOptions?.url ?? request.url.split("?")[0] ?? request.url;
    if (route === "/metrics") return;
    const labels = {
      method: request.method,
      route,
      status: String(reply.statusCode)
    };
    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, reply.elapsedTime / 1000);
  });

  app.get("/metrics", async (_request, reply) => {
    reply.header("content-type", registry.contentType);
    return registry.metrics();
  });
};
