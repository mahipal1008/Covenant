import { CheckCircle2, CircleDashed, Loader2 } from "lucide-react";
import Link from "next/link";

type Track = {
  name: string;
  done: number;
  total: number;
  inProgress?: string;
  next?: string;
};

const tracks: Track[] = [
  { name: "Discovery & graph", done: 5, total: 5, next: "Live diff overlays" },
  { name: "Security & isolation", done: 6, total: 7, inProgress: "Behavioral fuzzer", next: "Cross-tenant fuzz harness" },
  { name: "Intent contracts", done: 4, total: 5, inProgress: "Versioning UI", next: "Approval workflows" },
  { name: "Economics & cost", done: 3, total: 4, next: "Budget alerts" },
  { name: "Account & access", done: 6, total: 7, inProgress: "SSO (SAML / OIDC)", next: "SCIM provisioning" },
  { name: "Compliance & evidence", done: 4, total: 6, inProgress: "SOC 2 Type II window", next: "ISO 27001 mapping" },
  { name: "Trust & legal", done: 3, total: 4, next: "Public bug bounty" },
  { name: "Integrations", done: 3, total: 8, inProgress: "Jira / Linear / PagerDuty", next: "GitLab + Bitbucket" }
];

export function ShipStatus() {
  const totalDone = tracks.reduce((acc, t) => acc + t.done, 0);
  const totalAll = tracks.reduce((acc, t) => acc + t.total, 0);
  const overall = Math.round((totalDone / totalAll) * 100);

  return (
    <div className="rounded-panel border border-line bg-white shadow-crisp">
      <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Build status</p>
          <h2 className="text-lg font-semibold text-ink">What is shipped, what is remaining</h2>
        </div>
        <Link
          href="/roadmap"
          className="inline-flex items-center gap-1 text-sm font-semibold text-ink hover:text-teal"
        >
          Full roadmap -&gt;
        </Link>
      </div>

      <div className="px-5 py-4 border-b border-line">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-graphite/60">Overall GA scope</span>
          <span className="text-sm font-bold text-ink">{overall}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-mist">
          <div className="h-full rounded-full bg-teal" style={{ width: `${overall}%` }} />
        </div>
      </div>

      <ul className="divide-y divide-line">
        {tracks.map((track) => {
          const pct = Math.round((track.done / track.total) * 100);
          const complete = track.done === track.total;
          return (
            <li key={track.name} className="px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {complete ? (
                    <CheckCircle2 size={15} className="text-teal" />
                  ) : track.inProgress ? (
                    <Loader2 size={15} className="text-amber" />
                  ) : (
                    <CircleDashed size={15} className="text-graphite/55" />
                  )}
                  <span className="text-sm font-semibold text-ink">{track.name}</span>
                </div>
                <span className="text-xs font-semibold text-graphite/70">
                  {track.done}/{track.total} {complete ? "done" : "shipped"}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-mist">
                <div
                  className={`h-full rounded-full ${complete ? "bg-teal" : track.inProgress ? "bg-amber" : "bg-cobalt"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-graphite/65">
                {track.inProgress ? (
                  <span><span className="font-semibold text-amber">In progress:</span> {track.inProgress}</span>
                ) : null}
                {track.next ? (
                  <span><span className="font-semibold text-graphite/70">Next:</span> {track.next}</span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
