"use client";

import { useState } from "react";
import { Code2 } from "lucide-react";

type Endpoint = {
  method: string;
  path: string;
  summary: string;
  description: string;
  tags: string[];
  parameters?: Array<{ name: string; in: string; required: boolean; description: string }> | undefined;
  requestExample?: unknown;
  responseExample: unknown;
};

const LANGUAGES = ["curl", "javascript", "python"] as const;
type Language = (typeof LANGUAGES)[number];

function buildSnippet(endpoint: Endpoint, lang: Language, baseUrl: string): string {
  const path = endpoint.path.replace(/{(\w+)}/g, (_m, name) => `<${name}>`);
  const url = `${baseUrl}${path}`;
  const orgHeader = "x-organization-id: org_covenant_demo";
  const body = endpoint.requestExample ? JSON.stringify(endpoint.requestExample, null, 2) : null;

  if (lang === "curl") {
    const lines = [`curl -X ${endpoint.method.toUpperCase()} "${url}" \\`, `  -H "${orgHeader}"`];
    if (body) {
      lines[lines.length - 1] += " \\";
      lines.push(`  -H "Content-Type: application/json" \\`);
      lines.push(`  -d '${body.replace(/\n/g, "\n     ")}'`);
    }
    return lines.join("\n");
  }
  if (lang === "javascript") {
    const init = body
      ? `{
  method: "${endpoint.method.toUpperCase()}",
  headers: {
    "x-organization-id": "org_covenant_demo",
    "Content-Type": "application/json"
  },
  body: JSON.stringify(${body})
}`
      : `{
  method: "${endpoint.method.toUpperCase()}",
  headers: { "x-organization-id": "org_covenant_demo" }
}`;
    return `const res = await fetch("${url}", ${init});\nconst data = await res.json();`;
  }
  // python
  const headerLine = '"x-organization-id": "org_covenant_demo"';
  if (body) {
    return `import requests\n\nres = requests.${endpoint.method}(\n    "${url}",\n    headers={${headerLine}, "Content-Type": "application/json"},\n    json=${body}\n)\nprint(res.json())`;
  }
  return `import requests\n\nres = requests.${endpoint.method}(\n    "${url}",\n    headers={${headerLine}}\n)\nprint(res.json())`;
}

const methodTone: Record<string, string> = {
  get: "border-teal/25 bg-teal/10 text-teal",
  post: "border-amber-300/30 bg-amber-100/50 text-amber-700",
  delete: "border-rose-300/30 bg-rose-100/50 text-rose-700"
};

export function ApiExplorer({ endpoints, baseUrl }: { endpoints: Endpoint[]; baseUrl: string }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lang, setLang] = useState<Language>("curl");
  const active = endpoints[activeIdx];
  if (!active) return null;
  const snippet = buildSnippet(active, lang, baseUrl);
  const responsePreview = JSON.stringify(active.responseExample, null, 2);

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-graphite/55">
          {endpoints.length} endpoints
        </p>
        <ul className="max-h-[70vh] space-y-1 overflow-y-auto pr-2">
          {endpoints.map((ep, i) => (
            <li key={`${ep.method}-${ep.path}`}>
              <button
                type="button"
                onClick={() => setActiveIdx(i)}
                className={`focus-ring flex w-full items-center gap-2 rounded-panel border px-3 py-2 text-left text-xs font-semibold transition ${
                  i === activeIdx
                    ? "border-line bg-white text-ink shadow-quiet"
                    : "border-transparent text-graphite hover:bg-white"
                }`}
              >
                <span className={`inline-block w-12 rounded-full border px-2 py-0.5 text-center text-[10px] uppercase tracking-wide ${methodTone[ep.method] ?? "border-line bg-white"}`}>
                  {ep.method}
                </span>
                <span className="truncate font-mono text-[12px] text-ink">{ep.path}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <article className="space-y-5">
        <header className="rounded-panel border border-line bg-white p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${methodTone[active.method] ?? ""}`}>
              {active.method}
            </span>
            <code className="font-mono text-sm text-ink">{active.path}</code>
            {active.tags.map((t) => (
              <span key={t} className="inline-flex rounded-full border border-line bg-mist px-2 py-0.5 text-[10px] font-semibold text-graphite">
                {t}
              </span>
            ))}
          </div>
          <h3 className="mt-3 text-lg font-bold text-ink">{active.summary}</h3>
          <p className="mt-1 text-sm leading-6 text-graphite/80">{active.description}</p>
          {active.parameters && active.parameters.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-panel border border-line">
              <table className="w-full text-left text-xs">
                <thead className="bg-mist text-graphite">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Name</th>
                    <th className="px-3 py-2 font-semibold">In</th>
                    <th className="px-3 py-2 font-semibold">Required</th>
                    <th className="px-3 py-2 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {active.parameters.map((p) => (
                    <tr key={p.name} className="border-t border-line">
                      <td className="px-3 py-2 font-mono text-ink">{p.name}</td>
                      <td className="px-3 py-2 text-graphite">{p.in}</td>
                      <td className="px-3 py-2 text-graphite">{p.required ? "yes" : "no"}</td>
                      <td className="px-3 py-2 text-graphite/80">{p.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </header>

        <section className="rounded-panel border border-line bg-white p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-graphite">
              <Code2 size={14} className="text-teal" />
              Request example
            </div>
            <div className="flex gap-1 rounded-full border border-line bg-mist p-1 text-[11px] font-semibold">
              {LANGUAGES.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`focus-ring rounded-full px-3 py-1 transition ${
                    lang === l ? "bg-white text-ink shadow-quiet" : "text-graphite hover:text-ink"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <pre className="terminal-block overflow-x-auto rounded-panel border border-line bg-ink/95 p-4 text-xs leading-6 text-paper">
            <code>{snippet}</code>
          </pre>
        </section>

        <section className="rounded-panel border border-line bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-graphite">
            <Code2 size={14} className="text-teal" />
            Response example
          </div>
          <pre className="terminal-block overflow-x-auto rounded-panel border border-line bg-mist p-4 text-xs leading-6 text-ink">
            <code>{responsePreview}</code>
          </pre>
        </section>
      </article>
    </div>
  );
}
