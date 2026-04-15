# Pakistan Intelligence Monitor

## Overview
A real-time intelligence dashboard for Pakistan covering news, economic data, security, infrastructure, and energy.

## Architecture
- **Frontend**: React (Create React App) — `frontend/` — port 5000
- **Backend**: Python FastAPI — `backend/` — port 8000
- Frontend proxies `/api/*` requests to backend via `"proxy": "http://localhost:8000"` in `frontend/package.json`

## Workflows
- **Start application**: `cd frontend && PORT=5000 BROWSER=none npm start`
- **Backend API**: `cd backend && python server.py`

## Key Technical Details
- `DANGEROUSLY_DISABLE_HOST_CHECK=true` is set (env var or in package.json scripts) to allow Replit proxy
- `emergentintegrations` package unavailable on PyPI — stub at `backend/emergentintegrations/llm/chat.py`
- MongoDB replaced by `mongomock` (in-memory); set `MONGO_URL` env var for persistence
- FastAPI pinned to `0.115.6`
- SBP API key: `DF75BE2F4485CDFC98F6935C0EA5BF8AFFC252C3`
- `REACT_APP_BACKEND_URL` env var: empty = uses proxy

## Navigation Tabs
The app has two top-level tabs:
- **PAKISTAN** — full intelligence dashboard (map, news, economic, security, weather, minerals, etc.)
- **ENERGY** — energy-focused dashboard (map, energy news, power generation grid, distribution chart)

## Energy Dashboard Components
- `EnergyDashboard.js` — layout (top: map + energy news; bottom: generation grid + distribution chart)
- `EnergyNewsPanel.js` — energy news filtered from all news with tag chips (OIL, GAS, POWER, RENEW, COAL)
- `PowerGenerationPanel.js` — Minerals-style sparkline grid for each power source (SBP data)
- `PowerGenerationModal.js` — detail modal with AreaChart/BarChart + time range selector
- `PowerGenDistributionPanel.js` — multi-line chart of all power sources over time

## Backend API Endpoints (selected)
- `/api/news` — RSS aggregated Pakistan news (50+ sources)
- `/api/economic` — economic summary
- `/api/power-generation` — SBP electricity generation data (`TS_GP_RLS_ELECGEN_M` dataset)
- `/api/minerals-metals` — Google Sheets PBS minerals data
- `/api/remittances`, `/api/forex-reserves`, `/api/cpi-yoy`, `/api/lsm` — SBP series
- `/api/map-data`, `/api/security`, `/api/weather`, `/api/regional-relations`

## Design System
- Dark theme: `--color-primary: #22C55E`, `--color-background: #020617`
- Fonts: Barlow Condensed (headings) + JetBrains Mono (body)
- Panel pattern: `.panel` > `.panel-header` (`.panel-title`, `.panel-badge`) + `.panel-content`
- Mineral/Power grid: `.minerals-grid`, `.mineral-item`, `.mineral-label`, `.mineral-value`, `.mineral-change`
- Modal pattern: `.modal-overlay` > `.remittances-modal`
