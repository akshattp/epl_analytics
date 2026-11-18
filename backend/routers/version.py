from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["Version & Changelog"])

CURRENT_VERSION = "1.1.0"
RELEASE_DATE = "2026-11-18"

RELEASES = [
    {
        "version": "1.1.0",
        "release_date": "2026-11-18",
        "date_source": "Confirmed (Current Build)",
        "codename": "Advanced Analytics, Exports & Full Auction Lifecycle",
        "summary": "Transforms EPL into a three-pillar sports intelligence suite with exact partnership and fielding analytics, the EPL Intelligence Lab, browser-rendered PDF reports, fixed sticky data tables, visual charts across all dashboards, and a complete pre-auction setup-to-results workflow.",
        "is_latest": True,
        "affected_modules": [
            "backend/database/models.py",
            "backend/ingestion/v1_1_migration.py",
            "backend/analytics/advanced_analytics.py",
            "backend/analytics/intelligence_lab.py",
            "backend/services/export_service.py",
            "backend/routers/version.py",
            "backend/routers/advanced_analytics.py",
            "backend/routers/exports.py",
            "backend/routers/auction_setup.py",
            "frontend/src/components/DataTable.tsx",
            "frontend/src/components/EplCharts.tsx",
            "frontend/src/app/changelog/page.tsx",
            "frontend/src/app/analytics/advanced/page.tsx",
            "frontend/src/app/intelligence-lab/page.tsx",
            "frontend/src/app/auction/page.tsx"
        ],
        "changes": {
            "New Features": [
                "Version management system with version indicator badge, 'What's New' indicator, and dedicated /changelog page.",
                "Complete Player Statistics Export in CSV, Excel (.xlsx), and PDF respecting active filters and sorting across the full dataset.",
                "Individual Player Profile PDF export rendered via headless Chromium (Playwright) preserving charts, tables, typography, and the 5-colour EPL palette.",
                "Shareable stable player profile URLs (/players/EPL-P-XXX) with read-only public profile mode (?public=1) and local-network awareness notice.",
                "EPL Intelligence Lab (/intelligence-lab) exploring 2-player and 3-player franchise combinations, winning patterns, and statistical discoveries with sample-size reliability safeguards.",
                "Complete Auction Setup Wizard (18 configurable parameters, team editor, player pool CRUD + CSV import, pre-auction preview, explicit START confirmation, Pause/Resume/Complete lifecycle, and Auction Results PDF/Excel export)."
            ],
            "Analytics Improvements": [
                "Recovered complete multi-line Fall of Wickets for 11 previously truncated innings directly from untouched historical CricHeroes PDFs.",
                "Reconstructed 252 exact wicket-by-wicket batting partnerships across all 56 innings with opening stand, wicket-wise, pair-wise, season-wise, and winning-match splits.",
                "Extracted 163 canonical fielding dismissals (catches, caught & bowled, direct run-outs, joint run-out assists, and stumpings) with admin manual entry support for future seasons.",
                "Added Advanced Batting Analytics (boundary %, team run share %, not-out frequency, scoring consistency, high-impact innings, wins vs losses splits) with explicit Data Availability Matrix.",
                "Added Advanced Bowling Analytics featuring directly verified Bowling Dot-Ball % (827 dot balls across 277 spells), opponent splits, economy progression, and best spells.",
                "Implemented Player Impact Model distinguishing correlation from causation.",
                "Expanded Player Comparison to support 2 or 3 players simultaneously with normalized radar charts."
            ],
            "Auction Improvements": [
                "Added persisted AuctionConfig and AuctionPoolEntry tables so auction settings, team purses, and active state survive backend restarts without resetting.",
                "Enforced configuration locking once an auction transitions to LIVE state.",
                "Added auction pause/resume, next-player queue management, and post-auction analytical reporting (most expensive, best-value buys vs historical valuation, squad strength breakdown)."
            ],
            "UI/UX Improvements": [
                "Fixed critical CSS specificity bug in globals.css (.table-editorial th) that previously rendered Deep Navy text on Deep Navy table headers.",
                "Built reusable DataTable component with opaque sticky headers, sticky first identifying columns, wrapped/tooltip column headings, sorting, search, pagination, and responsive horizontal scrolling applied across all application tables.",
                "Added interactive Recharts visual analytics across Overview, Player Profiles, Player Comparison, Teams, Advanced Analytics, and Intelligence Lab using strictly the five EPL brand colours."
            ],
            "Bug Fixes": [
                "Aligned LiveAuctionManager WebSocket event names (NEW_HIGHEST_BID, TIMER_UPDATED, PLAYER_SOLD) between FastAPI backend and Next.js frontend.",
                "Aligned /api/auth/accounts ('personas') and /api/auction/dashboard/{team_id} payload fields with the frontend auction portal."
            ],
            "Security Improvements": [
                "Added public read-only player profile mode (?public=1) guaranteeing private franchise shortlists, auction credentials, and admin actions are never exposed.",
                "Restricted Auction Setup Wizard mutations, CSV pool imports, manual fielding entries, and auction lifecycle start/pause/complete actions to authenticated auctioneer accounts."
            ],
            "Performance Improvements": [
                "Pre-computed and persisted partnerships and fielding_events in indexed SQLite tables rather than re-parsing PDFs or regex-scanning dismissals on every request.",
                "Added additive database indexes on match_id, innings_id, player_id, and season for sub-50ms analytical queries."
            ]
        }
    },
    {
        "version": "1.0.2",
        "release_date": "2026-11-17",
        "date_source": "Confirmed (Phase 2 Audit Documentation)",
        "codename": "Phase 2 Verification & Live Auction Hardening",
        "summary": "Introduced cryptographic authentication for the auctioneer and all six franchise owners, WebSocket token enforcement, owner intelligence dashboards, market scarcity analysis, and an in-memory AI auction simulator.",
        "is_latest": False,
        "affected_modules": [
            "backend/auth/security.py",
            "backend/routers/auth.py",
            "backend/auction/intelligence_service.py",
            "backend/auction/simulation_engine.py",
            "backend/routers/auction.py",
            "frontend/src/app/auction/page.tsx",
            "tests/test_auth_and_simulation.py"
        ],
        "changes": {
            "New Features": [
                "Owner Intelligence Dashboard API (/api/auction/dashboard/{team_id}) with squad strength breakdown and target recommendations.",
                "Market Scarcity Indicator API (/api/auction/scarcity/{player_id}) measuring remaining comparable unsold talent.",
                "In-Memory 6-Team AI Auction Simulation Engine (/api/auction/simulate) with zero database mutations."
            ],
            "Analytics Improvements": [
                "Re-verified all 9 core historical benchmarks directly against SQLite ground truth (Sagar Kapadia 138 combined / 134 regular runs, Smeet Shah 3.57 economy, 62/2 highest total, 30 lowest defended)."
            ],
            "Auction Improvements": [
                "Added Auctioneer UNDO nomination cancellation and dynamic countdown timer boost controls.",
                "Upgraded Live Auction frontend with persona switcher, live podium stage, countdown bar, and bid audit feed."
            ],
            "UI/UX Improvements": [
                "Added 4-tab layout on /auction combining Live Arena, Owner Dashboard, Valuation Catalog, and AI Sandbox."
            ],
            "Bug Fixes": [
                "Resolved Next.js production/dev .next build chunk collision and ensured clean production startup."
            ],
            "Security Improvements": [
                "Implemented PBKDF2-HMAC-SHA256 password hashing with salted digests and 24-hour bearer token sessions.",
                "Added mandatory WebSocket token authentication and franchise owner bid identity enforcement."
            ],
            "Performance Improvements": [
                "Verified zero database mutation guarantees on AI simulation runs and expanded automated test suite to 43 passing tests."
            ]
        }
    },
    {
        "version": "1.0.1",
        "release_date": "2026-11-17",
        "date_source": "Confirmed (Phase 1 Audit Changelog)",
        "codename": "Phase 1 Technical Audit & Statistical Corrections",
        "summary": "Independent audit of all 27 historical scorecards leading to Super Over segregation, orthogonalized 100-point Bayesian ratings, dynamic recalculation of all 16 tournament insights, and atomic auction bid locking.",
        "is_latest": False,
        "affected_modules": [
            "backend/services/player_service.py",
            "backend/analytics/ratings_engine.py",
            "backend/analytics/similarity_engine.py",
            "backend/analytics/insights_engine.py",
            "backend/auction/live_auction_manager.py",
            "tests/test_data_integrity.py",
            "tests/test_insights_recalculation.py"
        ],
        "changes": {
            "New Features": [
                "Created 13 comprehensive technical audit reports inside documentation/ covering data integrity, cricket math, ratings, similarity, insights, security, and QA."
            ],
            "Analytics Improvements": [
                "Segregated Super Over innings (innings_type == 'Super Over') from regular career leaderboards while preserving separate Super Over career records on player profiles.",
                "Replaced collinear rating inputs with orthogonal batting components (Volume 25, Velocity 40, Resistance 20, Boundary 15) and integrated harmonic all-rounder balance into overall_rating.",
                "Instituted playoff non-participant floor preventing zero-playoff players from receiving inflated clutch penalties.",
                "Corrected all 16 tournament insights to compute dynamically from verified SQLite records (fixing highest total 62/2, lowest defended 30, and Exotica Warriors 4 wins)."
            ],
            "Auction Improvements": [
                "Added asyncio.Lock() bid serialization, database purse checks, squad cap (8 players), and reserve fund rule enforcement ((unfilled - 1) × 2.0L)."
            ],
            "UI/UX Improvements": [
                "Verified zero hardcoded statistics in frontend components across all 14 Next.js pages."
            ],
            "Bug Fixes": [
                "Fixed SQLite HAVING clause aggregation bugs and corrected match win margin queries.",
                "Fixed uncredited runs audit verification strings in data quality tests."
            ],
            "Security Improvements": [
                "Backed up production SQLite database prior to structural audits and added persistent AuctionBidAudit logging."
            ],
            "Performance Improvements": [
                "Expanded automated regression suite from 18 to 36 passing tests."
            ]
        }
    },
    {
        "version": "1.0.0",
        "release_date": "2026-11-17",
        "date_source": "Estimated from Initial Project Delivery Documentation (Git repository not initialized)",
        "codename": "Initial EPL Analytics & Auction Intelligence Release",
        "summary": "Initial end-to-end launch transforming 27 historical CricHeroes PDF scorecards (EPL 2023–2025) into a full-stack FastAPI + Next.js cricket analytics and six-team auction intelligence platform.",
        "is_latest": False,
        "affected_modules": [
            "backend/ingestion/",
            "backend/database/",
            "backend/analytics/",
            "backend/routers/",
            "frontend/src/app/"
        ],
        "changes": {
            "New Features": [
                "Automated PDF extraction pipeline ingesting 27 historical CricHeroes match scorecards across EPL 2023, 2024, and 2025 (56 innings, 312 batting records, 277 bowling records).",
                "Canonical player master database resolving 161 raw scorecard name variants into 73 unique permanent Player IDs (EPL-P-001 through EPL-P-073).",
                "14-route Next.js 14 App Router web application featuring Overview, Player Directory, Player Profiles, Batting/Bowling/All-Rounder Analytics, Player Comparison, Similar Cohorts, Insights, Teams, Seasons, Auction, Shortlists, and Admin Portal.",
                "Deterministic + Ollama-assisted explainable insights engine."
            ],
            "Analytics Improvements": [
                "Implemented 100-point Bayesian player rating framework, 7 tactical player cohorts, and scarcity-adjusted auction valuations."
            ],
            "Auction Improvements": [
                "Configured six residential community franchises (100L standard purse, 8 max squad slots), private team watchlists, and initial WebSocket live auction state machine."
            ],
            "UI/UX Improvements": [
                "Established editorial five-colour EPL brand system (Midnight Black #02000D, Deep Navy #07203F, Warm Beige #EBDED4, Dusty Peach #D9AA90, Terracotta #A65E46)."
            ],
            "Bug Fixes": [],
            "Security Improvements": [
                "Preserved original historical ZIP archive and raw PDF scorecards untouched as immutable source of truth."
            ],
            "Performance Improvements": [
                "Initial 18 automated pytest verification tests covering API endpoints and core cricket math."
            ]
        }
    }
]


@router.get("/version")
def get_version_info():
    latest = RELEASES[0]
    return {
        "version": CURRENT_VERSION,
        "release_date": RELEASE_DATE,
        "codename": latest["codename"],
        "summary": latest["summary"],
        "total_releases": len(RELEASES),
        "changelog_url": "/changelog"
    }


@router.get("/changelog")
def get_changelog():
    return {
        "current_version": CURRENT_VERSION,
        "git_available": False,
        "provenance_note": "No local .git history was initialized in the project directory; release records are reconstructed strictly from verified source code, database migrations, and audit reports inside documentation/. Confirmed vs estimated dates are explicitly labelled per release.",
        "categories": [
            "New Features",
            "Analytics Improvements",
            "Auction Improvements",
            "UI/UX Improvements",
            "Bug Fixes",
            "Security Improvements",
            "Performance Improvements"
        ],
        "releases": RELEASES
    }
