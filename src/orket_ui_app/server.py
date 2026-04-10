from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from orket_ui_app.host_client import HostAccessError, create_host_runtime_client


APP_ROOT = Path(__file__).resolve().parent
REPO_ROOT = APP_ROOT.parents[1]
LEGACY_STATIC_ROOT = APP_ROOT / "static"
UI_DIST_ROOT = REPO_ROOT / "UI" / "dist"
DESIGN_ROOT = REPO_ROOT / "stitch-design"
DEFAULT_EXTENSION_ID = "orket.ui"
PROMPT_REFORGER_RESULTS = ["certified", "certified_with_limits", "unsupported"]
WRITE_ACTIONS = [
    {
        "action": "create card",
        "status": "admitted",
        "reason": "Mounted through POST /v1/cards and adopted into host authority.",
    },
    {
        "action": "save card",
        "status": "admitted",
        "reason": "Mounted through PUT /v1/cards/{card_id} and adopted into host authority.",
    },
    {
        "action": "validate card",
        "status": "admitted",
        "reason": "Mounted through POST /v1/cards/validate and adopted into host authority.",
    },
    {
        "action": "save flow",
        "status": "admitted",
        "reason": "Mounted through POST /v1/flows and PUT /v1/flows/{flow_id} and adopted into host authority.",
    },
    {
        "action": "validate flow",
        "status": "admitted",
        "reason": "Mounted through POST /v1/flows/validate and adopted into host authority.",
    },
    {
        "action": "run flow",
        "status": "admitted_bounded",
        "reason": "Mounted through POST /v1/flows/{flow_id}/runs as a bounded single-card issue-target slice.",
    },
]

app = FastAPI(title="OrketUI", docs_url=None, redoc_url=None)
app.mount("/static", StaticFiles(directory=LEGACY_STATIC_ROOT), name="static")


def _web_index_file() -> Path:
    dist_index = UI_DIST_ROOT / "index.html"
    if dist_index.exists():
        return dist_index
    return LEGACY_STATIC_ROOT / "index.html"


def _resolve_dist_asset(asset_path: str) -> Path | None:
    asset_root = (UI_DIST_ROOT / "assets").resolve()
    if not asset_root.exists():
        return None
    candidate = (asset_root / asset_path).resolve()
    if not candidate.is_file() or not candidate.is_relative_to(asset_root):
        return None
    return candidate


def _host_error_payload(seam: str, exc: Exception, *, base_url: str) -> dict[str, Any]:
    code = getattr(exc, "code", "E_ORKET_UI_HOST_UNAVAILABLE")
    detail = getattr(exc, "message", str(exc))
    result = "environment blocker"
    if isinstance(exc, httpx.HTTPStatusError):
        result = "failure"
    return {
        "seam": seam,
        "base_url": base_url,
        "code": code,
        "detail": detail,
        "observed_path": "blocked",
        "observed_result": result,
    }


def _extract_http_error_detail(exc: httpx.HTTPStatusError) -> Any:
    try:
        payload = exc.response.json()
    except ValueError:
        payload = None
    if isinstance(payload, dict) and "detail" in payload:
        return payload["detail"]
    detail = str(exc.response.text or "").strip()
    return detail or str(exc)


def _summarize_observed_state(successes: dict[str, Any], failures: dict[str, Any]) -> tuple[str, str]:
    if failures and successes:
        return "degraded", "partial success"
    if failures:
        return "blocked", "environment blocker"
    return "primary", "success"


def _extract_prompt_source(raw_card: dict[str, Any] | None) -> dict[str, str]:
    if not raw_card:
        return {"source_label": "none", "source_kind": "unavailable", "source_text": ""}
    params = raw_card.get("params")
    if isinstance(params, dict):
        odr_result = params.get("odr_result")
        if isinstance(odr_result, dict):
            requirement = str(odr_result.get("odr_requirement", "")).strip()
            if requirement:
                return {
                    "source_label": "ODR requirement",
                    "source_kind": "odr_requirement",
                    "source_text": requirement,
                }
        note = str(raw_card.get("note") or "").strip()
        if note:
            return {"source_label": "Card note", "source_kind": "note", "source_text": note}
    summary = str(raw_card.get("summary") or "").strip()
    return {"source_label": "Card summary", "source_kind": "summary", "source_text": summary}


def _empty_cards_payload(limit: int, filter_token: str | None) -> dict[str, Any]:
    return {
        "items": [],
        "limit": limit,
        "offset": 0,
        "count": 0,
        "total": 0,
        "filters": {"build_id": None, "session_id": None, "status": None, "filter": filter_token},
    }


def _empty_runs_payload(limit: int) -> dict[str, Any]:
    return {"items": [], "count": 0, "limit": limit}


