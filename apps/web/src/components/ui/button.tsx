import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "border-ink bg-ink text-white hover:bg-graphite",
  secondary: "border-line bg-white text-ink hover:border-graphite/35",
  ghost: "border-transparent bg-transparent text-graphite hover:bg-ink/5",
  danger: "border-ember bg-ember text-white hover:bg-ember/90"
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-panel border px-4 text-sm font-semibold transition",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
};

export function ButtonLink({ className, variant = "primary", href, children }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-panel border px-4 text-sm font-semibold transition",
        variants[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}
