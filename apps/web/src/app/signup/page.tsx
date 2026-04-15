"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Github, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SignupPage() {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError("Please enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Please enter a valid email.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-panel bg-ink text-white">
              <LockKeyhole size={19} />
            </span>
            <span className="text-lg font-bold text-ink">Covenant</span>
          </Link>
          <div className="flex items-center gap-2 text-sm font-semibold text-graphite/76">
            <ThemeToggle />
            <Link href="/login" className="hover:text-ink">Already have an account? Sign in</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Free 14-day trial</p>
          <h1 className="mt-3 text-4xl font-bold text-ink sm:text-5xl">Start enforcing your covenants.</h1>
          <p className="mt-4 max-w-md text-base leading-7 text-graphite/76">
            Connect a repository, run your first scan in under 3 minutes, and see the multi-tenant
            leaks your code is hiding.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-graphite">
            {[
              "First scan free, no card required",
              "Every plan includes the leak detector",
              "Cancel any time, export your data"
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-teal" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="mt-10 rounded-panel border border-line bg-white p-5">
            <ShieldCheck size={20} className="text-teal" />
            <p className="mt-3 text-sm font-semibold text-ink">SOC2-aligned by default</p>
            <p className="mt-1 text-sm text-graphite/74">
              Source code never trains shared models. Tenant scopes enforced at the API boundary.
            </p>
          </div>
        </section>

        <section>
          <div className="rounded-panel border border-line bg-white p-6 shadow-quiet">
            <h2 className="text-2xl font-bold text-ink">Create your account</h2>
            <p className="mt-1 text-sm text-graphite/74">No card required. Sign up in 30 seconds.</p>

            {submitted ? (
              <div className="mt-6 rounded-panel border border-teal/30 bg-teal/10 p-4 text-sm text-ink">
                <p className="font-semibold">Welcome to Covenant.</p>
                <p className="mt-1 text-graphite/74">
                  We sent a verification link to <strong>{email}</strong>. In demo mode you can jump
                  straight to the dashboard.
                </p>
                <Link href="/dashboard" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal hover:underline">
                  Open dashboard <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button type="button" className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-panel border border-line bg-white text-sm font-semibold text-ink hover:border-graphite/35">
                    <Github size={16} /> GitHub
                  </button>
                  <button type="button" className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-panel border border-line bg-white text-sm font-semibold text-ink hover:border-graphite/35">
                    <Mail size={16} /> Google
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs text-graphite/55">
                  <span className="h-px flex-1 bg-line" />
                  or with email
                  <span className="h-px flex-1 bg-line" />
                </div>
                <div>
                  <label htmlFor="name" className="text-xs font-semibold text-graphite">Full name</label>
                  <input id="name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="focus-ring mt-1 block h-10 w-full rounded-panel border border-line bg-white px-3 text-sm text-ink" placeholder="Mahi Patel" />
                </div>
                <div>
                  <label htmlFor="email" className="text-xs font-semibold text-graphite">Work email</label>
                  <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="focus-ring mt-1 block h-10 w-full rounded-panel border border-line bg-white px-3 text-sm text-ink" placeholder="you@company.com" />
                </div>
                <div>
                  <label htmlFor="password" className="text-xs font-semibold text-graphite">Password</label>
                  <input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="focus-ring mt-1 block h-10 w-full rounded-panel border border-line bg-white px-3 text-sm text-ink" placeholder="At least 8 characters" />
                </div>
                {error ? <p className="text-sm text-ember">{error}</p> : null}
                <Button type="submit" className="w-full">
                  Create account
                  <ArrowRight size={16} />
                </Button>
                <p className="text-xs text-graphite/65">
                  By creating an account you agree to our <Link href="/terms" className="underline hover:text-ink">Terms</Link> and <Link href="/privacy" className="underline hover:text-ink">Privacy</Link>.
                </p>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
