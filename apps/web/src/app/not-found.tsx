import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Not found - Covenant" };

export default function NotFound() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
        <span className="grid size-14 place-items-center rounded-panel border border-line bg-white text-teal">
          <Compass size={22} />
        </span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-teal">404</p>
        <h1 className="mt-3 text-4xl font-bold text-ink sm:text-5xl">This route never made a covenant.</h1>
        <p className="mt-4 max-w-md text-base leading-7 text-graphite/76">
          The page you are looking for was moved or never existed. Try the dashboard, the docs, or
          start a free scan.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="/">
            Back home <ArrowRight size={16} />
          </ButtonLink>
          <Link href="/docs" className="text-sm font-semibold text-graphite hover:text-ink">
            Read the docs
          </Link>
          <Link href="/dashboard" className="text-sm font-semibold text-graphite hover:text-ink">
            Open dashboard
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
