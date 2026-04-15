# Pakistan Intelligence Monitor

A real-time intelligence dashboard for Pakistan — economic data, energy, security, infrastructure, and news in one dark-themed situational awareness interface.

Built with **React** (Create React App) + **FastAPI**.

---

## Screenshots

> Pakistan tab — map, daily briefing, news feed, and full data grid  
> Energy tab — power generation, distribution chart, petroleum payments modal with MoM change charts

---

## Features

### Pakistan Tab

| Panel | Data |
|-------|------|
| Interactive Map | Geographic overview |
| Daily Briefing | AI-generated situational summary |
| News Feed | Live aggregated news from 50+ Pakistani sources |
| Economic Panel | Forex reserves, remittances, current account, FDI, PKR/USD, govt debt |
| Inflation Panel | CPI YoY/MoM and SPI weekly/monthly with historical charts |
| Real Sector Panel | LSM index, auto vehicle sales, POL sales, fertilizer |
| Security Panel | Security incident tracking |
| Weather Panel | Current conditions across major cities |
| Infrastructure Panel | Road advisories and air traffic |
| Regional Relations | Geopolitical relationship tracker |
| Minerals & Metals | PBS commodity price data with sparklines |
| PSX Data | Pakistan Stock Exchange summary |
| Business Environment | Ease-of-doing-business indicators |

### Energy Tab

| Panel | Data |
|-------|------|
| Energy Map | Geographic energy infrastructure overview |
| Energy News | Filtered feed with tag chips: OIL · GAS · POWER · RENEW · COAL |
| Power Generation Panel | Sparkline grid per source (hydro, thermal, nuclear, solar, wind…) |
| Power Distribution Panel | Multi-line chart of all sources over time |
| Energy Payments Panel | Petroleum import payments with period-change mini bar chart |

#### Energy Payments Modal — detailed features
- Time-series area/bar chart with range selector: `YTD | 1Y | 2Y | 5Y | 10Y | All`
- **% Imports** mode — each component as % of total petroleum imports
- **% Chg** mode — MoM percentage-change bar chart (red = cost up, green = cost down)
- **$ Chg** mode — MoM dollar-change bar chart
- Series chips to show/hide individual components (all can be deselected)
- `% Imports` and change modes are mutually exclusive
- Grouped view (Petroleum Group) and individual series view
- Reference line at y = 0 in change modes

---

## Architecture

