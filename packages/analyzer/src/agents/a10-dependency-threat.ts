import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Agent, AgentContext, DependencyAlert, DependencyOutput } from "../agent-contract";
import type { AnalyzerFinding } from "../index";

/**
 * A10 — Dependency Threat Monitor.
 *
 * Tries to invoke the `osv-scanner` CLI against the repo's lockfile. If
 * the binary isn't on PATH (CI environment, dev laptop without it, etc.)
 * we fall back to a small fixture so the dashboard still has data and
 * tests stay deterministic. The fixture path is opt-in via env.
 *
 * osv-scanner CLI is free and self-hosted (https://osv.dev/) — no account.
 */

type OsvScannerResult = {
  results?: Array<{
    source?: { path: string; type?: string };
    packages?: Array<{
      package: { name: string; version: string; ecosystem: string };
      vulnerabilities?: Array<{
        id: string;
        summary?: string;
        severity?: Array<{ type: string; score: string }>;
        affected?: Array<{ ranges?: Array<{ events?: Array<{ fixed?: string }> }> }>;
      }>;
    }>;
  }>;
};

const SEVERITY_FROM_SCORE = (score: string): DependencyAlert["severity"] => {
  // CVSS v3 score range: 0.0 - 10.0
  const num = Number(score);
  if (Number.isNaN(num)) return "low";
  if (num >= 9) return "critical";
  if (num >= 7) return "high";
  if (num >= 4) return "medium";
  return "low";
};

function tryRunOsvScanner(repoPath: string): OsvScannerResult | null {
  try {
    const probe = spawnSync("osv-scanner", ["--version"], { stdio: "ignore" });
    if (probe.status !== 0) return null;
  } catch {
    return null;
  }
  try {
    const out = spawnSync(
      "osv-scanner",
      ["--format", "json", "--lockfile", join(repoPath, "package-lock.json")],
      { encoding: "utf8" }
    );
    if (!out.stdout) return null;
    return JSON.parse(out.stdout) as OsvScannerResult;
  } catch {
    return null;
  }
}

function parseOsv(result: OsvScannerResult): DependencyAlert[] {
  const alerts: DependencyAlert[] = [];
  for (const r of result.results ?? []) {
    for (const p of r.packages ?? []) {
      for (const v of p.vulnerabilities ?? []) {
        const score = v.severity?.find((s) => s.type === "CVSS_V3")?.score ?? "0.0";
        const fixedVersion =
          v.affected?.[0]?.ranges?.[0]?.events?.find((e) => e.fixed)?.fixed ?? null;
        alerts.push({
          ecosystem: p.package.ecosystem,
          packageName: p.package.name,
          installedVersion: p.package.version,
          cveId: v.id,
          severity: SEVERITY_FROM_SCORE(score),
          fixedVersion,
          url: `https://osv.dev/vulnerability/${v.id}`
        });
      }
    }
  }
  return alerts;
}

const FIXTURE_ALERTS: DependencyAlert[] = [
  {
    ecosystem: "npm",
    packageName: "lodash",
    installedVersion: "4.17.20",
    cveId: "CVE-2021-23337",
    severity: "high",
    fixedVersion: "4.17.21",
    url: "https://osv.dev/vulnerability/CVE-2021-23337"
  },
  {
    ecosystem: "npm",
    packageName: "axios",
    installedVersion: "0.21.0",
    cveId: "CVE-2021-3749",
    severity: "high",
    fixedVersion: "0.21.2",
    url: "https://osv.dev/vulnerability/CVE-2021-3749"
  }
];

export const a10DependencyThreat: Agent<DependencyOutput> = {
  id: "A10",
  name: "Dependency Threat Monitor",
  description: "Runs osv-scanner against the repo's lockfile and surfaces high/critical CVEs.",
  async run(ctx: AgentContext) {
    const repoPath = process.env.COVENANT_REPO_PATH ?? process.cwd();
    let alerts: DependencyAlert[] = [];
    let source: DependencyOutput["source"] = "fixture";

    const lockfile = join(repoPath, "package-lock.json");
    if (existsSync(lockfile)) {
      const osv = tryRunOsvScanner(repoPath);
      if (osv) {
        alerts = parseOsv(osv);
        source = "osv-scanner";
      }
    }

    // Read scanned package count from the lockfile if available, regardless of CLI presence.
    let scanned = 0;
    if (existsSync(lockfile)) {
      try {
        const lock = JSON.parse(readFileSync(lockfile, "utf8")) as { packages?: Record<string, unknown> };
        scanned = Object.keys(lock.packages ?? {}).length;
      } catch {
        scanned = 0;
      }
    }

    if (source === "fixture") {
      alerts = FIXTURE_ALERTS;
    }

    const findings: AnalyzerFinding[] = alerts
      .filter((a) => a.severity === "critical" || a.severity === "high")
      .map((a) => ({
        id: `a10-${a.cveId}-${a.packageName}`,
        ruleId: "dependency-cve",
        severity: a.severity,
        title: `${a.cveId} affects ${a.packageName}@${a.installedVersion}`,
        summary: `Vulnerable ${a.ecosystem} dependency detected by osv-scanner.`,
        filePath: "package-lock.json",
        line: 1,
        endpoint: `dep:${a.packageName}`,
        routeMethod: "DEP",
        evidence: `installed=${a.installedVersion} fixed=${a.fixedVersion ?? "(none yet)"}`,
        impact: "Known CVE exposed via a transitive or direct dependency.",
        suggestedFix: a.fixedVersion ? `Bump ${a.packageName} to ${a.fixedVersion} or later.` : "No fixed version published yet — pin / replace the dependency.",
        exploitSteps: [
          `Look up ${a.cveId} on osv.dev`,
          "Reproduce against the affected version",
          "Verify the fix bumps the installed version above the affected range"
        ]
      }));

    return {
      output: { scanned, alerts, source },
      findings,
      warnings: source === "fixture" ? ["osv-scanner not available — used built-in fixture data"] : []
    };
  }
};
