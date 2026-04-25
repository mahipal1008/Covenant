# Video walkthrough scripts

Each script is short on purpose — three to five minutes. Long
walkthroughs don't get watched. Embed locations are listed per
script; record at 1080p with the standard Covenant captions theme.

## 1. "Connect your first repository"

- **Length:** ~3 minutes
- **Embed on:** /onboarding, /help/connect-repository
- **Outline:**
  1. Cold open on an empty Covenant dashboard.
  2. Click **Connect repository** → choose GitHub.
  3. Show the OAuth consent screen and the explicit scopes.
  4. Pick one repo; show the deferred webhook setup banner.
  5. Wait one second; the first scan shows up. Click into it.
  6. Recap: "Two clicks, one repo, every commit covered."

## 2. "Reading a scan report"

- **Length:** ~4 minutes
- **Embed on:** /help/read-scan-report, /help (homepage card)
- **Outline:**
  1. Open a finished scan.
  2. Walk through the Summary tab: agents that ran, severity counts,
     intent contracts evaluated.
  3. Click into a critical finding; explain location + remediation.
  4. Show "open as PR" / suppress with a written justification.
  5. Recap: "Severity is a starting point, not a verdict."

## 3. "Writing your first intent contract"

- **Length:** ~5 minutes
- **Embed on:** /help/write-intent-contract, /agents/contracts
- **Outline:**
  1. Explain *intent contract* in one sentence.
  2. Open the contracts page; click **New contract**.
  3. Walk through the YAML editor with linting.
  4. Save; show the next scan picking it up.
  5. Trigger a synthetic violation in the demo repo.
  6. Recap: "Codifying intent is how you stop drift."

## 4. "Configuring webhooks"

- **Length:** ~3 minutes
- **Embed on:** /help/configure-webhooks
- **Outline:**
  1. Why webhooks matter (real-time notifications + DLQ).
  2. Add a webhook; copy the signing secret out.
  3. Test the delivery; show retries and the DLQ.
  4. Slack / Teams / generic JSON variants.

## 5. "Managing billing & seats"

- **Length:** ~3 minutes
- **Embed on:** /help/manage-billing, /settings/billing
- **Outline:**
  1. Plans recap.
  2. Upgrade flow with proration preview.
  3. Seat management.
  4. Self-serve invoice download + PO email.

## Recording checklist

- [ ] Use the "demo" tenant; the data is intentionally curated.
- [ ] Hide notifications and personal info.
- [ ] Captions on (built-in or Loom auto-generated).
- [ ] Export 1080p MP4 + grab a poster frame at 00:00:02.
- [ ] Drop the iframe URL into the help article frontmatter as
      `videoSrc`.

## Where they live

We host walkthroughs on Loom by default (private space, public-link
sharing). Posters go to `apps/web/public/walkthroughs/<slug>.webp`.
The `<VideoWalkthrough>` component (apps/web/src/components/video-walkthrough.tsx)
lazy-loads the iframe so we don't pay LCP cost for unwatched videos.