def _discover_design_tabs_sync() -> list[dict[str, Any]]:
    if not DESIGN_ROOT.exists():
        return []
    tabs: list[dict[str, Any]] = []
    for entry in sorted(DESIGN_ROOT.iterdir(), key=lambda item: item.name):
        if not entry.is_dir():
            continue
        tabs.append(
            {
                "tab_id": entry.name,
                "has_screen_png": (entry / "screen.png").exists(),
                "has_code_html": (entry / "code.html").exists(),
                "has_design_md": (entry / "DESIGN.md").exists(),
            }
        )
    return tabs


async def _discover_design_tabs() -> list[dict[str, Any]]:
    return await asyncio.to_thread(_discover_design_tabs_sync)


async def _safe_host_call(
    seam: str,
    path: str,
    *,
    params: dict[str, Any] | None = None,
    require_api_key: bool = True,
) -> dict[str, Any]:
    client = create_host_runtime_client()
    try:
        payload = await client.get_json(path, params=params, require_api_key=require_api_key)
        return {"ok": True, "seam": seam, "payload": payload}
    except (HostAccessError, httpx.HTTPError) as exc:
        return {"ok": False, "seam": seam, "error": _host_error_payload(seam, exc, base_url=client.base_url)}


async def _host_write_request(
    *,
    method: str,
    seam: str,
    path: str,
    json_body: dict[str, Any],
) -> dict[str, Any]:
    client = create_host_runtime_client()
    try:
        payload = await client.request_json(
            method,
            path,
            json_body=json_body,
            require_api_key=True,
        )
        return {
            "ok": True,
            "observed_path": "primary",
            "observed_result": "success",
            "source_refs": {"route": seam},
            **dict(payload or {}),
        }
    except HostAccessError as exc:
        raise HTTPException(
            status_code=503,
            detail=_host_error_payload(seam, exc, base_url=client.base_url),
        ) from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail=_extract_http_error_detail(exc)) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=503,
            detail=_host_error_payload(seam, exc, base_url=client.base_url),
        ) from exc


async def _host_read_request(
    *,
    seam: str,
    path: str,
    params: dict[str, Any] | None = None,
) -> dict[str, Any]:
    client = create_host_runtime_client()
    try:
        payload = await client.get_json(path, params=params, require_api_key=True)
        return {
            "ok": True,
            "observed_path": "primary",
            "observed_result": "success",
            "source_refs": {"route": seam},
            **dict(payload or {}),
        }
    except HostAccessError as exc:
        raise HTTPException(
            status_code=503,
            detail=_host_error_payload(seam, exc, base_url=client.base_url),
        ) from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail=_extract_http_error_detail(exc)) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=503,
            detail=_host_error_payload(seam, exc, base_url=client.base_url),
        ) from exc


@app.get("/healthz")
async def healthz() -> dict[str, Any]:
    return {"ok": True, "service": "orket-ui-react-bff"}


@app.get("/api/meta")
async def meta() -> dict[str, Any]:
    client = create_host_runtime_client()
    return {
        "ok": True,
        "extension_id": DEFAULT_EXTENSION_ID,
        "host_base_url": client.base_url,
        "api_key_configured": client.api_key_configured(),
        "observed_path": "primary",
        "observed_result": "success",
        "write_actions": WRITE_ACTIONS,
        "write_actions_blocked": [item for item in WRITE_ACTIONS if str(item.get("status")) == "blocked"],
        "routes": {
            "shell": ["/", "/healthz"],
            "bff": [
                "/api/meta",
                "/api/system/overview",
                "/api/cards",
                "/api/cards/{card_id}",
                "/api/cards/validate",
                "/api/flows",
                "/api/flows/{flow_id}",
                "/api/flows/validate",
                "/api/flows/{flow_id}/runs",
                "/api/runs",
                "/api/runs/{session_id}",
                "/api/prompt-reforger/context",
            ],
        },
        "design_tabs": await _discover_design_tabs(),
    }


@app.get("/api/system/overview")
async def system_overview() -> dict[str, Any]:
    calls = await asyncio.gather(
        _safe_host_call("GET /health", "/health", require_api_key=False),
        _safe_host_call("GET /v1/version", "/v1/version"),
        _safe_host_call("GET /v1/system/heartbeat", "/v1/system/heartbeat"),
        _safe_host_call("GET /v1/system/health-view", "/v1/system/health-view"),
        _safe_host_call("GET /v1/system/provider-status", "/v1/system/provider-status"),
    )
    keys = ["health", "version", "heartbeat", "health_view", "provider_status"]
    successes: dict[str, Any] = {}
    failures: dict[str, Any] = {}
    for key, call in zip(keys, calls, strict=True):
        if call["ok"]:
            successes[key] = call["payload"]
        else:
            failures[key] = call["error"]
    observed_path, observed_result = _summarize_observed_state(successes, failures)
    client = create_host_runtime_client()
    return {
        "ok": not failures,
        "observed_path": observed_path,
        "observed_result": observed_result,
        "host_base_url": client.base_url,
        "api_key_configured": client.api_key_configured(),
        "data": successes,
        "failures": failures,
    }


