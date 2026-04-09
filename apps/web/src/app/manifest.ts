import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Covenant",
    short_name: "Covenant",
    description: "Living intelligence layer for SaaS codebases.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfaf6",
    theme_color: "#0b6e6e",
    icons: [{ src: "/icon", sizes: "32x32", type: "image/png" }]
  };
}
