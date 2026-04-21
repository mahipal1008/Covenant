import type { StorybookConfig } from "@storybook/nextjs";

/**
 * Storybook config — master plan §19.
 *
 * Stories live next to components as *.stories.tsx. Chromatic is wired
 * via the CHROMATIC_PROJECT_TOKEN env var consumed by the publish-storybook
 * step in CI; locally `npm run storybook` is enough.
 */
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx|mdx)"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
    "@storybook/addon-interactions"
  ],
  framework: { name: "@storybook/nextjs", options: {} },
  staticDirs: ["../public"],
  docs: { autodocs: "tag" },
  typescript: { reactDocgen: "react-docgen-typescript" }
};

export default config;
