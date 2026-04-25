# Launch GIFs — Shot List

> 6 GIFs total. Each ≤ 4 seconds, ≤ 2.5 MB, looped. Used in tweets,
> the press kit, the launch blog post, and the homepage.

| # | Slug | Subject | Duration | Notes |
| --- | --- | --- | --- | --- |
| 1 | `leak-caught` | Cursor adds the bad endpoint → PR comment with red merge gate. | 4s | Hero GIF; the one that lands on Twitter and Product Hunt. |
| 2 | `auth-heatmap` | Auth-coverage heatmap rendering, hover on an unprotected endpoint. | 3s | Used on `/platform`. |
| 3 | `intent-drift` | Intent-contract drift narration appearing inline. | 3s | Used on `/platform` and the blog launch post. |
| 4 | `cli-scan` | Terminal: `covenant scan`, JSON output collapsing into a table. | 3s | Used in the developer-tools tweet. |
| 5 | `vscode-diag` | VS Code diagnostic squiggle on the `WHERE userId = ?` line, hover popover. | 4s | Used in the editor extensions tweet. |
| 6 | `evidence-export` | One-click "Generate SOC 2 evidence" → ZIP downloads. | 3s | Used in the compliance tweet. |

## Capture standards

- Recording at 1440p, exported as 1080p GIF + 1080p WebM (preferred).
- Frame rate 24 fps for GIF, 30 fps for WebM.
- No real customer data; demo tenant only.
- Mouse cursor visible; no system tray, no clock.
- Browser theme matches Covenant brand (light theme on the marketing pages, dark theme in the IDE).

## Output paths

- `apps/web/public/demo/<slug>.gif` — used by `<img>` for fallback.
- `apps/web/public/demo/<slug>.webm` — primary, used by `<video autoplay loop muted playsinline>`.
- `apps/web/public/demo/<slug>-poster.jpg` — poster for `<video>` to keep CLS low.
