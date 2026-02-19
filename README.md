# OrketUI

## STATUS: EXPERIMENTAL AND UNSTABLE

OrketUI is currently in active development.
Nothing in this repository should be considered stable, final, or ready for external contributions.

The UI is evolving rapidly and may change structure, design, or direction without notice.

Note: large portions of this UI may be rewritten or replaced without preserving behavior compatibility.
If you fork this repo, expect frequent breaking changes.

## License

This project is licensed under Apache-2.0. See `LICENSE`.

## What This Is

OrketUI is a dashboard/BFF pair for monitoring and steering Orket runtime activity.

- `client/`: Vue 3 + Vite + Pinia + PrimeVue + ECharts
- `server/`: Express BFF that handles session auth and proxies `/v1/*` + `/ws/events` to Orket API

## Current Focus

- Endpoint-contract alignment with `Orket/docs/API_FRONTEND_CONTRACT.md`
- Stabilizing panel wiring and state flow
- Improving operator console reliability
- Reducing proxy/runtime integration footguns

## Not Ready Yet

- External pull requests (see `CONTRIBUTING.md`)
- API/UX stability guarantees
- Backward compatibility promises
- Major design polish

## Known Rough Edges

- Panel behavior and payload handling may change quickly as contract work continues.
- Some interactions are intentionally strict and may fail fast when backend contracts drift.
- Refactors may be destructive across multiple files.

## Run Locally

### Prerequisites

- Node.js 20+
- npm 10+
- Running Orket API instance

### Setup

```bash
npm install
cp .env.example .env
```

Set `ORKET_API_URL`, `ORKET_API_KEY`, and other values in `.env`.

### Dev

```bash
npm run dev
```

- Client: `http://localhost:5173`
- BFF: `http://localhost:3001`

### Build

```bash
npm run build
```

## Documentation

- `ROADMAP.md` for near-term direction
- `CONTRIBUTING.md` for contribution policy
- `C:/Source/Orket/docs/API_FRONTEND_CONTRACT.md` for backend API contract

## Security and Secrets

- Do not commit `.env` or runtime secret files.
- If you find a security issue, open a private report channel before filing a public issue.
- Generated cookie/session artifacts are local-only and should remain untracked.