@app.get("/api/cards")
async def cards(limit: int = Query(default=12, ge=1, le=50), filter_token: str | None = Query(default=None, alias="filter")) -> dict[str, Any]:
    params: dict[str, Any] = {"limit": limit}
    if filter_token:
        params["filter"] = filter_token
    result = await _safe_host_call("GET /v1/cards/view", "/v1/cards/view", params=params)
    if result["ok"]:
        return {
            "ok": True,
            "observed_path": "primary",
            "observed_result": "success",
            "cards": result["payload"],
            "source_refs": {"route": result["seam"]},
        }
    return {
        "ok": False,
        "observed_path": result["error"]["observed_path"],
        "observed_result": result["error"]["observed_result"],
        "cards": _empty_cards_payload(limit, filter_token),
        "source_refs": {"route": result["seam"]},
        "error": result["error"],
    }


@app.get("/api/cards/{card_id}")
async def card_detail(card_id: str) -> dict[str, Any]:
    view_call, raw_call = await asyncio.gather(
        _safe_host_call("GET /v1/cards/{card_id}/view", f"/v1/cards/{card_id}/view"),
        _safe_host_call("GET /v1/cards/{card_id}", f"/v1/cards/{card_id}"),
    )
    successes: dict[str, Any] = {}
    failures: dict[str, Any] = {}
    if view_call["ok"]:
        successes["view"] = view_call["payload"]
    else:
        failures["view"] = view_call["error"]
    if raw_call["ok"]:
        successes["raw"] = raw_call["payload"]
    else:
        failures["raw"] = raw_call["error"]
    observed_path, observed_result = _summarize_observed_state(successes, failures)
    raw_card = successes.get("raw")
    return {
        "ok": not failures,
        "observed_path": observed_path,
        "observed_result": observed_result,
        "card_id": card_id,
        "view": successes.get("view"),
        "raw": raw_card,
        "prompt_source": _extract_prompt_source(raw_card),
        "failures": failures,
        "source_refs": {
            "view_route": "GET /v1/cards/{card_id}/view",
            "raw_route": "GET /v1/cards/{card_id}",
        },
    }


@app.post("/api/cards")
async def create_card_authoring(body: dict[str, Any]) -> dict[str, Any]:
    return await _host_write_request(
        method="POST",
        seam="POST /v1/cards",
        path="/v1/cards",
        json_body=body,
    )


@app.put("/api/cards/{card_id}")
async def save_card_authoring(card_id: str, body: dict[str, Any]) -> dict[str, Any]:
    return await _host_write_request(
        method="PUT",
        seam="PUT /v1/cards/{card_id}",
        path=f"/v1/cards/{card_id}",
        json_body=body,
    )


@app.post("/api/cards/validate")
async def validate_card_authoring(body: dict[str, Any]) -> dict[str, Any]:
    return await _host_write_request(
        method="POST",
        seam="POST /v1/cards/validate",
        path="/v1/cards/validate",
        json_body=body,
    )


@app.get("/api/flows")
async def list_flows(limit: int = Query(default=25, ge=1, le=100), offset: int = Query(default=0, ge=0)) -> dict[str, Any]:
    return await _host_read_request(
        seam="GET /v1/flows",
        path="/v1/flows",
        params={"limit": limit, "offset": offset},
    )


@app.get("/api/flows/{flow_id}")
async def flow_detail(flow_id: str) -> dict[str, Any]:
    return await _host_read_request(
        seam="GET /v1/flows/{flow_id}",
        path=f"/v1/flows/{flow_id}",
    )


@app.post("/api/flows")
async def create_flow_authoring(body: dict[str, Any]) -> dict[str, Any]:
    return await _host_write_request(
        method="POST",
        seam="POST /v1/flows",
        path="/v1/flows",
        json_body=body,
    )


@app.put("/api/flows/{flow_id}")
async def save_flow_authoring(flow_id: str, body: dict[str, Any]) -> dict[str, Any]:
    return await _host_write_request(
        method="PUT",
        seam="PUT /v1/flows/{flow_id}",
        path=f"/v1/flows/{flow_id}",
        json_body=body,
    )


