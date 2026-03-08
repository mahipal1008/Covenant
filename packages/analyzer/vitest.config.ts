import { defineConfig } from "vitest/config";

/**
 * Vitest config for the analyzer — master plan §12.
 *
 * Coverage focus is the agents directory (the rule surface that ships
 * findings to the dashboard). The existing tsx-based tests in
 * src/__tests__ are reused; vitest discovers them through the same
 * include glob.
 */
export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/agents/**/*.ts", "src/analyzer-runner.ts"],
      exclude: ["src/**/*.test.ts", "src/**/__tests__/**"],
      thresholds: {
        statements: 85,
        branches: 60,
        functions: 80,
        lines: 85
      }
    }
  }
});
