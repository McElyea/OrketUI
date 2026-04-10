from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any

import httpx

DEFAULT_HOST_BASE_URL = "http://127.0.0.1:8082"
HOST_API_KEY_ENV_NAMES = ("ORKET_UI_API_KEY", "ORKET_API_KEY")


class HostAccessError(RuntimeError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def resolve_host_base_url() -> str:
    return str(os.getenv("ORKET_UI_HOST_BASE_URL", DEFAULT_HOST_BASE_URL)).strip() or DEFAULT_HOST_BASE_URL


def resolve_host_api_key() -> str:
    for name in HOST_API_KEY_ENV_NAMES:
        value = str(os.getenv(name, "")).strip()
        if value:
            return value
    return ""


def resolve_timeout_seconds() -> float:
    raw = str(os.getenv("ORKET_UI_TIMEOUT_SECONDS", "10")).strip() or "10"
    return max(1.0, float(raw))


@dataclass(slots=True)
class HostRuntimeClient:
    base_url: str
    timeout_seconds: float
    api_key: str

    def api_key_configured(self) -> bool:
        return bool(self.api_key)

    def _headers(self, *, require_api_key: bool) -> dict[str, str]:
        if require_api_key and not self.api_key:
            raise HostAccessError(
                "E_ORKET_UI_API_KEY_REQUIRED",
                "ORKET_UI_API_KEY or ORKET_API_KEY is required for Orket host /v1/* access.",
            )
        if not self.api_key:
            return {}
        return {"X-API-Key": self.api_key}

    async def request_json(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        json_body: dict[str, Any] | None = None,
        require_api_key: bool = True,
    ) -> Any:
        headers = self._headers(require_api_key=require_api_key)
        url = f"{self.base_url.rstrip('/')}{path}"
        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.request(
                method=method,
                url=url,
                params=params,
                json=json_body,
                headers=headers,
            )
            response.raise_for_status()
        try:
            return response.json()
        except ValueError as exc:
            raise HostAccessError(
                "E_ORKET_UI_HOST_INVALID_JSON",
                f"{path} returned a non-JSON response.",
            ) from exc

    async def get_json(
        self,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        require_api_key: bool = True,
    ) -> Any:
        return await self.request_json(
            "GET",
            path,
            params=params,
            require_api_key=require_api_key,
        )

    async def post_json(
        self,
        path: str,
        *,
        json_body: dict[str, Any],
        require_api_key: bool = True,
    ) -> Any:
        return await self.request_json(
            "POST",
            path,
            json_body=json_body,
            require_api_key=require_api_key,
        )

    async def put_json(
        self,
        path: str,
        *,
        json_body: dict[str, Any],
        require_api_key: bool = True,
    ) -> Any:
        return await self.request_json(
            "PUT",
            path,
            json_body=json_body,
            require_api_key=require_api_key,
        )


def create_host_runtime_client() -> HostRuntimeClient:
    return HostRuntimeClient(
        base_url=resolve_host_base_url(),
        timeout_seconds=resolve_timeout_seconds(),
        api_key=resolve_host_api_key(),
    )
