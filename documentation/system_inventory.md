# EPL System Inventory & Verification Report

**Date of Audit:** November 17, 2026  
**Auditor:** Principal Software Architect, Senior Data Engineer & QA Lead  
**Scope:** Complete Codebase, Database, Storage & Historical Archives  

---

## 1. Project Directory Structure

```text
/Users/akshat/Document/Coding Project/EPL-Stats/
│
├── EPL Data-20261117T105941Z-1-001.zip  (Original ZIP archive, 5,205,024 bytes)
├── epl_data_historical.zip              (Identical source-of-truth copy, 5,205,024 bytes)
│
├── data/
│   ├── raw/
│   │   └── EPL Data/
│   │       ├── 2023/                    (9 Match PDFs: M1 to M6, Semifinal 1, Semifinal 2, Final)
│   │       ├── 2024/                    (9 Match PDFs: M1 to M6, Semifinal 1, Semifinal 2, Final)
│   │       └── 2025/                    (9 Match PDFs: M1 to M6, SemiFinal1, SemiFinal2, Final)
│   ├── extracted/
│   │   └── matches.json                 (Intermediate JSON cache of parsed PDF data)
│   ├── processed/                       (Processed exports and schemas)
│   ├── exports/                         (Audit reports and logs)
│   └── database/
│       ├── epl_analytics.db             (Active SQLite database, 11 tables)
│       └── epl_analytics_backup_pre_audit.db (Pre-audit safety snapshot)
│
├── backend/
│   ├── extraction/
│   │   ├── pdf_extractor.py             (PyMuPDF/pdfplumber parsing engine)
│   │   └── identity_resolver.py         (Player deduplication & disambiguation)
│   ├── analytics/
│   │   ├── cricket_math.py              (Cricket metrics, overs conversion, aggregate formulas)
│   │   ├── ratings_engine.py            (100-point Bayesian ratings engine)
│   │   ├── clustering_engine.py         (Cosine similarity & tactical cohorts)
│   │   ├── tournament_intelligence.py   (16 automated tournament insights)
│   │   └── llm_explainer.py             (Ollama client with deterministic fallback)
│   ├── auction/
│   │   ├── valuation_engine.py          (Base pricing, market valuations, scarcity multipliers)
│   │   └── live_auction_manager.py      (In-memory WebSocket auction state machine)
│   ├── database/
│   │   ├── models.py                    (SQLAlchemy ORM models: 11 tables)
│   │   └── db.py                        (SessionLocal and database engine)
│   ├── routers/
│   │   ├── overview.py                  (Summary KPIs, champions, season cards)
│   │   ├── players.py                   (Player directory & full profiles)
│   │   ├── analytics.py                 (Batting, bowling, all-rounder leaderboards & comparisons)
│   │   ├── insights.py                  (16 statistical insights & LLM explain endpoint)
│   │   ├── teams.py                     (Franchise statistics and head-to-head records)
│   │   ├── seasons.py                   (Cross-season comparisons)
│   │   ├── auction.py                   (Auction pool, teams, shortlists, WebSockets)
│   │   └── admin.py                     (Data quality, aliases, player creation, reimport)
│   ├── Dockerfile                       (Python 3.11-slim container)
│   └── main.py                          (FastAPI entry point with CORS & router mounts)
│
├── frontend/
│   ├── src/
│   │   ├── app/                         (14 Next.js App Router views)
│   │   │   ├── page.tsx                 (Overview Dashboard)
│   │   │   ├── players/page.tsx         (Player Directory)
│   │   │   ├── players/[id]/page.tsx    (Individual Player Profile)
│   │   │   ├── comparison/page.tsx      (Player Head-to-Head Comparison)
│   │   │   ├── similar-players/page.tsx (Similar Tactical Groups)
│   │   │   ├── analytics/batting/page.tsx (Batting Analytics)
│   │   │   ├── analytics/bowling/page.tsx (Bowling Analytics)
│   │   │   ├── analytics/all-rounders/page.tsx (All-Rounder Analytics)
│   │   │   ├── insights/page.tsx        (Tournament Insights & LLM Explainer)
│   │   │   ├── teams/page.tsx           (Franchise Records)
│   │   │   ├── seasons/page.tsx         (Multi-Season Comparison)
│   │   │   ├── auction/page.tsx         (Live Auction Room)
│   │   │   ├── shortlists/page.tsx      (Target Shortlists & Squad Builder)
│   │   │   └── admin/page.tsx           (Admin & Data Quality Portal)
│   │   ├── components/                  (Navbar, Footer, StatCard, RatingBadge)
│   │   └── lib/                         (api.ts client & TypeScript models)
│   ├── tailwind.config.js               (Strict 5-color palette configuration)
│   ├── Dockerfile                       (Node 20-alpine multi-stage build)
│   └── package.json                     (Next.js 14, React 18, Recharts, Lucide)
│
├── documentation/                       (Technical documentation and audit reports)
├── reports/                             (Extraction audit logs)
├── tests/
│   ├── test_cricket_analytics.py        (6 unit tests)
│   └── test_api_endpoints.py            (12 API integration tests)
├── docker-compose.yml                   (Multi-service compose file)
├── requirements.txt                     (Pinned Python dependencies)
├── pytest.ini                           (Pytest configuration)
└── README.md                            (Operational guide)
```

---

## 2. Database Schema & Row Counts

Verification performed directly on `data/database/epl_analytics.db`:

| Table Name | Description | Verified Row Count | Status |
| :--- | :--- | :---: | :--- |
| `matches` | Match-level metadata, toss, venue, results | **27** | Verified (9/season across 3 seasons) |
| `innings` | Regular and Super Over innings details | **56** | Verified (54 regular + 2 Super Over) |
| `batting_scorecards` | Individual batter match performance records | **312** | Verified |
| `bowling_scorecards` | Individual bowler match performance records | **277** | Verified |
| `players` | Canonical player registry with normalized identities | **73** | Verified |
| `player_aliases` | Name variations mapped to canonical player IDs | **161** | Verified |
| `auction_teams` | Franchise entities with 100L purse configurations | **6** | Verified |
| `auction_shortlists` | Target players shortlisted per franchise | **0** | Verified (Empty initially) |
| `auction_squad_members` | Players purchased during auction | **0** | Verified (Empty initially) |
| `auction_bid_audits` | Real-time audit log of all live bids | **0** | Verified (Empty initially) |
| `data_quality_audits` | System-generated extraction discrepancy notes | **8** | Verified |

---

## 3. Technology Stack & Runtime Verification

* **Python Virtual Environment**: Verified at `/Users/akshat/Document/Coding Project/venv`. Python 3.13.7.
* **Backend Server**: FastAPI 0.138.1 running on Uvicorn (`http://127.0.0.1:8000`). Status: Running.
* **Frontend Web Application**: Next.js 14.2.24 (App Router) on Node 20 (`http://localhost:3000`). Status: Running.
* **Automated Tests**: Pytest 9.2.0. Status: 18 passed.
