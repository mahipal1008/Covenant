import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Panel } from "@/components/ui/panel";
import { listPosts } from "@/lib/blog";

export const metadata = {
  title: "Blog - Covenant",
  description: "Engineering deep dives, security research, and product updates from the Covenant team.",
  alternates: { canonical: "/blog", types: { "application/rss+xml": "/feed.xml" } }
};

export default function BlogIndexPage(): JSX.Element {
  const posts = listPosts();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-ink/60">Covenant blog</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            Field notes from the agent fleet.
          </h1>
          <p className="text-ink/70">
            Engineering deep dives, security research, and product updates.{" "}
            <Link href="/feed.xml" className="underline">RSS</Link>.
          </p>
        </header>
        <div className="mt-10 grid gap-4">
          {posts.map((post) => (
            <Panel key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="block space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className={`rounded-full border px-2 py-0.5 ${post.tone}`}>
                    {post.category}
                  </span>
                  <span className="text-ink/50">{post.date}</span>
                  <span className="flex items-center gap-1 text-ink/50">
                    <Clock3 className="h-3 w-3" /> {post.readTime}
                  </span>
                </div>
                <h2 className="text-xl font-semibold">{post.title}</h2>
                <p className="text-sm text-ink/70">{post.excerpt}</p>
                <p className="inline-flex items-center gap-1 text-sm text-cobalt">
                  Read post <ArrowRight className="h-3 w-3" />
                </p>
              </Link>
            </Panel>
          ))}
          {posts.length === 0 && (
            <p className="text-ink/60">No posts yet — check back soon.</p>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
