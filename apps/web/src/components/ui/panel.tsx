import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export function Panel({ children, className }: PanelProps) {
  return <section className={cn("rounded-panel border border-line bg-white shadow-crisp", className)}>{children}</section>;
}

export function PanelHeader({
  title,
  eyebrow,
  action,
  className
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div>
        {eyebrow ? <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal">{eyebrow}</p> : null}
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
      </div>
      {action}
    </div>
  );
}
