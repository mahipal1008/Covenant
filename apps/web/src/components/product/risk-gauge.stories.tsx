import type { Meta, StoryObj } from "@storybook/react";
import { RiskGauge } from "./risk-gauge";

const meta: Meta<typeof RiskGauge> = {
  title: "Product/RiskGauge",
  component: RiskGauge,
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof RiskGauge>;

export const Low: Story = { args: { score: 18 } };
export const Medium: Story = { args: { score: 54 } };
export const High: Story = { args: { score: 87 } };
