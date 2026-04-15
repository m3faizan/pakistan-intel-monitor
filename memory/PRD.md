# Pakistan Intelligence Monitor - Product Requirements Document

## Project Overview
A real-time intelligence dashboard for monitoring Pakistan-related information, inspired by the World Monitor project (github.com/koala73/worldmonitor).

## Original Problem Statement
Clone the World Monitor GitHub app design, layout and features to create a Pakistan Intelligence Monitoring tool focusing specifically on Pakistan-related information.

## Tech Stack
- **Frontend**: React.js with CSS (no Tailwind)
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Maps**: MapLibre GL JS with CARTO dark basemap
- **Styling**: Custom CSS with dark theme and Pakistan green (#22C55E) accents

## User Personas
1. **Intelligence Analysts** - Need real-time data aggregation
2. **Researchers** - Academic study of Pakistan affairs
3. **Journalists** - News monitoring and story tracking
4. **Policy Makers** - Quick situational awareness
5. **Citizens** - General interest in Pakistan news

## Core Requirements (Static)
1. Real-time news aggregation from Pakistani sources
2. Economic indicators dashboard (PKR exchange rates, KSE-100, inflation)
3. Security and political alerts panel
4. Weather data for major Pakistani cities
5. Regional relations tracking (India, China, Afghanistan, etc.)
6. Infrastructure monitoring (power, internet, transport)
7. Interactive map centered on Pakistan with city markers
8. Auto-refresh capability
9. Dark theme with Pakistan green accents
10. Responsive design

## What's Been Implemented (Mar 8-10, 2026)

### Latest Updates (Apr 4, 2026)
- [x] Completed **Regional Relations Panel** with full redesign:
  - Accordion-style layout: 24 countries collapsed by default, expand on click
  - No emoji flags - clean text-only country names in JetBrains Mono font
  - All tags and status labels in JetBrains Mono, full text visible (no truncation)
  - 5 groups: Neighbor(4), GCC(7), Major(3), Central Asia(3), EU(7)
  - Added: Russia, Azerbaijan, Tajikistan, Kazakhstan
  - Actual embassy/consulate URLs (pakhcnewdelhi.org.pk, embassyofpakistan.com, pakbj.org, etc.)
  - Web-researched "Most Recent Visit" for every country (e.g., Army Chief Asim Munir visited US Jun+Aug 2025)
  - Red color for negative relationships, green for positive
  - Panel content height 300px (matches Weather and other panels)
  - Disk persistence for SBP data, optimized API calls
- **Known Issue**: SBP EasyData API has a daily call limit. When exhausted, trade data shows as empty until midnight PKT reset.
  - Vessel layer removed from map (user requested)
  - Russia trade data working via "Russian Federation" SBP alias (Exports $5.38M, Imports $1.05M)

### Latest Updates (Mar 14, 2026)
- [x] Implemented **Daily Briefing** panel powered by **OpenAI GPT-5.2** with a 6-hour cache window.
- [x] Added manual refresh support with stale fallback to last successful briefing if generation fails.
- [x] Daily briefing now summarizes top headlines plus key economic indicators into structured sections.
- [x] Added **RDA Inflows** to Economic Indicators (total funds received, full history, USD billions format).
- [x] Added **POL Sales** to Real Sector with stacked-by-sector modal and total overlay.
- [x] Fixed POL legend overflow (moved below chart, wraps) and added stale fallback for POL/Auto Vehicles/2&3 Wheelers when SBP API fails.
- [x] Added **Consumer Confidence Index (CCI)** to Business Environment with clickable trend tab.
- [x] KSE-100 indicator now shows last market close date and uses orange dot when market is closed.
- [x] Added **Daily Energy Report** map tab pulling HTML from Google Sheet and geocoding country/region markers.
- [x] Added Energy sidebar feed with collapsible list; tabs renamed to Pakistan/Daily Energy Report and popups show full scrollable lists.
- [x] Added emoji flags and continent-colored chips in the Energy sidebar.
- [x] Energy sidebar height now fixed to map viewport with internal scrolling.
- [x] Added Pakistan-flagged vessels map layer toggle with manual refresh (AISstream integration).
- [x] Aligned SPI series selector row with time range selector.
- [x] Built **Regional Relations** panel with flags, relationship status, sources, and trade/remittance cards (SBP EasyData).
- [x] Added DataDocked fallback for vessel positions and compacted map legend.
- [x] Updated SBP API key to restore live CPI/indicator data.
- [x] Replaced stale text badges with green/orange status dots across panels; CPI now uses cached fallback when SBP API fails (if last-good exists).

### Latest Updates (Mar 10, 2026)
- [x] Added new **Real Sector** panel with LSM Quantum Index (CPI-style historical flow):
  - New APIs: `/api/lsm` and `/api/lsm-historical`
  - Historical stitching across 6 base-year series (1969-70, 1975-76, 1980-81, 1999-2000, 2005-06, 2015-16)
  - New `LSMDataModal` with multi-range chart and base-year transition markers
  - Positive change semantics implemented as requested: increase = good (green), decrease = bad (red)
- [x] Real Sector UX refinement pass:
  - LSM tile now visually matches Economic Indicator cards (sharp edge style)
  - Removed “increase is good” phrasing from tile text
  - LSM modal now uses base-year dropdown selection (default `Base 2015-16`) instead of plotting mixed base-year lines together
  - LSM modal summary number color aligned with Economic indicator value styling
  - Base-year dropdown moved inline next to range controls; `20Y` range option removed
- [x] PSX modal market status fix:
  - Replaced timestamp string heuristic with Karachi market-hours logic (Mon-Fri, 09:30-15:30 PKT)
  - Corrected false “Market Closed” reports during open sessions
- [x] SBP rate-limit resilience enhancement:
  - Added persisted fallback cache for key SBP indicators (remittances, gold, forex, current account, imports, exports, PKR/USD, FDI, gov debt, business environment, LSM)
  - On fetch failures/rate-limits, app now restores last successful polled values instead of dropping cards to `--` where prior data exists
- [x] Liquid FX live-source upgrade:
  - `/api/liquid-forex` now checks `https://www.sbp.org.pk/ecodata/forex.pdf` for latest weekly reserves on refresh
  - Latest PDF row is merged into Liquid FX series (upsert by date) so dashboard stays current
  - Verified latest card/modal now reflects **Mar 06, 2026** values from SBP PDF
- [x] News feed relevance and source update:
  - Added/updated Pakistan news source list per provided outlets (Dawn, Geo, ARY, Tribune, Dunya, Business Recorder, Daily Times, Profit, Samaa, Pakistan Today, ProPakistani, TechJuice, etc.)
  - Implemented hard keyword filtering to remove entertainment/lifestyle/sports headlines unless policy/politics/economy/security context is present
  - Added deduplication by link/title and kept 48-hour freshness filter
- [x] Added **Auto Vehicles (Production & Sales)** to Real Sector:
  - New endpoint `/api/auto-vehicles` (SBP dataset `TS_GP_RLS_PSAUTO_M`)
  - Real Sector card now shows both **Production** and **Sales** with MoM changes
  - Click opens modal with **stacked column chart** and Production/Sales toggle
  - Category stacks include Cars, Trucks, Buses, Jeeps & Pickups, Tractors, and 2 & 3 Wheelers
- [x] Auto Vehicles + 2/3 Wheeler refinements:
  - Production/Sales selector moved to same control row as time-range buttons
  - Auto chart now supports per-series deselect with dimmed state (dull) while preserving chart layout
  - Removed 2/3 Wheelers from Auto Vehicles stacked chart categories
  - Added separate **2/3 Wheelers** Real Sector data point with dedicated modal (Production/Sales + trend chart)
- [x] Auto Vehicles legend/line polish:
  - Legend/toggle controls styled to match range/selector UI format and aligned in-row
  - Total series emphasized with dedicated legend chip and explicit total line overlay
- [x] Added **Fertilizer** data point in Real Sector:
  - New endpoint `/api/fertilizer` using SBP dataset `TS_GP_RLS_SALEFERT_M`
  - Real Sector tile shows Total Sales/Offtake with MoM change
  - Modal uses stacked chart (Urea + DAP) with Total line overlay
  - All series (Total/Urea/DAP) are toggleable and can be deselected with dimmed state
- [x] Fertilizer data+UI alignment pass:
  - Historical range expanded to **Jul 2006 → Jan 2026**
  - Time-range + series toggles aligned into the same selector row
  - Unit standardized for fertilizer-only surfaces as **Thousand Metric Ton**
- [x] LSM backend resilience improvements:
  - Added handling for SBP rate-limit responses that return HTTP 200 with `{ "error": ... }`
  - Avoids clobbering last good cached LSM data on fetch failure
  - Shared cache path reduces duplicate calls between `/api/lsm` and `/api/lsm-historical`
- [x] Added new **Business Environment** panel (EPU + Business Confidence):
  - New endpoint `/api/business-environment` using SBP EasyData datasets `TS_GP_MFS_EPUI_M` and `TS_GP_RL_BCSIND_M`
  - KPI cards: EPU (4 newspapers), Current BCI, Expected BCI
  - Tabbed analysis views: **Overview** (trend lines), **Sectors** (bar chart), **Drivers** (current vs expected metrics)
  - Coverage metadata included (selected series vs available BCI series)
- [x] Business Environment tooltip readability pass:
  - Replaced default large white tooltips with compact dark tooltip cards
  - Improved contrast and tighter spacing for easier chart reading
- [x] Business Environment interaction refinements:
  - Overview now shows **BCI trend only**
  - Added dedicated **EPU** block/tab beside Drivers to view EPU trend chart on click
  - Sectors view now includes a selector: default snapshot (all sectors current month) + per-sector full historical trend
- [x] Business Environment history depth update:
  - BCI trend, EPU trend, and sector trend views now use **all available historical data** (starting around Oct 2017 where available)
  - Updated tab label casing from "Epu" to **"EPU"**
- [x] BCI and Sector chart interactivity update:
  - Added clickable series legend toggles for BCI and All-Sectors trend charts
  - Unselected series now stay in legend but appear **dull** (lower opacity)
  - Verified date span labels in charts show **Oct 2017 - Feb 2026** where available
- [x] Business Environment date-range correctness hardening:
  - Confidence/EPU history now filtered to expected window (from Oct 2017 forward)
  - Cache refresh guard improved to auto-refresh stale range ends (e.g., Jan when Feb is available)
- [x] Added **FDI** to Economic Indicators:
  - New endpoint `/api/fdi` from SBP series `TS_GP_FI_SUMFIPK_M.FI00030`
  - Economic card + modal integrated in existing style
  - Semantics kept as requested: FDI increase shown green, decrease shown red
- [x] Final Business Environment chart corrections:
  - Overview + Sector trend x-axis now preserves latest month (no one-month lag)
  - Overview + Sector y-axis fixed to **0–100**
  - Confirmed confidence range is **Oct 2017 to Feb 2026**
- [x] FDI history depth correction:
  - FDI source window expanded to **Jul 1997 to Jan 2026** (343 data points)
  - FDI modal defaults to **All** range to display full historical series on open
- [x] Debt semantics corrected end-to-end:
  - For Gov. Debt, **increase = red (bad)** and **decrease = green (good)** on card + modal + % change bars
- [x] Added **Central Government Debt** to Economic Indicators:
  - New backend endpoint: `/api/gov-debt` using SBP EasyData series
  - Card shows latest total debt with MoM change in PKR Billion format
  - Modal supports breakdown view with **Internal Debt + External Debt** and total overlay
- [x] Added **SPI integration** in Inflation Monitor using Google Sheet source:
  - Weekly SPI from `main raw data` and Monthly SPI from `monthly_spi`
  - Added new APIs: `/api/spi-weekly` and `/api/spi-monthly` with low-frequency cache (12h)
  - Added SPI cards + SPI modal with historical chart and `% Change` toggle
- [x] Enhanced Weekly SPI modal and panel UX:
  - Weekly chart now includes **Combined + Quintile series (Q1–Q5)** with select/deselect controls
  - Tooltip now shows full **week-ending date** (month + day + year)
  - Inflation panel now shows item movement chips for Weekly SPI: **↑ increase, ↓ decrease, = stable**
- [x] SPI sentiment and source polish:
  - SPI increases are now treated visually as **negative** (red), while decreases are **positive** (green)
  - Modal source now links directly to **spi.pakesda.com** (without Google Sheet wording)
- [x] Fixed missing latest SPI weekly points (2026 rows):
  - Switched backend SPI ingestion from CSV export to **XLSX export parsing** to capture formula-evaluated latest values
  - Weekly SPI now correctly includes values up to **Mar 05, 2026** (as present in the sheet)
- [x] Completed **Liquid FX modal breakdown flow** end-to-end:
  - Breakdown toggle now cleanly switches between total and stacked breakdown views
  - `% Change` and `Breakdown` toggles now reset each other to avoid conflicting chart states
  - Breakdown legend labels now match Liquid FX semantics: **Net Reserves with SBP / Net Reserves with Banks**
- [x] Fixed Liquid FX summary metadata in modal:
  - Shows latest weekly date (`dateFormatted`) instead of `N/A`
  - Uses **WoW** change label/value (instead of MoM)
- [x] Verified in browser smoke test with interactive modal checks (open, toggle, labels, summary)

### Backend (FastAPI)
- [x] `/api/health` - Health check endpoint
- [x] `/api/news` - RSS feed aggregation from 12+ Pakistani news sources with category filtering
- [x] `/api/economic` - Economic indicators (PKR/USD, KSE-100, inflation)
- [x] `/api/weather` - Weather data for major cities (Karachi, Lahore, Islamabad, Peshawar, Quetta, Multan)
- [x] `/api/security` - Security and political alerts
- [x] `/api/regional` - Regional relations data (India, China, Afghanistan, Iran, Saudi Arabia, USA)
- [x] `/api/infrastructure` - Power grid, internet, airport & port data for 5 airports and 3 ports
- [x] `/api/map-data` - Map markers for Pakistani cities and CPEC routes
- [x] `/api/remittances` - **LIVE** Workers' remittances from SBP API (1972-present)
- [x] `/api/gold-reserves` - **LIVE** Gold reserves from SBP API (1990-present)
- [x] `/api/forex-reserves` - **LIVE** Total forex reserves from SBP API (1990-present)
- [x] `/api/current-account` - **LIVE** Current account balance from SBP API
- [x] `/api/imports` - **LIVE** Imports data from SBP API (1990-present)
- [x] `/api/exports` - **LIVE** Exports data from SBP API (1990-present)
- [x] `/api/pkr-usd` - **LIVE** PKR/USD exchange rate from SBP API
- [x] `/api/psx-data` - **LIVE** KSE-100 Index data scraped from PSX (dps.psx.com.pk)
- [x] `/api/cpi-yoy` - **LIVE** CPI Year-on-Year inflation from SBP API (2016-present)
- [x] `/api/cpi-mom` - **LIVE** CPI Month-on-Month inflation from SBP API (2016-present)
- [x] `/api/cpi-yoy-historical` - **LIVE** Complete CPI YoY history (1965-2026, 656 points, 8 base year periods)
- [x] `/api/cpi-mom-historical` - **LIVE** Complete CPI MoM history (1964-2026, 711 points, 8 base year periods)
- [x] `/api/spi-weekly` - **LIVE** Weekly SPI (Combined + Q1-Q5 + increase/decrease/stable counts) from Google Sheet
- [x] `/api/spi-monthly` - **LIVE** Monthly SPI (Q1 index) from Google Sheet
- [x] `/api/gov-debt` - **LIVE** Central Government Debt (Total + Internal + External) from SBP EasyData
- [x] `/api/business-environment` - **LIVE** EPU + Business Confidence composite data for new panel
- [x] `/api/admin/airport-history` - Historical airport traffic data with date/code filters
- [x] `/api/admin/port-history` - Historical port traffic data with date/code filters
- [x] `/api/admin/airport-history/summary` - Airport history statistics (avg/max departures, arrivals)
- [x] `/api/admin/port-history/summary` - Port history statistics (avg/max vessels, arrivals, departures)

### Frontend (React)
- [x] Header with logo, live indicator, **Pakistan time (PKT/UTC+5)**, refresh button
- [x] News ticker (scrolling headlines)
- [x] Bento grid layout with responsive panels (10 bottom panels)
- [x] NewsPanel - Latest news with category tabs and infinite scroll
- [x] EconomicPanel - 10 indicators with all **LIVE** (PSX, PKR/USD, Current A/C, Gold, Forex, Imports, Exports, Remittances, Gov. Debt, Liquid FX)
- [x] **InflationPanel** - CPI (YoY/MoM) + SPI (Weekly/Monthly) with clickable chart modals and movement summary chips
- [x] **BusinessEnvironmentPanel** - EPU + BCI composite panel with Overview/Sectors/Drivers tabs
- [x] **SBPDataModal** - Reusable chart modal with MoM%, YoY%, time range selectors
- [x] **PSXDataModal** - KSE-100 modal with Day High/Low, Volume, Previous Close, YTD/YoY changes
- [x] **CPIDataModal** - CPI modal with 60-year history, base year markers, 10Y/20Y/ALL time ranges
- [x] SecurityPanel - Security/political alerts with severity indicators
- [x] WeatherPanel - Weather for 6 major cities
- [x] RegionalPanel - Diplomatic relations status
- [x] **InfrastructurePanel** - Power Grid (status, load shedding, capacity) and Internet (status, speed, outages)
- [x] **AirTrafficPanel** - 5 airports with operational status, departures/arrivals (FlightStats)
- [x] **MarineTrafficPanel** - 3 ports with In Port, Arrivals, Departures, Expected (MyShipTracking)
- [x] **GovernancePanel** - Provincial CM Tracker with projects, completed, focus area, impact score, days in power
- [x] MapSection - Interactive map with Pakistan focus, city markers, legend

### Design
- [x] Dark theme (background: #020617, surface: #0F172A)
- [x] Pakistan green accent color (#22C55E)
- [x] Barlow Condensed font for headings
- [x] JetBrains Mono font for data/code
- [x] Panel borders and shadows
- [x] Status indicators (good/warning/critical)
- [x] Responsive grid layout

## Data Sources
- **News**: Real RSS feeds from Pakistani news outlets
- **KSE-100 Index**: **LIVE** - Scraped from Pakistan Stock Exchange (dps.psx.com.pk)
- **PKR/USD Exchange Rate**: **LIVE** - State Bank of Pakistan EasyData API
- **Remittances**: **LIVE** - State Bank of Pakistan EasyData API (1972-present, 643 data points)
- **Gold Reserves**: **LIVE** - State Bank of Pakistan EasyData API (1990-present)
- **Forex Reserves**: **LIVE** - State Bank of Pakistan EasyData API (1990-present)
- **Current Account**: **LIVE** - State Bank of Pakistan EasyData API
- **Imports/Exports**: **LIVE** - State Bank of Pakistan EasyData API
- **CPI Inflation (YoY/MoM)**: **LIVE** - State Bank of Pakistan EasyData API (1964-2026, 8 base year periods combined)
- **SPI (Weekly/Monthly)**: **LIVE** - Google Sheet source (`main raw data`, `monthly_spi`)
- **Central Government Debt**: **LIVE** - SBP EasyData (`TS_GP_BAM_CENGOVTD_M` dataset via total/internal/external series)
- **Business Environment (EPU + BCI)**: **LIVE** - SBP EasyData (`TS_GP_MFS_EPUI_M`, `TS_GP_RL_BCSIND_M`)
- **Weather**: MOCKED (ready for OpenWeatherMap integration)
- **Security**: MOCKED (ready for API integration)
- **Regional**: **LIVE** - SBP EasyData trade data (Exports/Imports/Remittances) + curated diplomatic intel for 20 countries
- **Infrastructure**: **LIVE** - Scraped from FlightStats (airports) and MyShipTracking (ports)
- **Daily Briefing**: **LIVE** - OpenAI GPT-5.2 generated intelligence summary (cached 6 hours)

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- [x] Basic dashboard layout
- [x] News feed integration with category filtering
- [x] Map display
- [x] All panels rendering
- [x] Infrastructure panel with real scraped airport & port data
- [x] Pakistan local time display (PKT/UTC+5) in header
- [x] **LIVE remittances data from SBP API with interactive chart modal**
- [x] **LIVE PKR/USD exchange rate from SBP API**
- [x] **LIVE KSE-100 Index data from PSX with clickable modal** (Mar 6, 2026)
- [x] **LIVE CPI Inflation Monitor panel with YoY/MoM data** (Mar 8, 2026)
- [x] **LIVE Regional Relations Panel** with 20 countries grouped by Neighbor/GCC/Major/EU, trade data, sparklines, trade balance, visa info (Apr 4, 2026)

### P1 (High Priority)
- [ ] Make Governance Panel dynamic (scrape from pakistanprojects.pakesda.com)
- [ ] Real-time data for Security & Politics panel (GDELT, ACLED, or RSS feeds)
- [ ] Real weather API integration (OpenWeatherMap)
- [ ] WebSocket for real-time updates
- [ ] User preferences persistence

### P2 (Medium Priority)
- [ ] Historical data charts for PSX (intraday graphs)
- [ ] News search and filtering
- [ ] Export functionality
- [ ] Dark/Light theme toggle
- [ ] Notifications system

### P3 (Nice to Have)
- [ ] Mobile app version
- [ ] Push notifications
- [ ] User authentication
- [ ] Saved watchlists
- [ ] Social sharing

## Next Tasks
1. Make Governance Panel dynamic
2. Implement real-time data for Security & Politics panel
3. Improve SBP initial-load resilience (parallel fetch/caching tuning)
4. Add OpenWeatherMap API for real weather data

## Technical Notes
- Preview URL may show "unavailable" due to gateway warm-up; app runs correctly locally
- MapLibre GL requires async import pattern in React
- RSS feeds refresh every 5 minutes
- PSX data cached for 5 minutes
- All data-testid attributes added for testing
