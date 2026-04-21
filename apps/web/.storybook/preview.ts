import type { Preview } from "@storybook/react";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#0b0b10" },
        { name: "light", value: "#ffffff" }
      ]
    },
    a11y: { config: { rules: [{ id: "color-contrast", enabled: true }] } }
  }
};

export default preview;
