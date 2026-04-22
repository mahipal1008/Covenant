"""Covenant Python SDK — Session 7 §4.

Thin, fully-typed wrapper around the Covenant REST API. Sync and async
clients share a transport (httpx) so users can pick whichever fits
their codebase.

Example:

    from covenant import Covenant

    cv = Covenant(api_url="https://api.covenant.dev", token="…")
    scan = cv.scans.create(repository_id="repo_123")
    findings = cv.findings.list(scan_id=scan["id"], severity="critical")

The SDK never silently swallows errors: every non-2xx response raises
:class:`CovenantAPIError` with the response body attached.
"""

from __future__ import annotations

from .client import AsyncCovenant, Covenant, CovenantAPIError

__all__ = ["AsyncCovenant", "Covenant", "CovenantAPIError"]
__version__ = "0.1.0"
