import { ArrowRight, FileCode2 } from "lucide-react";
import Link from "next/link";
import type { Finding } from "@covenant/shared";
import { severityTone } from "@/lib/utils";

export function FindingList({ findings, scanId }: { findings: Finding[]; scanId: string }) {
  return (
    <div className="divide-y divide-line">
      {findings.map((finding) => (
        <article key={finding.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_220px]">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${severityTone(finding.severity)}`}>
                {finding.severity}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/55">{finding.ruleId}</span>
            </div>
            <h3 className="text-base font-semibold text-ink">{finding.title}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-graphite/76">{finding.summary}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-medium text-graphite/65">
              <span className="inline-flex items-center gap-1.5">
                <FileCode2 size={14} />
                {finding.filePath}:{finding.line}
              </span>
              <span>{finding.routeMethod} {finding.endpoint}</span>
            </div>
          </div>
          <div className="flex items-center justify-start lg:justify-end">
            <Link
              href={`/scans/${scanId}`}
              className="focus-ring inline-flex h-9 items-center gap-2 rounded-panel border border-line bg-white px-3 text-sm font-semibold text-ink hover:border-graphite/30"
            >
              Open report
              <ArrowRight size={15} />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
