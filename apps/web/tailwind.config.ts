import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#151816",
        graphite: "#343833",
        mist: "#f4f6f1",
        paper: "#fbfbf7",
        line: "#dfe4da",
        ember: "#d74c3f",
        amber: "#c88718",
        teal: "#157f73",
        violet: "#6d5dfc",
        cobalt: "#2459a6"
      },
      boxShadow: {
        quiet: "0 18px 70px rgba(21, 24, 22, 0.10)",
        crisp: "0 1px 0 rgba(21, 24, 22, 0.08)"
      },
      borderRadius: {
        panel: "8px"
      }
    }
  },
  plugins: []
};

export default config;
