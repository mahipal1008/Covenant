# @covenant/cli

The Covenant CLI — scan repositories, query findings, and gate PRs
from your terminal. Pairs with [Covenant](https://covenant.dev), the
living-intelligence platform for SaaS codebases.

## Install

```bash
npm i -g @covenant/cli
# or
pnpm add -g @covenant/cli
```

## Usage

```bash
covenant login
covenant scan <repository-id>
covenant findings --scan <scan-id>
covenant version
```

### Environment

| Variable | Default | Notes |
| --- | --- | --- |
| `COVENANT_API_URL` | `http://localhost:4000` | Set to `https://api.covenant.dev` for the hosted service. |
| `COVENANT_ACCESS_TOKEN` | _(none)_ | Bearer token; created via `covenant login`. |

### Exit codes

The CLI follows POSIX conventions:

- `0` — success
- `1` — generic failure
- `2` — invalid usage
- `64` — auth missing or invalid

This makes it safe to compose inside shell scripts and CI pipelines.

## Verifying the published binary

Releases are published from GitHub Actions with npm
[provenance](https://docs.npmjs.com/generating-provenance-statements)
attestations. Verify with:

```bash
npm view @covenant/cli --json | jq .dist.attestations
```

## License

Apache-2.0 — see `LICENSE`.
