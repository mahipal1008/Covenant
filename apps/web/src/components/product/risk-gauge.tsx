import { ShieldAlert } from "lucide-react";

export function RiskGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 54;
  const progress = Math.max(0, Math.min(100, score));
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex items-center gap-5">
      <div className="relative size-36">
        <svg viewBox="0 0 128 128" className="size-full -rotate-90">
          <circle cx="64" cy="64" r="54" fill="none" stroke="#e6eadf" strokeWidth="12" />
          <circle
            cx="64"
            cy="64"
            r="54"
            fill="none"
            stroke={score < 45 ? "#d74c3f" : score < 75 ? "#c88718" : "#157f73"}
            strokeLinecap="round"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-4xl font-bold text-ink">{score}</div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-graphite/55">score</div>
          </div>
        </div>
      </div>
      <div className="max-w-sm">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-ember/20 bg-ember/10 px-3 py-1 text-xs font-semibold text-ember">
          <ShieldAlert size={14} />
          Deploy blocked
        </div>
        <h2 className="text-2xl font-semibold text-ink">Tenant isolation is below launch threshold.</h2>
        <p className="mt-2 text-sm leading-6 text-graphite/76">
          Covenant found high-impact routes where billing or export data can leave the current tenant boundary.
        </p>
      </div>
    </div>
  );
}
