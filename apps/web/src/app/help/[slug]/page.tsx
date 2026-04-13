import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-static";

type Article = {
  slug: string;
  title: string;
  category: string;
  read: string;
  body: { heading: string; paragraphs: string[]; bullets?: string[] }[];
};

const articles: Article[] = [
  {
    slug: "connect-repository",
    title: "Connect your first repository",
    category: "Getting started",
    read: "3 min read",
    body: [
      {
        heading: "Three ways to connect",
        paragraphs: [
          "You can wire Covenant to your code in three ways: the GitHub demo provider, a public clone URL, or the official GitHub App for production workspaces."
        ],
        bullets: [
          "Demo provider — instant, uses our seeded sample repository",
          "Public clone URL — fastest path to scanning your own code",
          "GitHub App — required for private repos, PR checks, and webhooks"
        ]
      },
      {
        heading: "What happens after connect",
        paragraphs: [
          "Covenant indexes file structure, dependencies, and intent within thirty seconds. The semantic graph populates and the first multi-tenant scan is queued automatically."
        ]
      }
    ]
  },
  {
    slug: "read-scan-report",
    title: "Reading a scan report",
    category: "Findings",
    read: "4 min read",
    body: [
      {
        heading: "Three sections per finding",
        paragraphs: [
          "Each finding has three sections: where it is, why it matters, and how to fix it. The first two come from the agent council; the third is a deterministic patch suggestion you can copy into your IDE."
        ]
      },
      {
        heading: "Severity is opinionated",
        paragraphs: [
          "Severity is calculated from blast radius (which tenants can be affected), exploitability (is auth required), and reversibility (is data leaked or only read). We never inflate severity."
        ]
      }
    ]
  },
  {
    slug: "write-intent-contract",
    title: "Author your first intent contract",
    category: "Contracts",
    read: "5 min read",
    body: [
      {
        heading: "What is an intent contract",
        paragraphs: [
          "An intent contract is a machine-readable invariant you pin to the codebase — a promise Covenant will block PRs from violating. Common examples: tenant isolation, billing immutability, audit completeness."
        ]
      },
      {
        heading: "Three rules of good contracts",
        paragraphs: [
          "Good contracts are testable, scoped to a single concern, and accompanied by a remediation hint. We auto-generate a starting set; you should edit them, not delete them."
        ]
      }
    ]
  },
  {
    slug: "manage-seats",
    title: "Manage seats and roles",
    category: "Account",
    read: "2 min read",
    body: [
      {
        heading: "Roles map to permissions",
        paragraphs: [
          "Owner can do anything, Admin can manage members and integrations, Engineer can run scans and write contracts, Viewer is read-only. Roles are checked on every API call."
        ]
      }
    ]
  },
  {
    slug: "configure-webhooks",
    title: "Configure outbound webhooks",
    category: "Integrations",
    read: "4 min read",
    body: [
      {
        heading: "Signed deliveries",
        paragraphs: [
          "Every webhook delivery is signed with HMAC-SHA256 using the secret returned at creation. Verify the signature in your handler before trusting the body."
        ]
      },
      {
        heading: "Retries",
        paragraphs: [
          "We retry failed deliveries with exponential backoff up to 24 hours. After that, the delivery is marked failed and shown in the deliveries log on /settings/webhooks."
        ]
      }
    ]
  },
  {
    slug: "manage-billing",
    title: "Manage billing and trials",
    category: "Billing",
    read: "3 min read",
    body: [
      {
        heading: "Trial and conversion",
        paragraphs: [
          "Every workspace gets a 14-day Scale trial. We email three reminders before conversion. You can downgrade to Startup at any time without losing data."
        ]
      }
    ]
  },
  {
    slug: "request-soc2-report",
    title: "Request SOC 2 + audit reports",
    category: "Compliance",
    read: "2 min read",
    body: [
      {
        heading: "Under NDA",
        paragraphs: [
          "Email trust@covenant.dev with your company name and your auditor's NDA template. We typically counter-sign within two business days."
        ]
      }
    ]
  },
  {
    slug: "troubleshoot-stuck-scan",
    title: "Troubleshoot a stuck scan",
    category: "Reliability",
    read: "3 min read",
    body: [
      {
        heading: "First check: status page",
        paragraphs: [
          "Open /status — if the scan-worker indicator is degraded, our on-call has paged. If the platform is healthy, retry the scan from the repository detail page."
        ]
      },
      {
        heading: "Second check: webhook deliveries",
        paragraphs: [
          "If the scan completed but no notification arrived, check /settings/webhooks for failed deliveries. Re-deliver from the row’s action menu."
        ]
      }
    ]
  }
];

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) return { title: "Help — Article not found" };
  return { title: `${article.title} | Help` };
}

export default async function HelpArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) return notFound();

  return (
    <main className="bg-paper text-ink">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 py-14">
        <Link
          href="/help"
          className="focus-ring inline-flex items-center gap-1.5 text-sm font-semibold text-graphite hover:text-ink"
        >
          <ArrowLeft size={14} /> Back to help center
        </Link>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-teal">{article.category}</p>
        <h1 className="mt-2 text-4xl font-bold leading-tight text-ink">{article.title}</h1>
        <p className="mt-2 text-sm text-graphite/65">{article.read}</p>
        <div className="mt-8 space-y-8 text-sm leading-7 text-graphite/85">
          {article.body.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-bold text-ink">{section.heading}</h2>
              {section.paragraphs.map((p, i) => (
                <p key={i} className="mt-2">
                  {p}
                </p>
              ))}
              {section.bullets ? (
                <ul className="mt-3 list-disc space-y-1 pl-6">
                  {section.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
