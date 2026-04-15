"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Github, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Please enter a valid email.");
    if (password.length < 1) return setError("Please enter your password.");
    setSuccess(true);
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
            <Link href="/signup" className="hover:text-ink">Need an account? Sign up</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-md items-center justify-center px-4 py-20 sm:px-6">
        <div className="w-full rounded-panel border border-line bg-white p-7 shadow-quiet">
          <h1 className="text-2xl font-bold text-ink">Welcome back.</h1>
          <p className="mt-1 text-sm text-graphite/74">Sign in to continue to Covenant.</p>

          {success ? (
            <div className="mt-6 rounded-panel border border-teal/30 bg-teal/10 p-4 text-sm text-ink">
              <p className="font-semibold">Signed in.</p>
              <Link href="/dashboard" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-teal hover:underline">
                Continue to dashboard <ArrowRight size={14} />
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
                <label htmlFor="email" className="text-xs font-semibold text-graphite">Email</label>
                <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="focus-ring mt-1 block h-10 w-full rounded-panel border border-line bg-white px-3 text-sm text-ink" placeholder="you@company.com" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-semibold text-graphite">Password</label>
                  <Link href="/login" className="text-xs text-teal hover:underline">Forgot?</Link>
                </div>
                <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="focus-ring mt-1 block h-10 w-full rounded-panel border border-line bg-white px-3 text-sm text-ink" placeholder="Your password" />
              </div>
              {error ? <p className="text-sm text-ember">{error}</p> : null}
              <Button type="submit" className="w-full">
                Sign in
                <ArrowRight size={16} />
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
