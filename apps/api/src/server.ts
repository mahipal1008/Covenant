import { buildApp } from "./app";
import { loadConfig } from "./config";
import { initObservability } from "./observability";

initObservability();

const config = loadConfig();
const app = buildApp();

// Fail loud on unhandled async errors instead of leaving the process in
// an undefined state. Sentry's instrumentation captures the error before
// the process exits so we never lose the stack — Session 9 review §10.
process.on("unhandledRejection", (reason) => {
  app.log.error({ reason }, "unhandledRejection");
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  app.log.error({ err }, "uncaughtException");
  process.exit(1);
});

try {
  await app.listen({ port: config.port, host: "0.0.0.0" });
  app.log.info(`Covenant API listening on http://localhost:${config.port}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
