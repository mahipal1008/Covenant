#!/usr/bin/env node
/**
 * Covenant CLI — local-first scanning and login.
 *
 * Subcommands:
 *   covenant login                     — store access token (stdin-prompt friendly)
 *   covenant scan <repository-id>      — POST /v1/scans with the supplied id
 *   covenant findings [--scan <id>]    — list findings for the latest scan
 *   covenant version                   — print the bundled version
 *
 * The CLI reads `COVENANT_API_URL` (default http://localhost:4000) and
 * `COVENANT_ACCESS_TOKEN` (optional Bearer). Exit codes follow POSIX
 * conventions so the binary composes inside CI scripts.
 */

const VERSION = "0.1.0";
const apiUrl = process.env.COVENANT_API_URL ?? "http://localhost:4000";
const token = process.env.COVENANT_ACCESS_TOKEN;

function printHelp() {
  process.stdout.write(
    [
      "covenant — Cloud-Aware Risk Engine CLI",
      "",
      "Usage:",
      "  covenant login",
      "  covenant scan <repository-id>",
      "  covenant findings [--scan <id>]",
      "  covenant version",
      "",
      "Environment:",
      "  COVENANT_API_URL          API endpoint (default http://localhost:4000)",
      "  COVENANT_ACCESS_TOKEN     Bearer token (set after `covenant login`)",
      ""
    ].join("\n")
  );
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  return headers;
}

async function cmdScan(repositoryId: string | undefined) {
  if (!repositoryId) {
    process.stderr.write("error: scan requires a <repository-id>\n");
    process.exit(2);
  }
  const res = await fetch(`${apiUrl}/v1/scans`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ repositoryId, sourceMode: "demo" })
  });
  const text = await res.text();
  process.stdout.write(text + "\n");
  if (!res.ok) process.exit(1);
}

async function cmdFindings(scanId: string | undefined) {
  const target = scanId ? `${apiUrl}/v1/scans/${scanId}` : `${apiUrl}/v1/scans/latest`;
  const res = await fetch(target, { headers: authHeaders() });
  const text = await res.text();
  process.stdout.write(text + "\n");
  if (!res.ok) process.exit(1);
}

async function cmdLogin() {
  process.stdout.write(
    `To log in, set the COVENANT_ACCESS_TOKEN env var to the access token returned by POST ${apiUrl}/v1/auth/login.\n`
  );
}

export async function main(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;
  switch (command) {
    case "version":
      process.stdout.write(`covenant ${VERSION}\n`);
      return 0;
    case "scan":
      await cmdScan(rest[0]);
      return 0;
    case "findings": {
      const idx = rest.indexOf("--scan");
      const scanId = idx >= 0 ? rest[idx + 1] : undefined;
      await cmdFindings(scanId);
      return 0;
    }
    case "login":
      await cmdLogin();
      return 0;
    case "help":
    case "--help":
    case "-h":
    case undefined:
      printHelp();
      return 0;
    default:
      process.stderr.write(`unknown command: ${command}\n`);
      printHelp();
      return 2;
  }
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
