import type { Meta, StoryObj } from "@storybook/react";
import { AgentCard } from "./agent-card";

const meta: Meta<typeof AgentCard> = {
  title: "Product/AgentCard",
  component: AgentCard,
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof AgentCard>;

export const Healthy: Story = {
  args: {
    agentId: "A1",
    name: "Architect",
    description: "Validates module boundaries and dependency direction.",
    state: "ok",
    durationMs: 1240,
    findings: { low: 2 }
  }
};

export const Warning: Story = {
  args: {
    agentId: "A7",
    name: "Tenant guard",
    description: "Catches missing org_id predicates in tenant-scoped queries.",
    state: "warn",
    durationMs: 2810,
    findings: { medium: 1, low: 4 }
  }
};

export const Error: Story = {
  args: {
    agentId: "A12",
    name: "Secret leak",
    description: "Scans diffs for credentials and high-entropy strings.",
    state: "error",
    durationMs: 540,
    findings: { critical: 1, high: 3 }
  }
};
