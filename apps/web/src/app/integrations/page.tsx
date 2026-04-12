import { ArrowRight, Github, Slack, Webhook } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { ButtonLink } from "@/components/ui/button";

export const metadata = {
  title: "Integrations - Covenant",
  description: "Native integrations with GitHub, Slack, Jira, Linear, PagerDuty, Datadog, and more."
};

type Integration = {
  name: string;
  category: string;
  blurb: string;
  status: "live" | "beta" | "planned";
  icon?: typeof Github;
  // Session 7 §10/§11 — install URLs for the GitHub App and Slack App.
  // Resolved from public env vars at render time so the platform boots
  // without credentials and starts surfacing CTAs once they are set.
  installUrl?: string;
  installLabel?: string;
};

const githubInstallUrl =
  process.env["NEXT_PUBLIC_GITHUB_APP_INSTALL_URL"] ??
  "https://github.com/apps/covenant/installations/new";
const slackClientId = process.env["NEXT_PUBLIC_SLACK_CLIENT_ID"] ?? "";
const slackInstallUrl = slackClientId
  ? `https://slack.com/oauth/v2/authorize?client_id=${encodeURIComponent(slackClientId)}&scope=${encodeURIComponent(
      "chat:write,channels:read,commands,files:write,links:read,links:write,users:read,users:read.email"
    )}`
  : undefined;

const integrations: Integration[] = [
  {
    name: "GitHub",
    category: "Source control",
    blurb: "Webhooks, PR comments, status checks, and SSO mappings.",
    status: "live",
    icon: Github,
    installUrl: githubInstallUrl,
    installLabel: "Install GitHub App"
  },
  {
    name: "Slack",
    category: "Notifications",
    blurb: "Channel-aware digests for security, posture, drift, cost, compliance.",
    status: "live",
    icon: Slack,
    ...(slackInstallUrl ? { installUrl: slackInstallUrl, installLabel: "Add to Slack" } : {})
  },
  { name: "Generic webhook", category: "Custom", blurb: "Subscribe any system to scan events with HMAC-signed payloads.", status: "live", icon: Webhook },
  { name: "Jira", category: "Issue tracking", blurb: "Auto-create tickets for blocking findings with linked evidence.", status: "beta" },
  { name: "Linear", category: "Issue tracking", blurb: "Sync findings to cycles with severity labels and reproductions.", status: "beta" },
  { name: "PagerDuty", category: "Incident response", blurb: "Page on-call when critical tenant boundaries regress.", status: "beta" },
  { name: "Datadog", category: "Observability", blurb: "Stream agent confidence, scan latency, and risk scores as metrics.", status: "planned" },
  { name: "GitLab", category: "Source control", blurb: "Native MR comments and pipeline gating.", status: "planned" },
  { name: "Bitbucket", category: "Source control", blurb: "Webhook parity and PR commenting.", status: "planned" },
  { name: "Microsoft Teams", category: "Notifications", blurb: "Adaptive Cards for security, drift, and cost briefings.", status: "planned" },
  { name: "Okta / Entra ID", category: "Identity", blurb: "SCIM provisioning and SAML SSO.", status: "planned" },
  { name: "Snowflake", category: "Data warehouse", blurb: "Export findings, contracts, and audit trails to your lake.", status: "planned" }
];

const statusTone: Record<Integration["status"], string> = {
  live: "border-teal/30 bg-teal/10 text-teal",
  beta: "border-amber-300/40 bg-amber-100/60 text-amber-700",
  planned: "border-line bg-mist text-graphite"
};

export default function IntegrationsPage() {
  const grouped = integrations.reduce<Record<string, Integration[]>>((acc, item) => {
    acc[item.category] = acc[item.category] ?? [];
    acc[item.category]!.push(item);
    return acc;
  }, {});

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Integrations</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold text-ink sm:text-5xl">
            Plug Covenant into the tools your team already uses.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-graphite/76">
            Native source control, notifications, ticketing, observability, and identity. Plus a generic webhook for everything else.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/docs/api">Read API docs <ArrowRight size={16} /></ButtonLink>
            <ButtonLink href="/contact" variant="secondary">Request an integration</ButtonLink>
          </div>
        </section>

        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items]) => (
            <Panel key={category}>
              <PanelHeader title={category} eyebrow={`${items.length} connectors`} />
              <ul className="grid gap-0 divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                {items.map((item, idx) => {
                  const Icon = item.icon;
                  const showRightDivider = idx % 2 === 0 && idx < items.length - 1;
                  return (
                    <li key={item.name} className={showRightDivider ? "p-5" : "p-5 sm:border-l-0"}>
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-panel border border-line bg-paper text-graphite">
                          {Icon ? <Icon size={18} /> : <span className="text-sm font-bold">{item.name[0]}</span>}
                        </span>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-ink">{item.name}</h3>
                            <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${statusTone[item.status]}`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-graphite/76">{item.blurb}</p>
                          {item.installUrl ? (
                            <div className="mt-3">
                              <ButtonLink href={item.installUrl} variant="secondary">
                                {item.installLabel ?? "Install"} <ArrowRight size={14} />
                              </ButtonLink>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
