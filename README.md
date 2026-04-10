# OrketUI Extension

OrketUI is a separate extension project for the Orket desktop-first UI lane.

This repo is the implementation authority holder for OrketUI because it now contains all three required bootstrap pieces together:

1. the selected mockup package under `stitch-design/`
2. this source-of-truth note
3. an initial shell/BFF scaffold under `src/` and `scripts/`

## Truth split

1. Requirements truth:
   - `C:\Source\Orket\docs\projects\OrketUI\ORKET_EXTENSION_UI_REQUIREMENTS_V1.md`
   - `C:\Source\Orket\docs\projects\OrketUI\ORKET_EXTENSION_UI_HOST_SEAM_MAP_V1.md`
   - `C:\Source\Orket\docs\projects\OrketUI\ORKET_EXTENSION_UI_OBJECT_MODEL_V1.md`
   - `C:\Source\Orket\docs\projects\OrketUI\ORKET_EXTENSION_UI_IMPLEMENTATION_PLAN.md`
2. Mockup truth:
   - `stitch-design/<tab>/screen.png` is the primary visual reference.
   - `stitch-design/<tab>/code.html` is helper material only, not product truth.
3. Implementation truth:
   - the extension source code and runtime behavior in this repo

## Boundary posture

1. The browser talks only to the OrketUI gateway/BFF.
2. The BFF owns browser-facing product routes under `/api/*`.
3. The BFF may shape and summarize data, but it must not invent host truth.
4. Any host-backed behavior must stay subordinate to the admitted seams named in the Orket-side seam map.
5. Write behavior is still blocked until admitted host seams exist or new core specs are extracted first.

## Current scaffold

The current scaffold is intentionally narrow but now includes the intended product stack:

1. `src/orket_ui_app/server.py` serves the shell and BFF routes.
2. `UI/` contains the `React + Vite + TypeScript` shell.
3. `src/orket_ui_extension/workload.py` is a minimal extension-package placeholder.
4. `scripts/run.ps1` and `scripts/run.sh` launch the local shell/BFF and build the UI if needed.

## Frontend stack

1. React + Vite + TypeScript
2. React Router for navigation and nested layout routing
3. TanStack Query for BFF-backed server state
4. Zustand for extension-local UI state
5. React Flow for Sequencer
6. CodeMirror for card and prompt inspection/editing surfaces
7. Radix primitives for shell building blocks

This scaffold is enough to remove the implementation-authority bootstrap blocker.
It is also now enough to support the read-backed first slice of the live roadmap lane.

## Local development

1. Optional host env:
   - `ORKET_UI_HOST_BASE_URL=http://127.0.0.1:8082`
   - `ORKET_UI_API_KEY=core-key`
   - `ORKET_UI_HOST=127.0.0.1`
   - `ORKET_UI_PORT=3010`
   - `ORKET_UI_TIMEOUT_SECONDS=10`
   - optional `ORKET_UI_REBUILD=1` to force a fresh UI build before launch
2. Start the shell/BFF:
   - PowerShell: `.\scripts\run.ps1`
   - Unix: `./scripts/run.sh`
3. The run scripts build `UI/` when `UI/dist/index.html` is missing.
4. Open the printed local URL.

## Packaging posture

This repo follows the external-extension package shape so future validation and publish work can build from a truthful starting point:

1. `pyproject.toml`
2. `extension.yaml`
3. `src/`
4. `tests/`
5. `scripts/`
