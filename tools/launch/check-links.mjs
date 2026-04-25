#!/usr/bin/env node
/**
 * Launch-day link checker — Session 8 §8.
 *
 * Runs the morning of launch. Verifies that every external URL we
 * link from launch surfaces (HN/PH/Twitter/LinkedIn/blog) returns
 * 2xx and that the npm package, PyPI package, VS Code listing, and
 * JetBrains plugin are all reachable.
 *
 * Exits non-zero if any link is broken so the launch script can
 * abort before posts go out.
 */

import { readFileSync } from "node:fs";

const required = [
  "https://covenant.dev",
  "https://covenant.dev/pricing",
  "https://covenant.dev/integrations",
  "https://covenant.dev/trust",
  "https://covenant.dev/security",
  "https://covenant.dev/customers",
  "https://covenant.dev/blog",
  "https://api.covenant.dev/healthz",
  "https://www.npmjs.com/package/@covenant/cli",
  "https://pypi.org/project/covenant/",
  "https://marketplace.visualstudio.com/items?itemName=covenant.covenant",
  "https://plugins.jetbrains.com/plugin/dev.covenant.jetbrains",
  "https://github.com/apps/covenant"
];

async function check(url) {
  try {
    const res = await fetch(url, { redirect: "follow", method: "GET" });
    return { url, ok: res.ok, status: res.status };
  } catch (err) {
    return { url, ok: false, status: 0, error: err?.message ?? String(err) };
  }
}

const results = await Promise.all(required.map(check));
let failures = 0;
for (const r of results) {
  const tag = r.ok ? "ok " : "FAIL";
  console.log(`[${tag}] ${r.status} ${r.url}${r.error ? ` (${r.error})` : ""}`);
  if (!r.ok) failures += 1;
}
if (failures > 0) {
  console.error(`\n${failures} broken link(s); abort launch.`);
  process.exit(1);
}
console.log("\nAll launch links OK.");
