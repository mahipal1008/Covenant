"use client";

import { useState } from "react";
import { GitBranch, Loader2, PlayCircle } from "lucide-react";
import { API_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function RepositoryOnboardingForm() {
  const [name, setName] = useState("sample-saas");
  const [branch, setBranch] = useState("main");
  const [language, setLanguage] = useState("TypeScript");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("GitHub, uploads, and provider auth are stubbed for local development.");

  async function submit() {
    setIsSubmitting(true);
    setMessage("Creating repository and running the demo tenant leak scan...");

    try {
      const repoResponse = await fetch(`${API_URL}/v1/repositories`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-organization-id": "org_covenant_demo"
        },
        body: JSON.stringify({
          name,
          provider: "github",
          defaultBranch: branch,
          language
        })
      });

      if (!repoResponse.ok) throw new Error("Repository creation failed");
      const repository = (await repoResponse.json()) as { id: string };

      const scanResponse = await fetch(`${API_URL}/v1/scans`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-organization-id": "org_covenant_demo"
        },
        body: JSON.stringify({ repositoryId: repository.id, sourceMode: "demo" })
      });

      if (!scanResponse.ok) throw new Error("Scan failed");
      const scan = (await scanResponse.json()) as { id: string };
      window.location.assign(`/scans/${scan.id}`);
    } catch {
      setMessage("The API is unavailable, so the local demo scan report is ready instead.");
      window.location.assign("/scans/scan_latest");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-panel border border-line bg-white p-5 shadow-crisp">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-panel bg-ink text-white">
          <GitBranch size={18} />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-ink">Connect a repository</h2>
          <p className="text-sm text-graphite/70">Run Covenant against a realistic multi-tenant demo source set.</p>
        </div>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-ink">
          Repository name
          <input
            className="focus-ring h-11 rounded-panel border border-line bg-paper px-3 text-sm font-medium"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Default branch
            <input
              className="focus-ring h-11 rounded-panel border border-line bg-paper px-3 text-sm font-medium"
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            Primary language
            <select
              className="focus-ring h-11 rounded-panel border border-line bg-paper px-3 text-sm font-medium"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              <option>TypeScript</option>
              <option>JavaScript</option>
              <option>Python</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-graphite/70">{message}</p>
        <Button type="button" onClick={submit} disabled={isSubmitting} className="shrink-0">
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
          Run scan
        </Button>
      </div>
    </div>
  );
}
