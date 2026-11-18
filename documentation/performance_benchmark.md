# EPL v1.2 – Performance & Concurrency Benchmark Report

**Benchmark Date:** November 18, 2026  
**Hardware / Runtime:** macOS Local Host • FastAPI (`uvicorn`) + SQLite 3 + Next.js 14 Production Build (`next start`) + Playwright Chromium 159.0.8154.6  
**Architecture Decision:** Verified that single-process FastAPI + SQLite + `asyncio.Lock()` handles 6+ simultaneous franchise owners with sub-millisecond WebSocket broadcast latency. **Redis and PostgreSQL are NOT required** for a 6-owner community tournament.

---

## 1. Backend REST API Latency Benchmarks (5 Runs Each)

| Endpoint | Median (p50) | Max | Payload Size | Classification |
| :--- | :---: | :---: | :---: | :---: |
| `GET /api/advanced/charts/overview` | **8.5 ms** | 10.1 ms | 1,723 B | **VERIFIED** |
| `GET /api/advanced/partnerships` | **8.6 ms** | 11.0 ms | 26,899 B | **VERIFIED** |
| `GET /api/advanced/batting` | **11.4 ms** | 12.3 ms | 36,310 B | **VERIFIED** |
| `GET /api/advanced/bowling` | **12.3 ms** | 12.5 ms | 36,357 B | **VERIFIED** |
| `GET /api/intelligence-lab/combinations?size=2` | **13.9 ms** | 14.6 ms | 17,716 B | **VERIFIED** |
| `GET /api/advanced/fielding` | **14.1 ms** | 317.0 ms (cold) | 15,411 B | **VERIFIED** |
| `GET /api/auction/dashboard/1` (Auth) | **79.2 ms** | 82.5 ms | 1,694 B | **VERIFIED** |
| `GET /api/overview` | **80.3 ms** | 89.9 ms | 753 B | **VERIFIED** |
| `GET /api/players/EPL-P-001` | **80.4 ms** | 81.4 ms | 14,413 B | **VERIFIED** |
| `GET /api/players?sort_by=rating` (All 73) | **85.3 ms** | 86.2 ms | 132,281 B | **VERIFIED** |
| `GET /api/intelligence-lab/discoveries` | **111.4 ms** | 114.0 ms | 22,835 B | **VERIFIED** |

---

## 2. Export Generation Benchmarks (CSV, Excel, Chromium PDF)

| Export Job | Median (p50) | Max | Output Size | Classification |
| :--- | :---: | :---: | :---: | :---: |
| `GET /api/exports/auction-results?format=xlsx` | **96.5 ms** | 102.2 ms | 9,250 B | **VERIFIED** |
| `GET /api/exports/players?format=csv` (73 players) | **155.7 ms** | 158.5 ms | 10,701 B | **VERIFIED** |
| `GET /api/exports/players?format=xlsx` (73 players) | **195.9 ms** | 197.6 ms | 14,262 B | **VERIFIED** |
| `GET /api/exports/auction-results?format=pdf` | **1,208.5 ms** | 1,306.2 ms | 63,480 B | **VERIFIED** |
| `GET /api/exports/players?format=pdf` (73 players) | **1,741.0 ms** | 2,274.2 ms | 69,999 B | **VERIFIED** |
| `GET /api/exports/player/EPL-P-001/pdf` (Live Chromium, 7 pages + SVG charts) | **2,862.1 ms** | 2,912.0 ms | 844,212 B | **VERIFIED WITH LIMITATIONS** |

---

## 3. Live 7-Client Concurrent WebSocket Benchmark (1 Auctioneer + 6 Owners)

| Metric | Measured Result | Classification |
| :--- | :---: | :---: |
| 7 Simultaneous Authenticated Handshakes | **38.7 ms** (all 7 verified) | **VERIFIED** |
| Live Broadcast RTT to All 7 Clients (5 bursts) | **0.47 ms median** / **0.65 ms max** | **VERIFIED** |
| Owner Disconnect & Authenticated Reconnect | **2.5 ms** | **VERIFIED** |

---

## 4. Desktop Frontend Render Benchmarks (Playwright Chromium `networkidle`, 1440×900)

| Route | Load Time (`networkidle` + settle) | Charts Rendered | Classification |
| :--- | :---: | :---: | :---: |
| `/` (Overview Dashboard) | 1,662.5 ms | 22 Recharts SVGs | **VERIFIED** |
| `/players` (73-Player Sticky Table) | 1,431.4 ms | — | **VERIFIED** |
| `/players/EPL-P-001` (Full Profile) | 1,434.0 ms | 16 Recharts SVGs | **VERIFIED** |
| `/analytics/advanced` | 1,621.2 ms | 6 Recharts SVGs | **VERIFIED** |
| `/intelligence-lab` | 1,438.6 ms | 3 Recharts SVGs | **VERIFIED** |
| `/auction` | 1,481.8 ms | — | **VERIFIED** |

---

## 5. Identified Bottlenecks (No Premature Infrastructure Overhaul)

1. **Cold Chromium Launch per Individual PDF (`~2.86 s`)**: Each `/api/exports/player/{id}/pdf` launches a fresh Playwright Chromium process. Acceptable for ad-hoc downloads (not triggered during live bidding), though spawning 5+ simultaneous PDF renders during an active auction could briefly spike CPU; marked **VERIFIED WITH LIMITATIONS** (recommend avoiding bulk PDF generation mid-bidding round).
2. **`get_all_players_summary` Per-Request Recomputation (`~80 ms`)**: Recomputes ratings across all 73 players from SQLite per request. At `~80 ms` p50 it is well within interactive budgets for 6–10 concurrent users without adding Redis complexity.
