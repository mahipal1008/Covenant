# Demo Video — Script + Shot List

> Target: 90 seconds. Voiceover by founder. Ships on the homepage,
> Product Hunt, HN, and the press kit. Captions are mandatory.

## Voiceover script (≈ 230 words, 90s @ standard pace)

> [00:00] Every B2B SaaS ships the same bug exactly once.
>
> [00:04] A query like `WHERE userId equals X` without the matching
> `WHERE organizationId equals Y`. The blast radius is enormous, and
> the bug is invisible until a customer sees another customer's
> data.
>
> [00:13] This is Covenant. It plugs into your codebase via a
> GitHub App, scans every pull request for missing tenant guards,
> and gates the merge if it sees one.
>
> [00:24] Here's the demo tenant. We'll add an endpoint that forgets
> the org check. Watch the PR.
>
> [00:33] Within 12 seconds, Covenant comments on the PR. It tells
> you which query is missing the guard, links the file and line,
> and ships a failing curl reproduction you can run locally.
>
> [00:44] Beyond the leak detector, Covenant tracks auth-middleware
> coverage, captures intent contracts, and produces a SOC 2-ready
> audit trail of every change to a sensitive boundary.
>
> [00:58] CLI on npm, SDK on PyPI, extensions for VS Code and
> JetBrains, and a self-hostable Helm chart for regulated customers.
>
> [01:10] Free first scan, no signup. Indie tier is forty-nine
> dollars a month.
>
> [01:18] Try it on a real repo today.
>
> [01:23] covenant.dev.

## Shot list

| # | Time | Shot | Notes |
| --- | --- | --- | --- |
| 1 | 0:00–0:04 | Title card with tagline. | Static; brand colors. |
| 2 | 0:04–0:13 | SQL line `WHERE userId = ?` highlighted; the missing clause flashes in red. | Use the demo tenant repo, not real customer data. |
| 3 | 0:13–0:24 | Cursor tour of the integrations page → GitHub App install → repo connected. | Demo tenant only. Hide any live tokens. |
| 4 | 0:24–0:33 | IDE shot: developer adds the bad endpoint, opens a PR. | Mac dark theme, large font. |
| 5 | 0:33–0:44 | GitHub PR view: Covenant comment renders. Highlight the file link, the failing curl, and the merge gate. | Capture the real PR comment from the demo tenant. |
| 6 | 0:44–0:58 | Three quick cuts: auth-coverage heatmap, intent-contract drift, audit-trail entry. | Each cut ≤ 4s. |
| 7 | 0:58–1:10 | Multi-surface shot: terminal `npm i -g @covenant/cli`, Python `pip install covenant`, VS Code + JetBrains marketplace pages. | Real binaries; show provenance attestation badge if visible. |
| 8 | 1:10–1:18 | Pricing card animation. | $49 / $199 / $499 / $1,499 – consistent with `/pricing`. |
| 9 | 1:18–1:23 | Final card: covenant.dev, brand mark. | Hold for 2s. |

## Production notes

- Capture at 4K, deliver at 1080p H.264 + 1080p WebM/VP9. AV1 is the
  source for the homepage `<video>` tag (Session 6 §8 already
  prefers AV1).
- Captions are baked into the WebVTT track at `apps/web/public/demo/launch.vtt`.
- A 6-second silent loop GIF (`apps/web/public/demo/launch-loop.gif`)
  is generated from frames 0:33–0:39 for use in tweets and the press
  kit.

## Sign-off

- [ ] Founder review.
- [ ] Legal review (no real customer data, no incorrect pricing claim).
- [ ] Design review (brand, captions, alt text).
- [ ] A11y review (caption track, audio description if voiceover is removed).
