"use client";

import { useState } from "react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";

/**
 * Super-admin console — Session 4 §8.
 *
 * Pulls live data from the API admin endpoints (`/v1/admin/...`) using
 * a session-scoped admin token entered by the operator. The token
 * never leaves the browser tab; it lives in component state and is
 * passed as `x-admin-token` on every fetch.
 *
 * Three panes:
 *   1. Per-org settings: edit IP allowlist, SSO provider, BYO LLM,
 *      white-label theme.
 *   2. Impersonation: time-boxed grant with audit-logged reason.
 *   3. Support inbox: combined audit + LLM safety event feed.
 */

interface Settings {
  ipAllowlist: string[];
  sso: { provider: string; defaultRole: string };
  llm: { provider: string; costCapUsd: number; enabled: boolean };
  theme: { primary: string | null; accent: string | null; logoUrl: string | null };
  featureFlags: Record<string, boolean>;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function adminFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-admin-token": token,
      ...(init?.headers ?? {})
    }
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

export default function AdminConsolePage() {
  const [token, setToken] = useState("");
  const [orgId, setOrgId] = useState("org_covenant_demo");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [impersonateUser, setImpersonateUser] = useState("");
  const [impersonateReason, setImpersonateReason] = useState("");
  const [inbox, setInbox] = useState<{ audit: unknown[]; safety: unknown[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadSettings() {
    try {
      setError(null);
      const data = await adminFetch<Settings>(`/v1/admin/orgs/${orgId}/settings`, token);
      setSettings(data);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function loadInbox() {
    try {
      setError(null);
      const data = await adminFetch<{ audit: unknown[]; safety: unknown[] }>("/v1/admin/support-inbox", token);
      setInbox(data);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function impersonate() {
    if (!impersonateUser || impersonateReason.length < 4) return;
    try {
      setError(null);
      await adminFetch(`/v1/admin/orgs/${orgId}/impersonate`, token, {
        method: "POST",
        body: JSON.stringify({ asUserId: impersonateUser, reason: impersonateReason, ttlMinutes: 15 })
      });
      await loadInbox();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function toggleLlm() {
    if (!settings) return;
    try {
      setError(null);
      const next = await adminFetch<Settings>(`/v1/admin/orgs/${orgId}/settings`, token, {
        method: "PATCH",
        body: JSON.stringify({ llm: { enabled: !settings.llm.enabled } })
      });
      setSettings(next);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-ink">Super-admin console</h1>
        <p className="text-sm text-graphite">Operator-only. Every action is audit-logged.</p>
      </header>

      <Panel>
        <PanelHeader title="Authentication" eyebrow="Session-scoped" />
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <label className="text-sm">
            Admin token
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="mt-1 w-full rounded border border-line bg-paper px-3 py-2 text-ink"
              placeholder="x-admin-token"
            />
          </label>
          <label className="text-sm">
            Organization id
            <input
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              className="mt-1 w-full rounded border border-line bg-paper px-3 py-2 text-ink"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2 p-4 pt-0">
          <Button onClick={loadSettings}>Load settings</Button>
          <Button onClick={loadInbox} variant="secondary">
            Load inbox
          </Button>
        </div>
      </Panel>

      {error && (
        <Panel>
          <div className="p-4 text-sm text-ember">{error}</div>
        </Panel>
      )}

      {settings && (
        <Panel>
          <PanelHeader title="Settings" eyebrow={orgId} />
          <pre className="overflow-auto p-4 text-xs text-graphite">{JSON.stringify(settings, null, 2)}</pre>
          <div className="flex gap-2 p-4 pt-0">
            <Button onClick={toggleLlm}>Toggle LLM ({String(settings.llm.enabled)})</Button>
          </div>
        </Panel>
      )}

      <Panel>
        <PanelHeader title="Impersonate" eyebrow="Time-boxed grant" />
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <label className="text-sm">
            User id
            <input
              value={impersonateUser}
              onChange={(e) => setImpersonateUser(e.target.value)}
              className="mt-1 w-full rounded border border-line bg-paper px-3 py-2 text-ink"
              placeholder="user_..."
            />
          </label>
          <label className="text-sm">
            Reason (audit-logged)
            <input
              value={impersonateReason}
              onChange={(e) => setImpersonateReason(e.target.value)}
              className="mt-1 w-full rounded border border-line bg-paper px-3 py-2 text-ink"
              placeholder="Support ticket #..."
            />
          </label>
        </div>
        <div className="p-4 pt-0">
          <Button onClick={impersonate}>Issue 15m grant</Button>
        </div>
      </Panel>

      {inbox && (
        <Panel>
          <PanelHeader title="Support inbox" eyebrow="Audit + LLM safety feed" />
          <pre className="max-h-96 overflow-auto p-4 text-xs text-graphite">{JSON.stringify(inbox, null, 2)}</pre>
        </Panel>
      )}
    </main>
  );
}
