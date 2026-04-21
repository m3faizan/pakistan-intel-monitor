# Pakistan Intelligence Monitor - PRD

## Original Problem Statement
Build the Pakistan Intelligence Monitor dashboard from GitHub repository: https://github.com/m3faizan/pakistan-intel-monitor
A real-time intelligence dashboard for Pakistan — economic data, energy, security, infrastructure, and news in one dark-themed situational awareness interface.

## Architecture
- **Frontend**: React 18 (Create React App), Recharts, MapLibre GL
- **Backend**: Python 3, FastAPI 0.115.6, httpx, feedparser
- **Data Sources**: SBP API, PBS Google Sheets, RSS feeds, weather APIs
- **Database**: MongoDB (via MONGO_URL) with mongomock fallback
- **Styling**: Custom CSS dark theme (Barlow Condensed + JetBrains Mono)

## User Personas
- Government/intelligence analysts monitoring Pakistan's situation
- Financial analysts tracking economic indicators
- Energy sector professionals monitoring power/petroleum data
- Journalists and researchers tracking security and news

## Core Requirements (Static)
1. Two-tab dashboard: PAKISTAN and ENERGY
2. Real-time data from 50+ RSS feeds, SBP APIs, weather APIs
3. Interactive map with markers for cities, ports, and alerts
4. AI-generated daily briefing
5. Economic indicators: PKR/USD, KSE-100, CPI, forex reserves, etc.
6. Energy section: power generation, distribution, petroleum payments
7. Infrastructure: air traffic, marine traffic, road advisories
8. Regional relations: geopolitical tracker for 25+ countries
9. Dark theme UI with responsive layout

## What's Been Implemented (Jan 2026)
- [x] Full backend API with 40+ endpoints serving live data
- [x] React frontend with 38 components
- [x] Interactive MapLibre map with city markers
- [x] News aggregation from 20+ RSS sources
- [x] AI-powered daily briefing via emergentintegrations
- [x] Economic indicators panel (12+ indicators)
- [x] Inflation Monitor (CPI YoY/MoM, SPI Weekly/Monthly)
- [x] Business Environment panel with charts
- [x] Real Sector panel (LSM, Auto, Fertilizer, POL)
- [x] Weather panel for major cities
- [x] Regional Relations accordion with 25+ countries
- [x] Infrastructure, Air Traffic, Marine Traffic panels
- [x] Energy Dashboard with power generation, energy payments
- [x] Energy News with tag filtering (OIL, GAS, POWER, RENEW, COAL)
- [x] News ticker with breaking news
- [x] **WebSocket real-time push** (Socket.IO) for news, security, weather, energy news (Apr 2026)
- [x] **LIVE/POLLING status indicator** in header with viewer count
- [x] **Adaptive polling** — 5min with WS connected, 60s fallback
- [x] **LNG Dashboard** — new tab with map, news, and 8 Supabase-powered metrics (Apr 2026)
- [x] **LNG Map** — Port Qasim terminals (EETL, PGPCL) with interactive info popups
- [x] **LNG News** — Real-time from LNG Prime, Offshore Energy, LNG Journal + scraped sites
- [x] **LNG Data Modals** — Clickable metrics with historical charts, POL-Sales-style legends, YTD/6M/1Y/2Y/3Y/ALL ranges, % Change bar charts, unit display
- [x] **LNG Price (DES)** — Composed chart: Long-Term + Spot as bars, wAvg DES as line
- [x] **DES Slope** — Overall slope view + Price Trend toggle (grouped bar chart for LT/Spot)
- [x] **Terminal Activity panel** — Total Cargoes, EETL/PGPCL share, terminal share bar, port charges
- [x] **LNG Generation Panel** — RLNG Generation (728.64 GWh), RLNG in Mix (9.5%), LNG Import Payment ($173.0M) from SBP API
- [x] **RLNG Plants on Map** — Haveli Bahadur Shah, Balloki, Bhikki, Trimmu + pipeline infrastructure (SSGC/SNGPL)
- [x] **LNG Import Payments (SBP)** — Uses same SBP BOP dataset as Energy Payments panel (TS_GP_BOP_MRECCG_M.IMP00400)
- [x] **RLNG Generation (SBP)** — Uses same SBP power gen dataset (TS_GP_RLS_ELECGEN_M.E_007000 + E_001000)

## Testing Status
- Backend: 100% (40/40 tests passed)
- Frontend: 100% (all UI + WebSocket + LNG components working)
- Integration: 100% (Supabase, RSS feeds, WebSocket all working)

## Prioritized Backlog
### P0 (Critical) - None remaining
### P1 (High)
- Add user authentication for admin features
- Historical data export functionality
- Alert notification system (push/email)
- Push economic indicator updates via WebSocket
### P2 (Medium)
- Dark/light theme toggle
- Customizable dashboard layout (drag-and-drop panels)
- Data refresh interval configuration
- Mobile-responsive improvements
### Next Tasks
- Performance optimization for initial load
- Add loading skeletons for better UX
- Implement WebSocket for real-time updates
- [x] **LNG % of Imports metric** — 3.53% of total Pakistan imports from SBP BOP data
- [x] **Fixed unit labels** — Import Payment shows "Million USD" across all panels/modals
