import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Cookies | Covenant",
  description: "How Covenant uses cookies and how to control them."
};

type CookieRow = { name: string; provider: string; purpose: string; duration: string; category: string };

const rows: CookieRow[] = [
  { name: "cov_session", provider: "covenant.dev", purpose: "Authenticates the dashboard session", duration: "30 days", category: "Strictly necessary" },
  { name: "cov_csrf", provider: "covenant.dev", purpose: "CSRF token for form submissions", duration: "Session", category: "Strictly necessary" },
  { name: "cov_consent", provider: "covenant.dev", purpose: "Records cookie banner choice", duration: "12 months", category: "Strictly necessary" },
  { name: "cov_theme", provider: "covenant.dev", purpose: "Remembers dark/light theme", duration: "12 months", category: "Functional" },
  { name: "cov_telemetry", provider: "covenant.dev", purpose: "Anonymous product usage (off by default)", duration: "12 months", category: "Analytics (opt-in)" },
  { name: "_ph_session", provider: "PostHog (eu.posthog.com)", purpose: "Marketing analytics on www only", duration: "30 minutes", category: "Analytics (opt-in)" }
];

const styles: Record<string, string> = {
  "Strictly necessary": "bg-teal/10 text-teal",
  "Functional": "bg-cobalt/10 text-cobalt",
  "Analytics (opt-in)": "bg-amber/15 text-amber"
};

export default function CookiesPage() {
  return (
    <main className="bg-paper text-ink">
      <SiteHeader />
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-4xl px-6 py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Privacy</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-ink sm:text-5xl">Cookies</h1>
          <p className="mt-4 text-base leading-7 text-graphite/85">
            We default to no analytics until you opt in via the banner on first visit. Strictly necessary cookies are
            required for authentication and security. You can reset your choice at any time below.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-6 py-14">
        <div className="overflow-x-auto rounded-panel border border-line bg-white">
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-mist/40 text-left text-xs uppercase tracking-[0.14em] text-graphite/65">
              <tr>
                <th className="px-5 py-3 font-semibold">Cookie</th>
                <th className="px-5 py-3 font-semibold">Provider</th>
                <th className="px-5 py-3 font-semibold">Purpose</th>
                <th className="px-5 py-3 font-semibold">Duration</th>
                <th className="px-5 py-3 font-semibold">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.name}>
                  <td className="px-5 py-3 font-mono text-xs text-ink">{r.name}</td>
                  <td className="px-5 py-3 text-graphite/85">{r.provider}</td>
                  <td className="px-5 py-3 text-graphite/85">{r.purpose}</td>
                  <td className="px-5 py-3 text-graphite/74">{r.duration}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold ${styles[r.category] ?? "bg-mist text-graphite"}`}>
                      {r.category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-sm text-graphite/85">
          To reset your choice, clear the <code className="rounded bg-mist px-1.5 py-0.5 text-xs">cov_consent</code>{" "}
          cookie or click <em>Reset cookie preferences</em> in the footer (coming soon — current build stores choice in
          local storage).
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
