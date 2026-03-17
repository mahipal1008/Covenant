import { loadStripeMode, type StripeModeConfig } from "./services/stripe-mode.js";

export type AppConfig = {
  nodeEnv: string;
  port: number;
  corsOrigin: string;
  redisUrl: string;
  stripe: StripeModeConfig;
};

export function loadConfig(): AppConfig {
  // Session 7 §2 — validate Stripe mode at boot. In LIVE mode this
  // throws StripeLiveModeNotReadyError until the tax/legal checklist
  // is satisfied. TEST mode is always permissive.
  const stripe = loadStripeMode(process.env);
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number(process.env.API_PORT ?? 4000),
    corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
    stripe
  };
}
