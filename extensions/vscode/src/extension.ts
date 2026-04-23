import * as vscode from "vscode";

/**
 * Covenant VS Code extension — Session 7 §5.
 *
 * Minimum viable wiring: register commands, surface findings as
 * diagnostics keyed by file path, and expose a status-bar item that
 * shows the current scan health.
 */

const COLLECTION_NAME = "covenant";

interface Finding {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  filePath?: string;
  line?: number;
  url?: string;
}

let diagnostics: vscode.DiagnosticCollection | undefined;
let statusItem: vscode.StatusBarItem | undefined;

export function activate(context: vscode.ExtensionContext): void {
  diagnostics = vscode.languages.createDiagnosticCollection(COLLECTION_NAME);
  context.subscriptions.push(diagnostics);

  statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusItem.text = "$(shield) Covenant";
  statusItem.command = "covenant.refresh";
  statusItem.show();
  context.subscriptions.push(statusItem);

  context.subscriptions.push(
    vscode.commands.registerCommand("covenant.signIn", signInCommand),
    vscode.commands.registerCommand("covenant.refresh", refreshCommand),
    vscode.commands.registerCommand("covenant.openFinding", openFindingCommand)
  );

  // Initial pull is best-effort.
  void refreshCommand();
}

export function deactivate(): void {
  diagnostics?.dispose();
  statusItem?.dispose();
}

async function signInCommand(): Promise<void> {
  const token = await vscode.window.showInputBox({
    prompt: "Paste your Covenant access token",
    password: true,
    ignoreFocusOut: true
  });
  if (!token) return;
  const config = vscode.workspace.getConfiguration("covenant");
  await config.update("accessToken", token, vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage("Covenant: signed in.");
  await refreshCommand();
}

async function refreshCommand(): Promise<void> {
  if (!diagnostics) return;
  const config = vscode.workspace.getConfiguration("covenant");
  const apiUrl = config.get<string>("apiUrl") ?? "https://api.covenant.dev";
  const token = config.get<string>("accessToken") ?? "";
  if (!token) {
    if (statusItem) statusItem.text = "$(shield) Covenant: sign in";
    return;
  }
  if (statusItem) statusItem.text = "$(sync~spin) Covenant";
  try {
    const findings = await fetchFindings(apiUrl, token);
    applyDiagnostics(findings);
    if (statusItem) {
      const counts = countBySeverity(findings);
      statusItem.text = `$(shield) Covenant ${counts.critical}c ${counts.high}h`;
    }
  } catch (err) {
    if (statusItem) statusItem.text = "$(error) Covenant";
    vscode.window.showErrorMessage(`Covenant: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function openFindingCommand(arg: unknown): Promise<void> {
  const url = typeof arg === "string" ? arg : (arg as Finding | undefined)?.url;
  if (!url) {
    vscode.window.showWarningMessage("Covenant: no URL on finding.");
    return;
  }
  await vscode.env.openExternal(vscode.Uri.parse(url));
}

async function fetchFindings(apiUrl: string, token: string): Promise<Finding[]> {
  const res = await fetch(`${apiUrl.replace(/\/+$/, "")}/v1/findings?source=editor`, {
    headers: { authorization: `Bearer ${token}`, accept: "application/json" }
  });
  if (!res.ok) throw new Error(`http ${res.status}`);
  const body = (await res.json()) as { items?: Finding[] };
  return body.items ?? [];
}

function applyDiagnostics(findings: Finding[]): void {
  if (!diagnostics) return;
  diagnostics.clear();
  const config = vscode.workspace.getConfiguration("covenant");
  const filter = new Set<string>(config.get<string[]>("severityFilter") ?? ["critical", "high"]);
  const byFile = new Map<string, vscode.Diagnostic[]>();
  for (const f of findings) {
    if (!f.filePath || !filter.has(f.severity)) continue;
    const line = Math.max(0, (f.line ?? 1) - 1);
    const range = new vscode.Range(line, 0, line, 0);
    const diag = new vscode.Diagnostic(range, `${f.title}`, severityToVsCode(f.severity));
    diag.source = "covenant";
    diag.code = f.id;
    const list = byFile.get(f.filePath) ?? [];
    list.push(diag);
    byFile.set(f.filePath, list);
  }
  for (const [filePath, items] of byFile) {
    diagnostics.set(vscode.Uri.file(filePath), items);
  }
}

function severityToVsCode(severity: Finding["severity"]): vscode.DiagnosticSeverity {
  switch (severity) {
    case "critical":
      return vscode.DiagnosticSeverity.Error;
    case "high":
      return vscode.DiagnosticSeverity.Error;
    case "medium":
      return vscode.DiagnosticSeverity.Warning;
    case "low":
      return vscode.DiagnosticSeverity.Information;
  }
}

function countBySeverity(findings: Finding[]): Record<Finding["severity"], number> {
  const counts: Record<Finding["severity"], number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) counts[f.severity] += 1;
  return counts;
}
