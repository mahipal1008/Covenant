import { ArrowRight, BookOpenText, GraduationCap, LifeBuoy, MessageSquareText, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { HelpSearch } from "@/components/help-search";
import { getHelpIndex } from "@/lib/help";

export const metadata = {
  title: "Help center - Covenant",
  description: "Guides, FAQs, and direct contact paths for the Covenant platform.",
  alternates: { canonical: "/help" }
};

const tiles = [
  { icon: GraduationCap, title: "Getting started", body: "Connect a repo, run your first scan, read your first report.", href: "/docs" },
  { icon: BookOpenText, title: "API reference", body: "All 28 endpoints documented with try-it-now and curl examples.", href: "/docs/api" },
  { icon: ShieldCheck, title: "Security & compliance", body: "Trust posture, SOC 2 status, data handling, retention policies.", href: "/security" },
  { icon: Sparkles, title: "Meet the 20 agents", body: "What each agent does, when it runs, and how to tune it.", href: "/agents" },
  { icon: MessageSquareText, title: "Talk to a human", body: "Sales, partnerships, support - we reply within one business day.", href: "/contact" },
  { icon: LifeBuoy, title: "Status & incidents", body: "Live system status, SLOs, and recent postmortems.", href: "/status" }
];

const faqs = [
  { q: "How fast is the first scan?", a: "Most repositories complete in under 60 seconds. The example multi-tenant SaaS in our demo finishes in 21 seconds." },
  { q: "Do you store our source code?", a: "No. Covenant analyzes code in ephemeral workers and persists only metadata (graph nodes, findings, evidence snippets you opt to save)." },
  { q: "Which languages and frameworks are supported?", a: "TypeScript, JavaScript, Python, Go, and Java today. Ruby and Rust are in beta." },
  { q: "Can I bring my own LLM?", a: "Yes. Anthropic, OpenAI, and AWS Bedrock are supported via the connector layer. Self-hosted endpoints are in beta." },
  { q: "How do you price?", a: "Per active repository per month, plus optional add-ons for compliance evidence and dedicated regions. See the pricing page." },
  { q: "Is there a free tier?", a: "Yes. One repository, unlimited scans, community support. No credit card required." }
];

export default function HelpPage(): JSX.Element {
  const articles = getHelpIndex();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Help center</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold text-ink sm:text-5xl">
              Find what you need, fast.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-graphite/76">
              Guides, FAQs, system status, and a direct line to the team that builds Covenant.
            </p>
          </div>
          <HelpSearch entries={articles} />
        </section>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                key={tile.title}
                href={tile.href}
                className="focus-ring group rounded-panel border border-line bg-white p-6 shadow-crisp transition hover:-translate-y-0.5 hover:border-teal/30"
              >
                <span className="grid size-10 place-items-center rounded-panel bg-mist text-ink group-hover:bg-teal/10 group-hover:text-teal">
                  <Icon size={18} />
                </span>
                <h3 className="mt-4 text-base font-semibold text-ink">{tile.title}</h3>
                <p className="mt-2 text-sm leading-6 text-graphite/76">{tile.body}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink group-hover:text-teal">
                  Open <ArrowRight size={14} />
                </span>
              </Link>
            );
          })}
        </div>

        <Panel className="mt-12">
          <PanelHeader title="All articles" eyebrow="From the help center" />
          <ul className="divide-y divide-line">
            {articles.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/help/${a.slug}`}
                  className="focus-ring flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-mist/40"
                >
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite/65">{a.category}</div>
                    <div className="mt-1 text-sm font-semibold text-ink">{a.title}</div>
                    {a.excerpt && (
                      <div className="text-xs text-graphite/65">{a.excerpt}</div>
                    )}
                  </div>
                  <ArrowRight size={14} className="text-graphite" />
                </Link>
              </li>
            ))}
            {articles.length === 0 && (
              <li className="px-5 py-4 text-sm text-graphite/65">No articles yet.</li>
            )}
          </ul>
        </Panel>

        <Panel className="mt-6">
          <PanelHeader title="Frequently asked" eyebrow="Quick answers" />
          <ul className="divide-y divide-line">
            {faqs.map((faq) => (
              <li key={faq.q} className="px-5 py-5">
                <h3 className="text-base font-semibold text-ink">{faq.q}</h3>
                <p className="mt-2 text-sm leading-6 text-graphite/76">{faq.a}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </main>
      <SiteFooter />
    </>
  );
}
