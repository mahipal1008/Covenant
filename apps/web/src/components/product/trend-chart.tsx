import type { RiskTrendPoint } from "@covenant/shared";

export function TrendChart({ points }: { points: RiskTrendPoint[] }) {
  return (
    <div className="flex h-44 items-end gap-3 px-1 pt-4">
      {points.map((point) => (
        <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="relative flex h-32 w-full items-end rounded-panel bg-mist">
            <div
              className="w-full rounded-panel bg-ink transition-all"
              style={{ height: `${point.score}%`, backgroundColor: point.score < 45 ? "#d74c3f" : point.score < 75 ? "#c88718" : "#157f73" }}
            />
          </div>
          <div className="text-center">
            <div className="text-xs font-semibold text-ink">{point.label}</div>
            <div className="text-[11px] font-medium text-graphite/60">{point.findings} open</div>
          </div>
        </div>
      ))}
    </div>
  );
}
