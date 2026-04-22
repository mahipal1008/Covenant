"""Sync + async Covenant API clients."""

from __future__ import annotations

import os
from typing import Any, Mapping

import httpx

DEFAULT_API_URL = "https://api.covenant.dev"
DEFAULT_TIMEOUT = 30.0
USER_AGENT = "covenant-python/0.1.0"


class CovenantAPIError(RuntimeError):
    """Raised when the API returns a non-2xx response."""

    def __init__(self, status_code: int, body: str) -> None:
        super().__init__(f"Covenant API {status_code}: {body[:500]}")
        self.status_code = status_code
        self.body = body


def _resolve_token(token: str | None) -> str | None:
    return token or os.environ.get("COVENANT_ACCESS_TOKEN")


def _resolve_api_url(api_url: str | None) -> str:
    return api_url or os.environ.get("COVENANT_API_URL") or DEFAULT_API_URL


def _headers(token: str | None) -> dict[str, str]:
    headers: dict[str, str] = {
        "user-agent": USER_AGENT,
        "accept": "application/json",
        "content-type": "application/json",
    }
    if token:
        headers["authorization"] = f"Bearer {token}"
    return headers


def _check(response: httpx.Response) -> dict[str, Any]:
    if response.status_code >= 400:
        raise CovenantAPIError(response.status_code, response.text)
    if not response.content:
        return {}
    return response.json()


class _ScansResource:
    def __init__(self, parent: "Covenant") -> None:
        self._parent = parent

    def create(self, repository_id: str) -> dict[str, Any]:
        return self._parent._request("POST", "/v1/scans", json={"repositoryId": repository_id})

    def get(self, scan_id: str) -> dict[str, Any]:
        return self._parent._request("GET", f"/v1/scans/{scan_id}")

    def list(self, *, repository_id: str | None = None) -> dict[str, Any]:
        params: dict[str, str] = {}
        if repository_id:
            params["repositoryId"] = repository_id
        return self._parent._request("GET", "/v1/scans", params=params)


class _FindingsResource:
    def __init__(self, parent: "Covenant") -> None:
        self._parent = parent

    def list(
        self,
        *,
        scan_id: str | None = None,
        severity: str | None = None,
    ) -> dict[str, Any]:
        params: dict[str, str] = {}
        if scan_id:
            params["scanId"] = scan_id
        if severity:
            params["severity"] = severity
        return self._parent._request("GET", "/v1/findings", params=params)


class Covenant:
    """Synchronous Covenant client."""

    def __init__(
        self,
        *,
        api_url: str | None = None,
        token: str | None = None,
        timeout: float = DEFAULT_TIMEOUT,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self._api_url = _resolve_api_url(api_url).rstrip("/")
        self._token = _resolve_token(token)
        self._client = httpx.Client(
            base_url=self._api_url,
            timeout=timeout,
            headers=_headers(self._token),
            transport=transport,
        )
        self.scans = _ScansResource(self)
        self.findings = _FindingsResource(self)

    def _request(
        self,
        method: str,
        path: str,
        *,
        json: Mapping[str, Any] | None = None,
        params: Mapping[str, str] | None = None,
    ) -> dict[str, Any]:
        response = self._client.request(method, path, json=json, params=params)
        return _check(response)

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "Covenant":
        return self

    def __exit__(self, *_exc: object) -> None:
        self.close()


class _AsyncScansResource:
    def __init__(self, parent: "AsyncCovenant") -> None:
        self._parent = parent

    async def create(self, repository_id: str) -> dict[str, Any]:
        return await self._parent._request(
            "POST", "/v1/scans", json={"repositoryId": repository_id}
        )

    async def get(self, scan_id: str) -> dict[str, Any]:
        return await self._parent._request("GET", f"/v1/scans/{scan_id}")

    async def list(self, *, repository_id: str | None = None) -> dict[str, Any]:
        params: dict[str, str] = {}
        if repository_id:
            params["repositoryId"] = repository_id
        return await self._parent._request("GET", "/v1/scans", params=params)


class _AsyncFindingsResource:
    def __init__(self, parent: "AsyncCovenant") -> None:
        self._parent = parent

    async def list(
        self,
        *,
        scan_id: str | None = None,
        severity: str | None = None,
    ) -> dict[str, Any]:
        params: dict[str, str] = {}
        if scan_id:
            params["scanId"] = scan_id
        if severity:
            params["severity"] = severity
        return await self._parent._request("GET", "/v1/findings", params=params)


class AsyncCovenant:
    """Asynchronous Covenant client."""

    def __init__(
        self,
        *,
        api_url: str | None = None,
        token: str | None = None,
        timeout: float = DEFAULT_TIMEOUT,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self._api_url = _resolve_api_url(api_url).rstrip("/")
        self._token = _resolve_token(token)
        self._client = httpx.AsyncClient(
            base_url=self._api_url,
            timeout=timeout,
            headers=_headers(self._token),
            transport=transport,
        )
        self.scans = _AsyncScansResource(self)
        self.findings = _AsyncFindingsResource(self)

    async def _request(
        self,
        method: str,
        path: str,
        *,
        json: Mapping[str, Any] | None = None,
        params: Mapping[str, str] | None = None,
    ) -> dict[str, Any]:
        response = await self._client.request(method, path, json=json, params=params)
        return _check(response)

    async def aclose(self) -> None:
        await self._client.aclose()

    async def __aenter__(self) -> "AsyncCovenant":
        return self

    async def __aexit__(self, *_exc: object) -> None:
        await self.aclose()
