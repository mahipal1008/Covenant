/**
 * Transactional email — Session 5 §4.
 *
 * Picks a provider at runtime: Resend (preferred), Postmark, or a
 * console-logging no-op for offline dev. Single `sendEmail()` API
 * keeps the rest of the codebase provider-agnostic.
 */

interface EmailRequest {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(req: EmailRequest): Promise<{ delivered: boolean; provider: string }> {
  const resendKey = process.env["RESEND_API_KEY"];
  const postmarkKey = process.env["POSTMARK_API_KEY"];
  const from = process.env["MAIL_FROM"] ?? "Covenant <hello@covenant.dev>";

  if (resendKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ from, to: req.to, subject: req.subject, text: req.text, html: req.html })
    });
    return { delivered: res.ok, provider: "resend" };
  }

  if (postmarkKey) {
    const res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "X-Postmark-Server-Token": postmarkKey,
        "content-type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify({ From: from, To: req.to, Subject: req.subject, TextBody: req.text, HtmlBody: req.html })
    });
    return { delivered: res.ok, provider: "postmark" };
  }

  // Pure-code mode: log so the test harness can assert it was called.
  // eslint-disable-next-line no-console
  console.info(`[email/noop] to=${req.to} subject=${req.subject}`);
  return { delivered: true, provider: "noop" };
}
