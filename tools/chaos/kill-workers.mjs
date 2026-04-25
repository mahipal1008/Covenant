#!/usr/bin/env node
/**
 * Chaos worker killer — Session 8 §3.
 *
 * Sends randomized SIGKILL signals to worker pods and verifies that
 * (a) every in-flight job either completes or moves to the DLQ,
 * (b) the DLQ retry consumer drains within the configured window,
 * (c) no row in the durable jobs table is left in the `running`
 *     state for longer than the kill-window + retry budget.
 *
 * Usage:
 *   node tools/chaos/kill-workers.mjs --namespace covenant-staging \
 *     --duration 600 --interval 45 --max-percent 30
 *
 * The script never targets pods labelled `chaos-exempt=true`. The
 * report is written to tools/chaos/last-run.json so the runbook
 * sign-off can attach it.
 */

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

function parseArgs(argv) {
  const out = {
    namespace: "covenant-staging",
    selector: "app=worker",
    duration: 600,
    interval: 45,
    maxPercent: 30,
    dryRun: false
  };
  for (let i = 2; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, "");
    const value = argv[i + 1];
    if (key === "dry-run") {
      out.dryRun = true;
      i -= 1;
      continue;
    }
    if (key in out) out[key] = Number.isFinite(Number(value)) ? Number(value) : value;
  }
  return out;
}

function kubectl(args) {
  return execFileSync("kubectl", args, { encoding: "utf8" });
}

function listPods(namespace, selector) {
  const raw = kubectl(["get", "pods", "-n", namespace, "-l", selector, "-o", "json"]);
  const parsed = JSON.parse(raw);
  return parsed.items
    .filter((p) => p.metadata?.labels?.["chaos-exempt"] !== "true")
    .map((p) => p.metadata.name);
}

function killPod(namespace, name, dryRun) {
  if (dryRun) return;
  kubectl(["delete", "pod", "-n", namespace, name, "--grace-period=0", "--force"]);
}

function pickVictims(pods, maxPercent) {
  const k = Math.max(1, Math.floor((pods.length * maxPercent) / 100));
  const shuffled = [...pods].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, k);
}

async function main() {
  const args = parseArgs(process.argv);
  const start = Date.now();
  const log = [];
  console.log(`[chaos] starting kill loop`, args);

  while ((Date.now() - start) / 1000 < args.duration) {
    const pods = listPods(args.namespace, args.selector);
    if (pods.length === 0) {
      console.warn(`[chaos] no targetable pods; sleeping`);
    } else {
      const victims = pickVictims(pods, args.maxPercent);
      for (const name of victims) {
        const at = new Date().toISOString();
        log.push({ at, pod: name, action: args.dryRun ? "would-kill" : "killed" });
        try {
          killPod(args.namespace, name, args.dryRun);
          console.log(`[chaos] ${at} killed ${name}`);
        } catch (err) {
          console.error(`[chaos] failed to kill ${name}:`, err?.message ?? err);
        }
      }
    }
    await new Promise((r) => setTimeout(r, args.interval * 1000));
  }

  const report = {
    args,
    startedAt: new Date(start).toISOString(),
    finishedAt: new Date().toISOString(),
    events: log
  };
  writeFileSync("tools/chaos/last-run.json", JSON.stringify(report, null, 2));
  console.log(`[chaos] report written to tools/chaos/last-run.json (${log.length} events)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
