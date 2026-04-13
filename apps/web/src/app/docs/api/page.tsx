import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ApiExplorer } from "@/components/product/api-explorer";

export const metadata = { title: "API explorer - Covenant" };
export const dynamic = "force-dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000";

type OpenApiOperation = {
  summary: string;
  description: string;
  tags: string[];
  parameters?: Array<{ name: string; in: string; required: boolean; description: string }>;
  requestBody?: { content: { "application/json": { example: unknown } } };
  responses: { "200": { content: { "application/json": { example: unknown } } } };
};

type OpenApiDocument = {
  openapi: string;
  info: { title: string; version: string; description: string };
  servers: Array<{ url: string }>;
  paths: Record<string, Partial<Record<"get" | "post", OpenApiOperation>>>;
};

async function fetchOpenApi(): Promise<OpenApiDocument | null> {
  try {
    const res = await fetch(`${API_URL}/openapi.json`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as OpenApiDocument;
  } catch {
    return null;
  }
}

export default async function ApiDocsPage() {
  const doc = await fetchOpenApi();

  const endpoints = doc
    ? Object.entries(doc.paths).flatMap(([path, ops]) =>
        (Object.entries(ops) as Array<["get" | "post", OpenApiOperation]>).map(([method, op]) => ({
          method,
          path,
          summary: op.summary,
          description: op.description,
          tags: op.tags,
          parameters: op.parameters,
          requestExample: op.requestBody?.content["application/json"].example,
          responseExample: op.responses["200"].content["application/json"].example
        }))
      )
    : [];

  const baseUrl = doc?.servers[0]?.url ?? API_URL;

  return (
    <main className="min-h-screen">
      <SiteHeader active="Docs" />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">API explorer</p>
        <h1 className="mt-3 text-4xl font-bold text-ink sm:text-5xl">{doc?.info.title ?? "Covenant API"}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-graphite/80">
          {doc?.info.description ??
            "The Covenant API is currently offline. Start the dev server with npm run dev to live-load the OpenAPI document."}
        </p>
        <p className="mt-2 text-xs font-mono text-graphite/60">
          Spec: <span className="text-ink">{baseUrl}/openapi.json</span> &middot; OpenAPI {doc?.openapi ?? "3.1.0"} &middot; v{doc?.info.version ?? "0.1.0"}
        </p>

        <div className="mt-10">
          {endpoints.length > 0 ? (
            <ApiExplorer endpoints={endpoints} baseUrl={baseUrl} />
          ) : (
            <div className="rounded-panel border border-line bg-white p-10 text-center text-sm text-graphite">
              The OpenAPI document was unreachable. Confirm the API is running on {API_URL} and reload.
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
