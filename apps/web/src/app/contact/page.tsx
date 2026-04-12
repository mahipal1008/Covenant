"use client";

import { useState } from "react";
import { ArrowRight, Building2, Mail, MessageCircle, Phone } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

const reasons = [
  { value: "sales", label: "Sales (Enterprise / self-hosted)" },
  { value: "support", label: "Customer support" },
  { value: "security", label: "Security disclosure" },
  { value: "press", label: "Press / partnerships" },
  { value: "other", label: "Something else" }
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("sales");
  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError("Please enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Please enter a valid email.");
    if (body.trim().length < 10) return setError("Please write a few words about what you need.");
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Contact</p>
            <h1 className="mt-3 text-4xl font-bold text-ink sm:text-5xl">Talk to us.</h1>
            <p className="mt-4 max-w-md text-base leading-7 text-graphite/76">
              We answer every email within one business day. For urgent security disclosures or
              outages, please flag the priority in the subject.
            </p>
            <div className="mt-8 space-y-3 text-sm text-graphite">
              <div className="flex items-center gap-2"><Mail size={14} className="text-teal" /> hello@covenant.app</div>
              <div className="flex items-center gap-2"><Phone size={14} className="text-teal" /> +91 99999 99999</div>
              <div className="flex items-center gap-2"><Building2 size={14} className="text-teal" /> Bhagalpur, Bihar, India</div>
              <div className="flex items-center gap-2"><MessageCircle size={14} className="text-teal" /> Slack Connect on request</div>
            </div>
          </div>

          <div className="rounded-panel border border-line bg-white p-7 shadow-quiet">
            <h2 className="text-2xl font-bold text-ink">Send a message</h2>
            {submitted ? (
              <div className="mt-6 rounded-panel border border-teal/30 bg-teal/10 p-4 text-sm">
                <p className="font-semibold text-ink">Thanks, {name.split(" ")[0] || "there"}.</p>
                <p className="mt-1 text-graphite/74">We will reply to {email} within one business day.</p>
              </div>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="cname" className="text-xs font-semibold text-graphite">Name</label>
                  <input id="cname" value={name} onChange={(e) => setName(e.target.value)} className="focus-ring mt-1 block h-10 w-full rounded-panel border border-line bg-white px-3 text-sm text-ink" />
                </div>
                <div>
                  <label htmlFor="cemail" className="text-xs font-semibold text-graphite">Work email</label>
                  <input id="cemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="focus-ring mt-1 block h-10 w-full rounded-panel border border-line bg-white px-3 text-sm text-ink" />
                </div>
                <div>
                  <label htmlFor="creason" className="text-xs font-semibold text-graphite">Reason</label>
                  <select id="creason" value={reason} onChange={(e) => setReason(e.target.value)} className="focus-ring mt-1 block h-10 w-full rounded-panel border border-line bg-white px-3 text-sm text-ink">
                    {reasons.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="cbody" className="text-xs font-semibold text-graphite">Message</label>
                  <textarea id="cbody" value={body} onChange={(e) => setBody(e.target.value)} rows={5} className="focus-ring mt-1 block w-full rounded-panel border border-line bg-white px-3 py-2 text-sm text-ink" />
                </div>
                {error ? <p className="text-sm text-ember">{error}</p> : null}
                <Button type="submit" className="w-full">
                  Send message
                  <ArrowRight size={16} />
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
