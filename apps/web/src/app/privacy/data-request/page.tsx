import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Data subject request | Covenant",
  description:
    "Request export or deletion of your personal data. We honour requests within 30 days and document every action in an immutable audit trail.",
  alternates: { canonical: "/privacy/data-request" }
};

export default function DataRequestPage(): JSX.Element {
  // Resolve the API endpoint at SSR. If NEXT_PUBLIC_API_URL is set we
  // post directly to the API origin; otherwise we assume same-origin
  // routing where the API is mounted under /v1 (the API plugin prefix).
  // The previous default `/api/v1/...` was broken — the API does not
  // serve under an /api segment.
  const apiBase = process.env["NEXT_PUBLIC_API_URL"]?.replace(/\/$/, "") ?? "";
  const action = `${apiBase}/v1/privacy/data-requests`;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-ink/50">Privacy</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Data subject request</h1>
          <p className="text-ink/70">
            Submit an access, export, or deletion request. We will acknowledge
            within one business day and complete the request within 30 days,
            per GDPR Article 12 and CCPA §1798.130.
          </p>
        </header>
        <form
          className="mt-10 space-y-5 rounded border border-line bg-paper p-6"
          action={action}
          method="post"
        >
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="subjectEmail">
              Subject email
            </label>
            <input
              id="subjectEmail"
              name="subjectEmail"
              type="email"
              required
              className="w-full rounded border border-line bg-white px-3 py-2 text-sm"
              placeholder="you@example.com"
            />
            <p className="text-xs text-ink/60">
              The email tied to the account whose data should be processed.
            </p>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Request type</legend>
            <label className="flex items-start gap-2 text-sm">
              <input type="radio" name="type" value="export" defaultChecked /> 
              <span>
                <strong>Export</strong> — receive a copy of all data we hold
                about you (machine-readable JSON).
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input type="radio" name="type" value="deletion" />
              <span>
                <strong>Deletion</strong> — permanently delete your account
                and personal data. There is a 30-day grace window during
                which you can cancel.
              </span>
            </label>
          </fieldset>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="reason">
              Reason (optional)
            </label>
            <textarea
              id="reason"
              name="reason"
              rows={4}
              className="w-full rounded border border-line bg-white px-3 py-2 text-sm"
              placeholder="Anything we should know? (optional)"
              maxLength={2000}
            />
          </div>
          <button
            type="submit"
            className="rounded bg-ink px-4 py-2 text-sm font-semibold text-white"
          >
            Submit request
          </button>
        </form>
        <section className="mt-10 space-y-3 text-sm text-ink/70">
          <h2 className="text-base font-semibold text-ink">What happens next</h2>
          <ol className="list-decimal space-y-1 pl-5">
            <li>You receive an acknowledgement email with your request id.</li>
            <li>
              Export requests run immediately; deletion requests are scheduled
              30 days out so you can cancel from your account settings.
            </li>
            <li>
              Every step is recorded in an audit trail attached to the request
              and exported on completion.
            </li>
            <li>
              If we deny the request (e.g. because we have a legal obligation
              to retain), you receive a written explanation and your right to
              appeal to your supervisory authority.
            </li>
          </ol>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
