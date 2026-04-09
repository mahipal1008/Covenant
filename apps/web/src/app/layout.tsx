import type { Metadata, Viewport } from "next";
import { CookieBanner } from "@/components/cookie-banner";
import { WhiteLabelStyle } from "@/components/white-label-style";
import { Analytics } from "@/components/analytics";
import { ServiceWorkerRegister } from "@/components/sw-register";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://covenant.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Covenant - Living Intelligence for SaaS Codebases",
    template: "%s | Covenant"
  },
  description:
    "Covenant is the living intelligence layer for SaaS codebases. 20 agents detect multi-tenant leaks, intent drift, regulatory risk, and economic blast radius before deploy.",
  applicationName: "Covenant",
  keywords: [
    "multi-tenant security",
    "SaaS security",
    "intent drift",
    "compliance automation",
    "code intelligence",
    "developer platform",
    "GDPR",
    "DPDP",
    "SOC2"
  ],
  authors: [{ name: "Covenant" }],
  creator: "Covenant",
  publisher: "Covenant",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Covenant",
    title: "Covenant - Living Intelligence for SaaS Codebases",
    description:
      "20 always-on agents that document, secure, audit, and enforce your codebase on every commit.",
    locale: "en_US"
  },
  twitter: {
    card: "summary_large_image",
    title: "Covenant - Living Intelligence for SaaS Codebases",
    description:
      "20 always-on agents that document, secure, audit, and enforce your codebase on every commit."
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 }
  },
  category: "technology"
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf6" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d10" }
  ],
  width: "device-width",
  initialScale: 1
};

const themeBootScript = `(()=>{try{var t=localStorage.getItem('covenant-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d){document.documentElement.classList.add('dark');}}catch(e){}})();`;

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Covenant",
  url: SITE_URL,
  logo: `${SITE_URL}/icon`,
  sameAs: ["https://github.com/covenant"]
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Covenant",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <WhiteLabelStyle />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-paper focus:px-3 focus:py-2 focus:text-ink focus:shadow"
        >
          Skip to content
        </a>
        <div id="main">{children}</div>
        <CookieBanner />
        <Analytics />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
