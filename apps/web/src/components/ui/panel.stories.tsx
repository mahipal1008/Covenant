import type { Meta, StoryObj } from "@storybook/react";
import { Panel, PanelHeader } from "./panel";

const meta: Meta<typeof Panel> = {
  title: "UI/Panel",
  component: Panel,
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Panel>;

export const Plain: Story = {
  args: {
    children: <div className="p-5 text-sm">A panel is the standard surface for product content.</div>
  }
};

export const WithHeader: Story = {
  render: () => (
    <Panel>
      <PanelHeader eyebrow="Tenant guard" title="Findings overview" />
      <div className="p-5 text-sm text-ink/70">
        12 high-severity findings across 3 repositories.
      </div>
    </Panel>
  )
};
