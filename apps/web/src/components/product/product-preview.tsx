import { Activity, AlertTriangle, GitPullRequestArrow, ShieldCheck } from "lucide-react";

const rows = [
  { route: "GET /api/reports/billing", score: "critical", key: "missing organizationId" },
  { route: "POST /api/admin/export", score: "high", key: "filter after export build" },
  { route: "GET /api/customers/:id", score: "medium", key: "ownership check needed" }
];

export function ProductPreview() {
  return (
    <div className="rounded-panel border border-line bg-white shadow-quiet">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-panel bg-ink text-white">
            <ShieldCheck size={16} />
          </span>
          <span className="text-sm font-bold text-ink">Security scan</span>
        </div>
        <span className="rounded-full border border-ember/20 bg-ember/10 px-3 py-1 text-xs font-semibold text-ember">Deploy blocked</span>
      </div>
      <div className="grid gap-0 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="border-b border-line p-5 lg:border-b-0 lg:border-r">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-graphite/55">Isolation score</div>
          <div className="mt-4 flex items-end gap-3">
            <span className="text-7xl font-bold leading-none text-ink">31</span>
            <span className="pb-2 text-sm font-semibold text-ember">critical</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-graphite/76">
            Covenant traced 418 query surfaces and found two paths that can leak tenant data before deploy.
          </p>
          <div className="mt-5 grid gap-3">
            <div className="flex items-center gap-3 rounded-panel bg-mist px-3 py-2 text-sm font-medium text-graphite">
              <GitPullRequestArrow size={16} />
              PR comment prepared
            </div>
            <div className="flex items-center gap-3 rounded-panel bg-mist px-3 py-2 text-sm font-medium text-graphite">
              <Activity size={16} />
              $4,200/hr mapped to reports
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <AlertTriangle size={17} className="text-ember" />
            Ranked findings
          </div>
          <div className="divide-y divide-line rounded-panel border border-line">
            {rows.map((row) => (
              <div key={row.route} className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_130px] sm:items-center">
                <div>
                  <div className="text-sm font-semibold text-ink">{row.route}</div>
                  <div className="mt-1 text-xs font-medium text-graphite/62">{row.key}</div>
                </div>
                <span className="w-fit rounded-full border border-line bg-paper px-2.5 py-1 text-xs font-semibold text-graphite">
                  {row.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
