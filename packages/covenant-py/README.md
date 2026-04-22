# covenant — Python SDK

Programmatic access to [Covenant](https://covenant.dev): scans,
findings, intent contracts, and audit trails.

## Install

```bash
pip install covenant
```

## Usage

```python
from covenant import Covenant

with Covenant(api_url="https://api.covenant.dev", token="…") as cv:
    scan = cv.scans.create(repository_id="repo_123")
    findings = cv.findings.list(scan_id=scan["id"], severity="critical")
    for f in findings["items"]:
        print(f["title"], f["severity"])
```

Async:

```python
import asyncio
from covenant import AsyncCovenant

async def main() -> None:
    async with AsyncCovenant(token="…") as cv:
        print(await cv.scans.list())

asyncio.run(main())
```

## Configuration

The SDK reads two environment variables when arguments are omitted:

- `COVENANT_API_URL` — defaults to `https://api.covenant.dev`.
- `COVENANT_ACCESS_TOKEN` — bearer token.

## Errors

Every non-2xx response raises `covenant.CovenantAPIError`. The
`status_code` and `body` attributes are populated for granular
handling.

## License

Apache-2.0.
