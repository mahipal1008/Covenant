/**
 * Blog post registry — Session 5 §6.
 *
 * We treat MDX as data: each post is an `.mdx` file living at
 * content/blog/<slug>.mdx with a frontmatter block parsed by a tiny
 * inline parser. We avoid `@next/mdx` here so the build stays vanilla
 * Next 15 — content is rendered as a React component below by
 * delegating to a small markdown-to-JSX path. For richer content
 * (custom components, embeds) wire `@next/mdx` later.
 */

import fs from "node:fs";
import path from "node:path";

export interface BlogPostMeta {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  author: string;
  tone?: string;
}

export interface BlogPost extends BlogPostMeta {
  body: string;
}

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

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

export function listPosts(): BlogPostMeta[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));
  const posts = files.map((f) => {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, f), "utf8");
    const { meta } = parseFrontmatter(raw);
    return {
      slug: f.replace(/\.mdx$/, ""),
      title: meta.title ?? f,
      excerpt: meta.excerpt ?? "",
      date: meta.date ?? "1970-01-01",
      readTime: meta.readTime ?? "5 min",
      category: meta.category ?? "Engineering",
      author: meta.author ?? "Covenant team",
      tone: meta.tone ?? "border-line bg-paper text-ink"
    } satisfies BlogPostMeta;
  });
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug: string): BlogPost | null {
  const file = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const { meta, body } = parseFrontmatter(raw);
  return {
    slug,
    title: meta.title ?? slug,
    excerpt: meta.excerpt ?? "",
    date: meta.date ?? "1970-01-01",
    readTime: meta.readTime ?? "5 min",
    category: meta.category ?? "Engineering",
    author: meta.author ?? "Covenant team",
    tone: meta.tone ?? "border-line bg-paper text-ink",
    body
  };
}

/**
 * Tiny markdown→JSX renderer that handles the subset our seed posts
 * use: `#`, `##`, `###` headings, paragraphs, fenced code blocks,
 * unordered lists, and inline `**bold**`. Good enough for the
 * Session 5 milestone; swap to `@next/mdx` when richer content is
 * needed.
 */
export function renderMarkdown(body: string): React.ReactNode[] {
  const lines = body.split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  function inline(text: string): React.ReactNode {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((p, idx) => {
      if (p.startsWith("**") && p.endsWith("**")) {
        return <strong key={idx}>{p.slice(2, -2)}</strong>;
      }
      if (p.startsWith("`") && p.endsWith("`")) {
        return (
          <code key={idx} className="rounded bg-ink/10 px-1 py-0.5 text-[0.95em]">
            {p.slice(1, -1)}
          </code>
        );
      }
      return <span key={idx}>{p}</span>;
    });
  }
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (line.startsWith("### ")) {
      out.push(<h3 key={key++} className="mt-6 text-lg font-semibold">{inline(line.slice(4))}</h3>);
      i++;
    } else if (line.startsWith("## ")) {
      out.push(<h2 key={key++} className="mt-8 text-xl font-semibold">{inline(line.slice(3))}</h2>);
      i++;
    } else if (line.startsWith("# ")) {
      out.push(<h1 key={key++} className="mt-8 text-2xl font-semibold">{inline(line.slice(2))}</h1>);
      i++;
    } else if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !(lines[i] ?? "").startsWith("```")) {
        buf.push(lines[i] ?? "");
        i++;
      }
      i++;
      out.push(
        <pre key={key++} className="overflow-x-auto rounded bg-ink/5 p-3 text-sm">
          <code data-lang={lang}>{buf.join("\n")}</code>
        </pre>
      );
    } else if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i] ?? "").startsWith("- ")) {
        items.push((lines[i] ?? "").slice(2));
        i++;
      }
      out.push(
        <ul key={key++} className="list-disc space-y-1 pl-6">
          {items.map((it, idx) => (
            <li key={idx}>{inline(it)}</li>
          ))}
        </ul>
      );
    } else if (line.trim() === "") {
      i++;
    } else {
      const buf: string[] = [];
      while (i < lines.length && (lines[i] ?? "").trim() !== "" && !(lines[i] ?? "").match(/^(#|-|```)/)) {
        buf.push(lines[i] ?? "");
        i++;
      }
      out.push(
        <p key={key++} className="leading-relaxed">
          {inline(buf.join(" "))}
        </p>
      );
    }
  }
  return out;
}
