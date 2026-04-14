import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/**
 * Tech radar — Session 6 §11.
 *
 * Inspired by Thoughtworks. Four rings (adopt, trial, assess, hold)
 * × four quadrants (languages & frameworks, platforms, tools,
 * techniques). Items move inward over time as confidence grows.
 */

export const metadata = {
  title: "Tech radar | Covenant",
  description:
    "Where Covenant places the technologies it uses across adopt, trial, assess, and hold rings.",
  alternates: { canonical: "/tech-radar" }
};

type Ring = "adopt" | "trial" | "assess" | "hold";
type Quadrant =
  | "languages-and-frameworks"
  | "platforms"
  | "tools"
  | "techniques";

interface RadarItem {
  name: string;
  ring: Ring;
  quadrant: Quadrant;
  note: string;
}

const radar: RadarItem[] = [
  // languages-and-frameworks
  { name: "TypeScript 5", ring: "adopt", quadrant: "languages-and-frameworks", note: "Default for everything we ship." },
  { name: "Next.js 15 (App Router)", ring: "adopt", quadrant: "languages-and-frameworks", note: "Server components first, edge runtime where safe." },
  { name: "Fastify 5", ring: "adopt", quadrant: "languages-and-frameworks", note: "API surface; plugin model maps to our route layout." },
  { name: "Tailwind CSS", ring: "adopt", quadrant: "languages-and-frameworks", note: "Utility-first; design tokens as theme extension." },
  { name: "Prisma 5", ring: "trial", quadrant: "languages-and-frameworks", note: "Tenant-guard extension is the keystone; watch perf on big writes." },
  { name: "tRPC", ring: "hold", quadrant: "languages-and-frameworks", note: "We chose REST + OpenAPI for ecosystem reach." },

  // platforms
  { name: "Postgres 16", ring: "adopt", quadrant: "platforms", note: "RLS + tenant-id columns belt-and-braces." },
  { name: "BullMQ + Redis", ring: "adopt", quadrant: "platforms", note: "DLQ wired in (master plan §4.3)." },
  { name: "Kubernetes (Helm)", ring: "trial", quadrant: "platforms", note: "Multi-region cell architecture in the chart; not yet validated under load." },
  { name: "S3-compatible storage", ring: "trial", quadrant: "platforms", note: "Evidence vault is provider-agnostic; falls back to memory." },
  { name: "Edge runtimes (Vercel/CF)", ring: "trial", quadrant: "platforms", note: "Marketing pages only; data-touching routes stay on Node." },

  // tools
  { name: "Vitest + node:test", ring: "adopt", quadrant: "tools", note: "vitest for shared/analyzer; node:test for the API." },
  { name: "Renovate", ring: "adopt", quadrant: "tools", note: "Drives the dependency cadence." },
  { name: "size-limit (per-route)", ring: "trial", quadrant: "tools", note: "Budget per route; CI gating once green." },
  { name: "Storybook", ring: "assess", quadrant: "tools", note: "Useful for the design system; tsconfig excludes story files for now." },

  // techniques
  { name: "Tenant-guard at the ORM layer", ring: "adopt", quadrant: "techniques", note: "AND-merge org filter on every query." },
  { name: "ADRs in-repo", ring: "adopt", quadrant: "techniques", note: "1+ per sprint; see docs/engineering/adr-cadence.md." },
  { name: "Blameless postmortems", ring: "adopt", quadrant: "techniques", note: "Template in docs/postmortems/_TEMPLATE.md." },
  { name: "Data classification annotations", ring: "trial", quadrant: "techniques", note: "/// @sensitivity:* on every Prisma field; CI lint warns today, will fail next quarter." },
  { name: "N+1 detector (Prisma extension)", ring: "trial", quadrant: "techniques", note: "Dev-only; opt-in via runWithQueryScope." },
  { name: "Right-to-be-forgotten with grace window", ring: "trial", quadrant: "techniques", note: "30-day scheduled deletion + audit trail." },
  { name: "Quarterly DR drills", ring: "trial", quadrant: "techniques", note: "Schedule in docs/runbooks/dr-drill-schedule.md." }
];

const ringOrder: Ring[] = ["adopt", "trial", "assess", "hold"];
const quadrantTitles: Record<Quadrant, string> = {
  "languages-and-frameworks": "Languages & frameworks",
  platforms: "Platforms",
  tools: "Tools",
  techniques: "Techniques"
};

const ringClass: Record<Ring, string> = {
  adopt: "bg-emerald-50 text-emerald-900 border-emerald-200",
  trial: "bg-amber-50 text-amber-900 border-amber-200",
  assess: "bg-sky-50 text-sky-900 border-sky-200",
  hold: "bg-rose-50 text-rose-900 border-rose-200"
};

export default function TechRadarPage(): JSX.Element {
  const quadrants = Object.keys(quadrantTitles) as Quadrant[];
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-ink/50">Engineering</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Tech radar</h1>
          <p className="text-ink/70">
            Where we place the technologies we build with. Items move
            inward as confidence grows. Updated quarterly.
          </p>
        </header>

        <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ringOrder.map((ring) => (
            <div key={ring} className={`rounded border px-3 py-2 text-sm capitalize ${ringClass[ring]}`}>
              <strong className="block">{ring}</strong>
              <span className="text-xs">
                {ring === "adopt" && "Default choice."}
                {ring === "trial" && "Worth pursuing on real work."}
                {ring === "assess" && "Worth a closer look."}
                {ring === "hold" && "Don't introduce."}
              </span>
            </div>
          ))}
        </section>

        <div className="mt-10 space-y-10">
          {quadrants.map((q) => (
            <section key={q}>
              <h2 className="text-xl font-semibold">{quadrantTitles[q]}</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {radar
                  .filter((item) => item.quadrant === q)
                  .sort((a, b) => ringOrder.indexOf(a.ring) - ringOrder.indexOf(b.ring))
                  .map((item) => (
                    <li
                      key={`${q}:${item.name}`}
                      className="rounded border border-line bg-paper p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{item.name}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-xs capitalize ${ringClass[item.ring]}`}>
                          {item.ring}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink/70">{item.note}</p>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
