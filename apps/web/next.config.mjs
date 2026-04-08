import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@covenant/shared"],
  typedRoutes: false,
  // Session 6 §8 — prefer modern formats; next/image will negotiate
  // by Accept header so older clients still get JPEG/PNG.
  images: {
    formats: ["image/avif", "image/webp"]
  },
  turbopack: {
    root: path.resolve(__dirname, "../..")
  }
};

export default nextConfig;
