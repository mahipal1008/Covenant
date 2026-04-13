import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getPost, listPosts, renderMarkdown } from "@/lib/blog";

interface Params {
  params: { slug: string };
}

export function generateStaticParams() {
  return listPosts().map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: Params) {
  const post = getPost(params.slug);
  if (!post) return { title: "Not found" };
  return {
    title: `${post.title} | Covenant blog`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { title: post.title, description: post.excerpt, type: "article", publishedTime: post.date }
  };
}

export default function BlogPostPage({ params }: Params): JSX.Element {
  const post = getPost(params.slug);
  if (!post) notFound();
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.date,
    author: { "@type": "Person", name: post.author },
    description: post.excerpt
  };
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
        <p className="text-xs">
          <Link href="/blog" className="text-ink/60 underline">← All posts</Link>
        </p>
        <header className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full border px-2 py-0.5 ${post.tone}`}>
              {post.category}
            </span>
            <span className="text-ink/50">{post.date}</span>
            <span className="flex items-center gap-1 text-ink/50">
              <Clock3 className="h-3 w-3" /> {post.readTime}
            </span>
            <span className="text-ink/50">· by {post.author}</span>
          </div>
          <h1 className="text-3xl font-semibold sm:text-4xl">{post.title}</h1>
          <p className="text-lg text-ink/70">{post.excerpt}</p>
        </header>
        <article className="prose mt-10 max-w-none space-y-4 text-ink">
          {renderMarkdown(post.body)}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
