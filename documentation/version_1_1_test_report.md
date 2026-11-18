# EPL Version 1.1 – Automated Testing & Verification Report

**Test Date:** November 18, 2026  
**Environment:** macOS • Python 3.13.7 (`/Users/akshat/Document/Coding Project/venv`) • Node.js 24 • Next.js 14.2.24 • Playwright Chromium 159.0.8154.6  
**Overall Result:** **55 / 55 Automated Tests Passed (100% Pass Rate)** in `12.21s` • **19 / 19 Next.js Routes Built** • **18 / 18 Live HTTP 200 Verified**

---

## 1. Automated Pytest Suite Breakdown

| Test Module | Tests | Status | Verified Coverage |
| :--- | :---: | :---: | :--- |
| `tests/test_api_endpoints.py` | 12 | **PASSED** | Overview, Players, Player Detail, Batting, Bowling, Cohorts, Insights, Auction Pool/Teams, Seasons, Teams, Admin Quality |
| `tests/test_auction_concurrency.py` | 2 | **PASSED** | State machine transitions & simultaneous multi-owner bid serialization under `asyncio.Lock()` |
| `tests/test_auth_and_simulation.py` | 7 | **PASSED** | PBKDF2 auctioneer & owner logins, invalid password rejection, `/api/auth/me`, Owner Dashboard, Scarcity, Zero-Mutation AI Simulator |
| `tests/test_cricket_analytics.py` | 6 | **PASSED** | Overs conversion, batting/bowling math, identity resolution, ratings/valuations, similarity cohorts |
| `tests/test_data_integrity.py` | 6 | **PASSED** | 27 historical PDFs, match integrity, Super Over separation, alias disambiguation, uncredited runs audit |
| `tests/test_insights_recalculation.py` | 10 | **PASSED** | Dynamic SQLite verification of core tournament insights (Sagar Kapadia, Smeet Shah, 62/2, 30, toss & chase ratios) |
| `tests/test_version_1_1.py` | **12** | **PASSED** | Version/Changelog API, additive migrations, Data Availability Matrix, 252 Partnerships, 163 Fielding Events, Batting vs Bowling Dot-Ball honesty, Player Impact, Intelligence Lab 2P/3P combinations & guardrails, Dynamic Charts, CSV/Excel/PDF exports, Playwright Player PDF, Auction Setup/Locking/Pause/Resume/Restart Recovery |
| **TOTAL** | **55** | **100% PASSED** | Zero regressions; full v1.1 feature coverage |

---

## 2. Live Export & Playwright Chromium PDF Verification

| Export Endpoint | Format | Verified Size | Pages / Sheets | Visual & Data Validation |
| :--- | :---: | :---: | :---: | :--- |
| `/api/exports/player/EPL-P-001/pdf` | PDF (Live Chromium) | 844,215 bytes | 7 pages | Rendered live from `/players/EPL-P-001?print=1` preserving Recharts SVG charts, Playfair/Inter fonts, 5-colour EPL branding, season breakdowns & scouting report (5,207 extracted chars). |
| `/api/exports/players?format=pdf&role=All-rounder` | PDF (Chromium) | 59,904 bytes | 2 pages | Full filtered dataset in A4 landscape with repeating `#07203F` headers (4,473 chars). |
| `/api/exports/players?format=xlsx&role=All-rounder` | Excel (`.xlsx`) | Verified via `openpyxl` | 1 sheet | Frozen panes, 22 columns including Season Breakdown, styled in EPL Navy/Beige. |
| `/api/exports/players?format=csv&role=All-rounder` | CSV (`UTF-8-BOM`) | Verified via `csv` | Full filtered rows | Includes all 22 fields across all matching players. |
| `/api/exports/auction-results?format=pdf` | PDF (Chromium) | 63,480 bytes | 1 page | Team squads, total spend, most expensive player, unsold pool. |
| `/api/exports/auction-results?format=xlsx` | Excel (`.xlsx`) | Verified via `openpyxl` | 3 sheets | `Team Summary`, `Sold Players`, and `Unsold Pool`. |

---

## 3. Frontend Production Build & Live Route Verification

- `npx tsc --noEmit`: **0 TypeScript errors**.
- `npm run build`: **19 / 19 static & dynamic routes compiled cleanly**.
- Live HTTP 200 verified across all 18 routes: `/`, `/players`, `/players/EPL-P-001`, `/players/EPL-P-001?public=1`, `/analytics/batting`, `/analytics/bowling`, `/analytics/all-rounders`, `/analytics/advanced`, `/intelligence-lab`, `/comparison`, `/similar-players`, `/insights`, `/teams`, `/seasons`, `/auction`, `/shortlists`, `/changelog`, `/admin`.

---

## 4. Known Limitations & Future Considerations

1. **Historical Scorecard Scope**: Batting Dot-Ball % (`0s`), dropped catches, runs saved, and over-by-over phase splits (Powerplay/Death) are absent from the 27 historical CricHeroes summary PDFs and are transparently marked `NOT AVAILABLE` rather than estimated.
2. **Partnership Balls Faced**: Fall of Wickets provides over timestamps (`2.4 ov`) rather than exact legal balls per stand when extras occur; exact runs and over spans are reported.
3. **Unregistered Wicketkeeper**: `Aditya Gurav` recorded 2 historical stumpings without batting or bowling in EPL; preserved cleanly with `fielder_id = NULL` rather than fabricating batting records.
4. **Small Historical Sample Sizes**: Across 27 total matches, combination statistics in the EPL Intelligence Lab carry explicit sample-size (`n`) and reliability warnings whenever `n < 4`.
5. **Local Hosting for Shareable URLs**: Shareable links (`/players/EPL-P-001?public=1`) resolve directly on the host machine and LAN; external public sharing requires deploying to a public domain or configuring a reverse tunnel.
