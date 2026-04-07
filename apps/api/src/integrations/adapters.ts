import type { Integration } from "@covenant/shared";

export type IntegrationAdapter = {
  id: string;
  name: string;
  mode: "stub" | "live";
  describe(): Integration;
};

export function createStubAdapter(id: string, name: string, description: string): IntegrationAdapter {
  return {
    id,
    name,
    mode: "stub",
    describe() {
      return {
        id,
        name,
        description,
        status: "stubbed",
        lastSync: "Local adapter ready"
      };
    }
  };
}

export const integrationAdapters = [
  createStubAdapter("github", "GitHub", "Repository import, webhooks, PR comments, and merge gates."),
  createStubAdapter("stripe", "Stripe", "Subscription billing and revenue blast radius mapping."),
  createStubAdapter("slack", "Slack", "Security alerts, release digests, and weekly summaries."),
  createStubAdapter("ai", "AI Provider", "Narration, remediation hints, and intent drift explanations.")
];
