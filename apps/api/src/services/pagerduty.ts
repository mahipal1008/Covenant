import { request } from "node:https";

/**
 * PagerDuty Events API v2 client — Session 7 §7.
 *
 * Triggers an alert on the rotation when a SEV-1 / SEV-2 event fires.
 * Activated only when `PAGERDUTY_ROUTING_KEY` is present; otherwise
 * the function logs to the console and returns success so the caller's
 * happy path stays code-only.
 *
 * Reference: https://developer.pagerduty.com/docs/events-api-v2/overview/
 */

export type PagerDutySeverity = "critical" | "error" | "warning" | "info";

export interface PagerDutyEvent {
  /** Stable id for the alerting condition (used for dedup_key). */
  dedupKey: string;
  /** Brief, human-readable headline. */
  summary: string;
  /** What part of the system the event came from (e.g. "covenant-api"). */
  source: string;
  severity: PagerDutySeverity;
  /** Free-form structured context. */
  customDetails?: Record<string, unknown>;
}

export interface PagerDutyResult {
  delivered: boolean;
  status: "noop" | "queued" | "error";
  detail?: string;
}

interface RawPagerDutyPayload {
  routing_key: string;
  event_action: "trigger" | "resolve";
  dedup_key: string;
  payload: {
    summary: string;
    source: string;
    severity: PagerDutySeverity;
    custom_details?: Record<string, unknown>;
  };
}

function postEvent(payload: RawPagerDutyPayload): Promise<PagerDutyResult> {
  return new Promise((resolve) => {
    const body = JSON.stringify(payload);
    const req = request(
      {
        method: "POST",
        hostname: "events.pagerduty.com",
        path: "/v2/enqueue",
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(body)
        }
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c as Buffer));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ delivered: true, status: "queued" });
          } else {
            resolve({
              delivered: false,
              status: "error",
              detail: `pagerduty http ${res.statusCode}: ${Buffer.concat(chunks).toString("utf8").slice(0, 200)}`
            });
          }
        });
      }
    );
    req.on("error", (err) => resolve({ delivered: false, status: "error", detail: err.message }));
    req.write(body);
    req.end();
  });
}

export async function pagePagerDuty(event: PagerDutyEvent): Promise<PagerDutyResult> {
  const routingKey = process.env.PAGERDUTY_ROUTING_KEY;
  if (!routingKey) {
    // eslint-disable-next-line no-console
    console.info(`[pagerduty:noop] ${event.severity.toUpperCase()} ${event.summary}`);
    return { delivered: false, status: "noop", detail: "PAGERDUTY_ROUTING_KEY not set" };
  }
  return postEvent({
    routing_key: routingKey,
    event_action: "trigger",
    dedup_key: event.dedupKey,
    payload: {
      summary: event.summary,
      source: event.source,
      severity: event.severity,
      ...(event.customDetails ? { custom_details: event.customDetails } : {})
    }
  });
}

export async function resolvePagerDuty(dedupKey: string, source: string): Promise<PagerDutyResult> {
  const routingKey = process.env.PAGERDUTY_ROUTING_KEY;
  if (!routingKey) {
    return { delivered: false, status: "noop" };
  }
  return postEvent({
    routing_key: routingKey,
    event_action: "resolve",
    dedup_key: dedupKey,
    payload: { summary: `resolved: ${dedupKey}`, source, severity: "info" }
  });
}
