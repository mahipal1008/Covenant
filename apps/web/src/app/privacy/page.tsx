import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Privacy - Covenant" };

const sections = [
  { h: "What we collect", b: "Account info (name, work email, hashed password), repository metadata you connect, and analyzer outputs from your code. No more, no less." },
  { h: "What we never do", b: "We do not train shared AI models on customer code. We do not sell or share customer data. We do not retain raw source code beyond the lifetime of an analysis run." },
  { h: "Where data lives", b: "Primary region: AWS us-east-1. EU customers can elect AWS eu-west-1. Enterprise customers can self-host inside their own VPC." },
  { h: "How long we keep things", b: "Findings: retained for the life of the subscription plus 90 days. Audit logs: 7 years (SOC2 control). Source code: not retained beyond analyzer run." },
  { h: "Your rights", b: "Access, export, correct, and delete - within 30 days of request. Email privacy@covenant.app to exercise any right." },
  { h: "Sub-processors", b: "AWS (hosting), Stripe (billing), Postmark (email), OpenAI/Anthropic (AI providers, with zero-retention agreements). Full list at /docs#security." },
  { h: "Contact", b: "Privacy questions: privacy@covenant.app. EU representative on request. Data Protection Officer: dpo@covenant.app." }
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Privacy policy</p>
        <h1 className="mt-3 text-4xl font-bold text-ink">Privacy policy.</h1>
        <p className="mt-3 text-sm text-graphite/65">Last updated April 26, 2026.</p>
        <div className="mt-10 space-y-8">
          {sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-xl font-semibold text-ink">{s.h}</h2>
              <p className="mt-2 text-sm leading-7 text-graphite/76">{s.b}</p>
            </section>
          ))}
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
