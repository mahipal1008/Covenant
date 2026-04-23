# Covenant for VS Code

Surface Covenant findings, intent contracts, and tenant-isolation gaps
inline as you code.

## Features

- Findings shown as native VS Code diagnostics (squiggles + Problems
  panel), filtered by configurable severity.
- Status-bar summary (critical / high counts) with one-click refresh.
- Token sign-in flow that stores credentials in VS Code's global
  configuration.

## Configuration

| Setting | Default |
| --- | --- |
| `covenant.apiUrl` | `https://api.covenant.dev` |
| `covenant.accessToken` | _(empty — use Sign in command)_ |
| `covenant.severityFilter` | `["critical","high"]` |

## Commands

- `Covenant: Sign in`
- `Covenant: Refresh findings`
- `Covenant: Open finding in browser`

## License

Apache-2.0.