@app.post("/api/flows/validate")
async def validate_flow_authoring(body: dict[str, Any]) -> dict[str, Any]:
    return await _host_write_request(
        method="POST",
        seam="POST /v1/flows/validate",
        path="/v1/flows/validate",
        json_body=body,
    )


@app.post("/api/flows/{flow_id}/runs")
async def run_flow_authoring(flow_id: str, body: dict[str, Any]) -> dict[str, Any]:
    return await _host_write_request(
        method="POST",
        seam="POST /v1/flows/{flow_id}/runs",
        path=f"/v1/flows/{flow_id}/runs",
        json_body=body,
    )


@app.get("/api/runs")
async def runs(limit: int = Query(default=12, ge=1, le=50)) -> dict[str, Any]:
    result = await _safe_host_call("GET /v1/runs/view", "/v1/runs/view", params={"limit": limit})
    if result["ok"]:
        return {
            "ok": True,
            "observed_path": "primary",
            "observed_result": "success",
            "runs": result["payload"],
            "source_refs": {"route": result["seam"]},
        }
    return {
        "ok": False,
        "observed_path": result["error"]["observed_path"],
        "observed_result": result["error"]["observed_result"],
        "runs": _empty_runs_payload(limit),
        "source_refs": {"route": result["seam"]},
        "error": result["error"],
    }


@app.get("/api/runs/{session_id}")
async def run_detail(session_id: str) -> dict[str, Any]:
    view_call, graph_call = await asyncio.gather(
        _safe_host_call("GET /v1/runs/{session_id}/view", f"/v1/runs/{session_id}/view"),
        _safe_host_call("GET /v1/runs/{session_id}/execution-graph", f"/v1/runs/{session_id}/execution-graph"),
    )
    successes: dict[str, Any] = {}
    failures: dict[str, Any] = {}
    if view_call["ok"]:
        successes["view"] = view_call["payload"]
    else:
        failures["view"] = view_call["error"]
    if graph_call["ok"]:
        successes["execution_graph"] = graph_call["payload"]
    else:
        failures["execution_graph"] = graph_call["error"]
    observed_path, observed_result = _summarize_observed_state(successes, failures)
    return {
        "ok": not failures,
        "observed_path": observed_path,
        "observed_result": observed_result,
        "session_id": session_id,
        "view": successes.get("view"),
        "execution_graph": successes.get("execution_graph"),
        "failures": failures,
        "source_refs": {
            "view_route": "GET /v1/runs/{session_id}/view",
            "graph_route": "GET /v1/runs/{session_id}/execution-graph",
        },
    }


@app.get("/api/prompt-reforger/context")
async def prompt_reforger_context(card_id: str | None = None) -> dict[str, Any]:
    if not card_id:
        return {
            "ok": True,
            "observed_path": "degraded",
            "observed_result": "partial success",
            "supported_result_classes": PROMPT_REFORGER_RESULTS,
            "source_prompt": {"source_label": "none", "source_kind": "unavailable", "source_text": ""},
            "status_note": "Dedicated Prompt Reforger frontend read seams are not yet admitted. Card context is optional.",
        }
    card = await card_detail(card_id)
    return {
        "ok": card["ok"],
        "observed_path": card["observed_path"],
        "observed_result": card["observed_result"],
        "supported_result_classes": PROMPT_REFORGER_RESULTS,
        "card_id": card_id,
        "source_prompt": card["prompt_source"],
        "card_view": card["view"],
        "status_note": "Prompt Reforger result classes are host-owned service truth, but a dedicated frontend read model is not yet admitted.",
        "failures": card.get("failures", {}),
    }


@app.get("/api/host/health")
async def host_health() -> dict[str, Any]:
    result = await _safe_host_call("GET /health", "/health", require_api_key=False)
    if result["ok"]:
        client = create_host_runtime_client()
        return {
            "ok": True,
            "observed_path": "primary",
            "observed_result": "success",
            "seam": result["seam"],
            "base_url": client.base_url,
            "host_payload": result["payload"],
        }
    return {"ok": False, **result["error"]}


@app.get("/assets/{asset_path:path}", response_class=FileResponse)
async def built_assets(asset_path: str) -> FileResponse:
    candidate = _resolve_dist_asset(asset_path)
    if not candidate:
        raise HTTPException(status_code=404, detail="Asset not found.")
    return FileResponse(candidate)


@app.get("/", response_class=FileResponse)
async def home() -> FileResponse:
    return FileResponse(_web_index_file())


@app.get("/{full_path:path}", response_class=FileResponse)
async def spa_fallback(full_path: str) -> FileResponse:
    if full_path.startswith("api/") or full_path == "healthz" or full_path.startswith("assets/"):
        raise HTTPException(status_code=404, detail="Not found.")
    return FileResponse(_web_index_file())
