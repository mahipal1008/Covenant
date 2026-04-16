import { AppShell } from "@/components/product/app-shell";
import { RepositoryOnboardingForm } from "@/components/product/repository-onboarding-form";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { getIntegrations, getRepositories } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function NewRepositoryPage() {
  const [repositories, integrations] = await Promise.all([getRepositories(), getIntegrations()]);

  return (
    <AppShell active="Repositories">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Repository onboarding</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Connect code and run the first tenant scan.</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite/74">
          Covenant starts by mapping routes, data models, and query surfaces before generating an isolation report.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
        <RepositoryOnboardingForm />
        <Panel>
          <PanelHeader title="Integration adapters" eyebrow="Local stubs" />
          <div className="divide-y divide-line">
            {integrations.map((integration) => (
              <div key={integration.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-ink">{integration.name}</h3>
                  <span className="rounded-full border border-line bg-paper px-2 py-0.5 text-xs font-semibold text-graphite">{integration.status}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-graphite/74">{integration.description}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="mt-4">
        <PanelHeader title="Existing repositories" eyebrow="Workspace" />
        <div className="grid gap-3 p-5 md:grid-cols-2">
          {repositories.map((repository) => (
            <div key={repository.id} className="rounded-panel border border-line bg-paper p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-ink">{repository.name}</h3>
                <span className="text-sm font-bold text-ink">{repository.riskScore}</span>
              </div>
              <p className="mt-2 text-sm text-graphite/70">{repository.language} / {repository.defaultBranch}</p>
            </div>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
