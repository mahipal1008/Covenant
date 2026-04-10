import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = {
  children: ReactNode;
  className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full border border-line bg-white px-3 text-xs font-semibold text-graphite",
        className
      )}
    >
      {children}
    </span>
  );
}