```
pakistan-intel-monitor/
├── frontend/                        # React 18 (Create React App)
│   ├── public/
│   ├── src/
│   │   ├── App.js                   # Tab navigation (PAKISTAN | ENERGY)
│   │   ├── index.css                # Dark design system — CSS variables, fonts, panel/modal patterns
│   │   └── components/
│   │       ├── EnergyDashboard.js
│   │       ├── EnergyPaymentsPanel.js
│   │       ├── EnergyPaymentsModal.js
│   │       ├── EnergyNewsPanel.js
│   │       ├── PowerGenerationPanel.js
│   │       ├── PowerGenDistributionPanel.js
│   │       ├── PowerGenerationModal.js
│   │       ├── PowerGenMixModal.js
│   │       ├── RenewableShareModal.js
│   │       ├── ImportedSourcesModal.js
│   │       ├── MapSection.js
│   │       ├── EconomicPanel.js
│   │       ├── InflationPanel.js
│   │       ├── RealSectorPanel.js
│   │       ├── MineralsMetalsPanel.js
│   │       ├── SecurityPanel.js
│   │       ├── WeatherPanel.js
│   │       ├── NewsPanel.js
│   │       ├── DailyBriefingPanel.js
│   │       ├── RegionalPanel.js
│   │       ├── InfrastructurePanel.js
│   │       └── [other modals & panels]
│   └── package.json
└── backend/                         # Python FastAPI
    ├── server.py                    # All API routes
    └── emergentintegrations/        # LLM integration stub
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 (Create React App), Recharts, Leaflet |
| Backend | Python 3, FastAPI 0.115.6, httpx, feedparser |
| Data sources | State Bank of Pakistan (SBP) API, PBS Google Sheets, RSS feeds |
| Storage | mongomock (in-memory); set `MONGO_URL` for real MongoDB |
| Styling | Custom CSS — dark theme, Barlow Condensed + JetBrains Mono |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+

### Backend

```bash
cd backend
pip install -r requirements.txt
python server.py
# → http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
PORT=5000 BROWSER=none npm start
# → http://localhost:5000
```

The frontend proxies all `/api/*` requests to the backend automatically via the `proxy` field in `frontend/package.json`. No CORS configuration needed in development.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_URL` | *(empty)* | MongoDB connection string. If unset, uses an in-memory mock. |
| `REACT_APP_BACKEND_URL` | *(empty)* | Override backend URL for production. Leave empty to use the proxy. |
| `PORT` | `5000` | Frontend dev server port. |

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/news` | Aggregated Pakistan news (50+ RSS sources) |
| `GET /api/daily-briefing` | AI-generated daily briefing |
| `GET /api/economic` | Economic summary |
| `GET /api/power-generation` | SBP electricity generation data (`TS_GP_RLS_ELECGEN_M`) |
| `GET /api/energy-payments` | SBP petroleum import payments |
| `GET /api/daily-energy-report` | Daily energy report |
| `GET /api/remittances` | Remittances data |
| `GET /api/forex-reserves` | Foreign exchange reserves |
| `GET /api/liquid-forex` | Liquid forex reserves |
| `GET /api/gold-reserves` | Gold reserves |
| `GET /api/current-account` | Current account balance |
| `GET /api/pkr-usd` | PKR/USD exchange rate |
| `GET /api/gov-debt` | Government debt |
| `GET /api/fdi` | Foreign direct investment |
| `GET /api/rda-inflows` | Roshan Digital Account inflows |
| `GET /api/cpi-yoy` | CPI year-on-year |
| `GET /api/cpi-mom` | CPI month-on-month |
| `GET /api/spi-weekly` | Sensitive price index (weekly) |
| `GET /api/spi-monthly` | Sensitive price index (monthly) |
| `GET /api/lsm` | Large-scale manufacturing index |
| `GET /api/imports` | Import data |
| `GET /api/exports` | Export data |
| `GET /api/auto-vehicles` | Auto vehicle sales |
| `GET /api/pol-sales` | POL products sales |
| `GET /api/fertilizer` | Fertilizer data |
| `GET /api/minerals-metals` | Minerals and metals prices |
| `GET /api/psx-data` | Pakistan Stock Exchange data |
| `GET /api/map-data` | Map overlay data |
| `GET /api/security` | Security incidents |
| `GET /api/weather` | Weather data |
| `GET /api/regional-relations` | Regional geopolitical relations |
| `GET /api/infrastructure` | Road advisories and air traffic |
| `GET /api/business-environment` | Business environment indicators |

---

## Design System

Defined in `frontend/src/index.css`:

| Token | Value |
|-------|-------|
| `--color-background` | `#020617` |
| `--color-primary` | `#22C55E` (green) |
| `--color-border` | `#1e293b` |
| Heading font | Barlow Condensed |
| Body/data font | JetBrains Mono |

**Component patterns:**
- **Panel** — `.panel` > `.panel-header` (`.panel-title` + `.panel-badge`) + `.panel-content`
- **Modal** — `.modal-overlay` > `.remittances-modal`
- **Range selector** — `.time-range-selector` + `.range-btn` (`.active` state)
- **Sparkline grid** — `.minerals-grid` > `.mineral-item` > `.mineral-label` + `.mineral-value` + `.mineral-change`

---

## Data Sources

- **[State Bank of Pakistan (SBP)](https://www.sbp.org.pk/)** — monetary policy data, power generation, energy payments, trade statistics
- **[Pakistan Bureau of Statistics (PBS)](https://www.pbs.gov.pk/)** — minerals, metals, inflation indices
- **RSS Feeds** — 50+ Pakistani news outlets, aggregated and deduplicated
- **Weather APIs** — current conditions for Karachi, Lahore, Islamabad, Peshawar, Quetta

---

## License

MIT
