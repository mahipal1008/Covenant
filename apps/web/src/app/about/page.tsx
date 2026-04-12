import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Building2, Compass, MapPin, Sparkles, Target } from "lucide-react";

export const metadata = { title: "About - Covenant" };

const milestones = [
  { year: "2025", title: "Pattern recognized", text: "Multi-tenant SaaS audits across the industry exposed every shape of cross-tenant pain." },
  { year: "2026", title: "Covenant founded", text: "Solo from Bhagalpur. Phase 1 dogfooded on a real multi-tenant codebase." },
  { year: "2026", title: "Multi-tenant leak detector ships", text: "Phase 2 closes - first paying B2B SaaS customer." },
  { year: "2026+", title: "Living intelligence layer", text: "Phases 3-5 add intent, economics, and team intelligence." }
];

const values = [
  { icon: Target, title: "Proactive over reactive", text: "Static scanners and human review run after damage. Covenant runs at every commit, before deploy." },
  { icon: Compass, title: "Plain English, not jargon", text: "Founders, auditors, and engineers all read the same risk report - in their own language." },
  { icon: Sparkles, title: "AI does 80%, humans decide", text: "Twenty agents do the heavy parsing. Humans approve, prioritize, and ship." }
];

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">About</p>
        <h1 className="mt-3 text-4xl font-bold text-ink sm:text-6xl">A living intelligence layer for software.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-graphite/76">
          Every existing tool is reactive and static. Covenant is proactive and living. Code changes,
          Covenant updates everything automatically - so the promises your code makes stay enforced.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {values.map((v) => (
            <article key={v.title} className="rounded-panel border border-line bg-white p-6 shadow-crisp">
              <v.icon size={20} className="text-teal" />
              <h3 className="mt-4 text-lg font-semibold text-ink">{v.title}</h3>
              <p className="mt-2 text-sm leading-6 text-graphite/74">{v.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-ink">Timeline.</h2>
          <ol className="mt-8 space-y-5">
            {milestones.map((m) => (
              <li key={m.title} className="grid gap-2 rounded-panel border border-line bg-paper p-5 sm:grid-cols-[120px_1fr] sm:items-baseline">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-teal">{m.year}</span>
                <div>
                  <p className="text-base font-semibold text-ink">{m.title}</p>
                  <p className="mt-1 text-sm leading-6 text-graphite/74">{m.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-panel border border-line bg-white p-8 md:grid-cols-2">
          <div>
            <Building2 size={20} className="text-teal" />
            <h3 className="mt-4 text-2xl font-bold text-ink">Built in Bhagalpur. Shipping to the world.</h3>
            <p className="mt-3 text-sm leading-6 text-graphite/74">
              Covenant is solo-founded by a B.Tech CSE engineer who built the pain. Contrarian
              location, contrarian timeline, real customer.
            </p>
          </div>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-2 text-graphite"><MapPin size={14} className="text-teal" /> Bhagalpur, Bihar, India</div>
            <div className="flex items-center gap-2 text-graphite"><Building2 size={14} className="text-teal" /> Founded 2026</div>
            <div className="flex items-center gap-2 text-graphite"><Sparkles size={14} className="text-teal" /> Solo founder, hiring soon</div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
