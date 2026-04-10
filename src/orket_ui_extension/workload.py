from __future__ import annotations

from typing import Any


async def run(payload: dict[str, Any] | None = None) -> dict[str, Any]:
    """Return scaffold metadata for future extension-runtime wiring."""
    return {
        "ok": True,
        "workload_id": "ui_bootstrap",
        "status": "scaffold_only",
        "payload": payload or {},
    }
