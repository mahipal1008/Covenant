import { request } from "node:https";

/**
 * Statuspage.io component-status updater — Session 7 §8.
 *
 * Pushes a status update for a single component (e.g. "API", "Workers")
 * via the Statuspage v1 API. Falls back to a console log when the
 * page id / API key are not configured so calling code remains
 * deployable as-is.
 *
 * Reference: https://developer.statuspage.io/#operation/patchPagesPageIdComponentsComponentId
 */

export type StatuspageStatus =
  | "operational"
  | "degraded_performance"
  | "partial_outage"
  | "major_outage"
  | "under_maintenance";

export interface StatuspageUpdate {
  componentId: string;
  status: StatuspageStatus;
  /** Optional incident message, posted to the page timeline. */
  incidentTitle?: string;
  incidentBody?: string;
}

export interface StatuspageResult {
  delivered: boolean;
  status: "noop" | "ok" | "error";
  detail?: string;
}

function patchComponent(
  pageId: string,
  apiKey: string,
  componentId: string,
  status: StatuspageStatus
): Promise<StatuspageResult> {
  return new Promise((resolve) => {
    const body = JSON.stringify({ component: { status } });
    const req = request(
      {
        method: "PATCH",
        hostname: "api.statuspage.io",
        path: `/v1/pages/${pageId}/components/${componentId}`,
        headers: {
          "content-type": "application/json",
          authorization: `OAuth ${apiKey}`,
          "content-length": Buffer.byteLength(body)
        }
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c as Buffer));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ delivered: true, status: "ok" });
          } else {
            resolve({
              delivered: false,
              status: "error",
              detail: `statuspage http ${res.statusCode}: ${Buffer.concat(chunks).toString("utf8").slice(0, 200)}`
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

export async function updateStatuspage(update: StatuspageUpdate): Promise<StatuspageResult> {
  const pageId = process.env.STATUSPAGE_PAGE_ID;
  const apiKey = process.env.STATUSPAGE_API_KEY;
  if (!pageId || !apiKey) {
    // eslint-disable-next-line no-console
    console.info(
      `[statuspage:noop] component=${update.componentId} status=${update.status}` +
        (update.incidentTitle ? ` "${update.incidentTitle}"` : "")
    );
    return { delivered: false, status: "noop", detail: "STATUSPAGE_* not set" };
  }
  return patchComponent(pageId, apiKey, update.componentId, update.status);
}

export function statuspageUrl(): string {
  return process.env.STATUSPAGE_PUBLIC_URL ?? "https://status.covenant.dev";
}
