import Link from "next/link";

const columns: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/platform", label: "Platform" },
      { href: "/agents", label: "20 agents" },
      { href: "/integrations", label: "Integrations" },
      { href: "/pricing", label: "Pricing" },
      { href: "/changelog", label: "Changelog" },
      { href: "/roadmap", label: "Roadmap" }
    ]
  },
  {
    title: "Solutions",
    links: [
      { href: "/solutions", label: "By role" },
      { href: "/customers", label: "Customers" },
      { href: "/compliance", label: "Compliance" },
      { href: "/security", label: "Security" },
      { href: "/dashboard", label: "Dashboard demo" }
    ]
  },
  {
    title: "Resources",
    links: [
      { href: "/docs", label: "Docs" },
      { href: "/docs/api", label: "API reference" },
      { href: "/blog", label: "Blog" },
      { href: "/help", label: "Help center" },
      { href: "/status", label: "Status" }
    ]
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/trust", label: "Trust" },
      { href: "/dpa", label: "DPA" },
      { href: "/subprocessors", label: "Subprocessors" },
      { href: "/privacy", label: "Privacy" },
      { href: "/cookies", label: "Cookies" },
      { href: "/terms", label: "Terms" }
    ]
  }
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <p className="text-lg font-bold text-ink">Covenant</p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-graphite/74">
              The promises your code makes - enforced automatically, forever. Built for B2B SaaS
              teams that ship multi-tenant systems.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-graphite/55">{col.title}</p>
              <ul className="mt-4 space-y-2 text-sm text-graphite">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-ink">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-xs text-graphite/65 sm:flex-row sm:items-center sm:justify-between">
          <span>(c) 2026 Covenant Security, Inc. All rights reserved.</span>
          <span>Built in Bhagalpur. Shipping to the world.</span>
        </div>
      </div>
    </footer>
  );
}
