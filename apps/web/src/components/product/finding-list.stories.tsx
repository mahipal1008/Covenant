import type { Meta, StoryObj } from "@storybook/react";
import type { Finding } from "@covenant/shared";
import { FindingList } from "./finding-list";

const meta: Meta<typeof FindingList> = {
  title: "Product/FindingList",
  component: FindingList,
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof FindingList>;

const findings: Finding[] = [
  {
    id: "f_1",
    scanId: "scan_1",
    ruleId: "TENANT-LEAK-001",
    severity: "critical",
    title: "Missing organizationId predicate on bookings",
    summary: "Query `findMany({ where: { createdAt } })` runs across every tenant.",
    filePath: "apps/api/src/routes/bookings.ts",
    line: 84,
    routeMethod: "GET",
    endpoint: "/v1/bookings/recent",
    confidence: 0.97
  } as Finding,
  {
    id: "f_2",
    scanId: "scan_1",
    ruleId: "SECRET-LEAK-014",
    severity: "high",
    title: "Stripe key embedded in `vercel.json`",
    summary: "Live secret key checked into source control.",
    filePath: "apps/web/vercel.json",
    line: 12,
    routeMethod: "—",
    endpoint: "—",
    confidence: 0.99
  } as Finding
];

export const Default: Story = {
  args: { findings, scanId: "scan_1" }
};

export const Empty: Story = {
  args: { findings: [], scanId: "scan_1" }
};
