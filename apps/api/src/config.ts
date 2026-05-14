import { loadStripeMode, type StripeModeConfig } from "./services/stripe-mode.js";

export type AppConfig = {
  nodeEnv: string;
  isProduction: boolean;
  port: number;
  corsOrigin: string;
  corsOrigins: string[];
  redisUrl: string;
  stripe: StripeModeConfig;
};

const KNOWN_NODE_ENVS = new Set(["production", "staging", "development", "test"]);

export function loadConfig(): AppConfig {
  // Session 7 §2 — validate Stripe mode at boot. In LIVE mode this
  // throws StripeLiveModeNotReadyError until the tax/legal checklist
  // is satisfied. TEST mode is always permissive.
  const stripe = loadStripeMode(process.env);
  const nodeEnv = process.env.NODE_ENV ?? "development";
  if (!KNOWN_NODE_ENVS.has(nodeEnv)) {
    throw new Error(
      `Invalid NODE_ENV "${nodeEnv}" — expected one of ${[...KNOWN_NODE_ENVS].join(", ")}`
    );
  }
  const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";
  const corsOrigins = corsOrigin.split(",").map((s) => s.trim()).filter(Boolean);
  return {
    nodeEnv,
    isProduction: nodeEnv === "production",
    port: Number(process.env.API_PORT ?? 4000),
    corsOrigin,
    corsOrigins,
    redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
    stripe
  };
}
