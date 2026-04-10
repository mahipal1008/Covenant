import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

type NavLink = { href: string; label: string };

const defaultLinks: NavLink[] = [
  { href: "/platform", label: "Platform" },
  { href: "/agents", label: "Agents" },
  { href: "/solutions", label: "Solutions" },
  { href: "/pricing", label: "Pricing" },
  { href: "/customers", label: "Customers" },
  { href: "/docs", label: "Docs" }
];

export function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-panel bg-ink text-white">
            <LockKeyhole size={19} />
          </span>
          <span className="text-lg font-bold text-ink">Covenant</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-semibold text-graphite/76 lg:flex">
          {defaultLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={active === link.label ? "text-ink" : "hover:text-ink"}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="hidden text-sm font-semibold text-graphite hover:text-ink sm:inline">
            Sign in
          </Link>
          <ButtonLink href="/signup">
            Get started
            <ArrowRight size={16} />
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
