import { GitBranch, PlayCircle } from "lucide-react";
import Link from "next/link";
import type { Repository } from "@covenant/shared";
import { formatDate } from "@/lib/utils";

export function RepositoryTable({ repositories }: { repositories: Repository[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-line text-xs font-semibold uppercase tracking-[0.14em] text-graphite/55">
            <th className="px-5 py-3">Repository</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3">Risk score</th>
            <th className="px-5 py-3">Last scan</th>
            <th className="px-5 py-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {repositories.map((repository) => (
            <tr key={repository.id} className="text-sm">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-panel bg-mist text-graphite">
                    <GitBranch size={16} />
                  </span>
                  <div>
                    <div className="font-semibold text-ink">{repository.name}</div>
                    <div className="text-xs font-medium text-graphite/60">{repository.language} / {repository.defaultBranch}</div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4">
                <span className="rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold text-graphite">
                  {repository.scanStatus}
                </span>
              </td>
              <td className="px-5 py-4 font-semibold text-ink">{repository.riskScore}</td>
              <td className="px-5 py-4 text-graphite/70">{formatDate(repository.lastScannedAt)}</td>
              <td className="px-5 py-4">
                <Link href="/scans/scan_latest" className="focus-ring inline-flex items-center gap-2 rounded-panel border border-line bg-white px-3 py-2 text-xs font-semibold text-ink hover:border-graphite/30">
                  <PlayCircle size={14} />
                  View scan
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
