import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function severityTone(severity: string) {
  if (severity === "critical") return "text-ember bg-ember/10 border-ember/25";
  if (severity === "high") return "text-amber bg-amber/10 border-amber/25";
  if (severity === "medium") return "text-cobalt bg-cobalt/10 border-cobalt/20";
  return "text-teal bg-teal/10 border-teal/20";
}
