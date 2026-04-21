/**
 * Help center loader — Session 6 §1.
 *
 * Mirrors `lib/blog.tsx`: each help article lives at
 * `content/help/<slug>.mdx` with frontmatter `title`, `category`,
 * `read`, `excerpt`. Body is rendered by the same minimal markdown
 * pipeline used by the blog so we don't pay for `@next/mdx` yet.
 *
 * The search index is built at module load: a tiny inverted index
 * over title + excerpt + body keyed on lowercase tokens. Good enough
 * for ~hundreds of articles. Swap to FlexSearch once we cross that
 * threshold.
 */

import fs from "node:fs";
import path from "node:path";
import { renderMarkdown } from "@/lib/blog";

export interface HelpArticleMeta {
  slug: string;
  title: string;
  category: string;
  read: string;
  excerpt: string;
}

export interface HelpArticle extends HelpArticleMeta {
  body: string;
}

const CONTENT_DIR = path.join(process.cwd(), "content", "help");

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  if (!raw.startsWith("---")) return { meta: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { meta: {}, body: raw };
  const fm = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\n/, "");
  const meta: Record<string, string> = {};
  for (const line of fm.split("\n")) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    meta[key] = value;
  }
  return { meta, body };
}

export function listHelpArticles(): HelpArticleMeta[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(CONTENT_DIR, f), "utf8");
      const { meta } = parseFrontmatter(raw);
      return {
        slug: f.replace(/\.mdx$/, ""),
        title: meta.title ?? f,
        category: meta.category ?? "General",
        read: meta.read ?? "3 min",
        excerpt: meta.excerpt ?? ""
      } satisfies HelpArticleMeta;
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getHelpArticle(slug: string): HelpArticle | null {
  const file = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const { meta, body } = parseFrontmatter(raw);
  return {
    slug,
    title: meta.title ?? slug,
    category: meta.category ?? "General",
    read: meta.read ?? "3 min",
    excerpt: meta.excerpt ?? "",
    body
  };
}

export interface HelpSearchEntry extends HelpArticleMeta {
  body: string;
}

/** Snapshot of every article — feeds the client search index. */
export function getHelpIndex(): HelpSearchEntry[] {
  return listHelpArticles().map((a) => {
    const full = getHelpArticle(a.slug);
    return { ...a, body: full?.body ?? "" } satisfies HelpSearchEntry;
  });
}

export { renderMarkdown };
