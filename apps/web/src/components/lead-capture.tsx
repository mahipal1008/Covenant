"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { track } from "@/components/analytics";

/**
 * Lead capture form — Session 5 §4.
 *
 * Submits to `/v1/leads`. Email delivery is wired through Resend or
 * Postmark on the API side (controlled by RESEND_API_KEY /
 * POSTMARK_API_KEY env vars; missing keys fall back to a logged
 * console warning, so the form is verifiable in pure-code mode).
 *
 * Fires the `lead.submit` analytics event documented in
 * `docs/analytics-events.md`.
 */

export interface LeadCaptureProps {
  surface: "home" | "pricing" | "contact";
  className?: string;
  ctaLabel?: string;
}

export function LeadCapture({ surface, className, ctaLabel = "Talk to us" }: LeadCaptureProps): JSX.Element {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "ok" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.includes("@")) return setState("error");
    setState("submitting");
    track("lead.submit", { form: surface });
    try {
      const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const res = await fetch(`${api}/v1/leads`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, message, source: surface })
      });
      setState(res.ok ? "ok" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "ok") {
    return (
      <p role="status" className={className ?? ""}>
        Thanks — we&apos;ll be in touch within one business day.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className={`flex flex-col gap-3 ${className ?? ""}`} aria-label="Lead capture">
      <label className="text-sm">
        Work email
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded border border-line bg-paper px-3 py-2 text-ink"
          aria-invalid={state === "error"}
        />
      </label>
      {surface === "contact" && (
        <label className="text-sm">
          Message
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded border border-line bg-paper px-3 py-2 text-ink"
          />
        </label>
      )}
      <Button type="submit" disabled={state === "submitting"}>
        {state === "submitting" ? "Sending…" : ctaLabel}
      </Button>
      {state === "error" && (
        <p className="text-sm text-ember" role="alert">
          Something went wrong — please email hello@covenant.dev directly.
        </p>
      )}
    </form>
  );
}
