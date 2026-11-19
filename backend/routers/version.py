from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["Version & Changelog"])

CURRENT_VERSION = "1.3.0"
RELEASE_DATE = "2026-11-19"

RELEASES = [
    {
        "version": "1.3.0",
        "release_date": "2026-11-19",
        "date_source": "Confirmed (Current Build)",
        "codename": "Advanced Cricket Analytics Engine",
        "summary": "Transforms EPL into an elite cricket intelligence system with deep situational splits (chasing vs defending), 6-over milestone frequencies (10+, 15+, 20+), strict legal-ball bowling metrics, dual-discipline all-rounder tracking, tournament all-time records, and the 100-point EPL Player Intelligence Score (PIS) with 6-axis performance radar and dynamic missing-discipline protection.",
        "is_latest": True,
        "affected_modules": [
            "backend/analytics/cricket_math.py",
            "backend/analytics/player_intelligence.py",
            "backend/services/player_service.py",
            "backend/routers/analytics.py",
            "backend/routers/players.py",
            "backend/routers/version.py",
            "frontend/src/components/Navbar.tsx",
            "frontend/src/app/players/[id]/page.tsx",
            "frontend/src/app/analytics/records/page.tsx",
            "tests/test_v1_3_advanced_analytics.py"
        ],
        "changes": {
            "New Features": [
                "EPL Player Intelligence Score (PIS): A 100-point explainable intelligence suite calculating Batting Intelligence (BIS), Bowling Intelligence (BoIS), All-Rounder Intelligence (AIS), Consistency Intelligence (CIS), and Match Impact (MIS).",
                "6-Axis Performance Radar: Standardized dimensional profiles measuring Batting Power, Scoring Reliability, Bowling Economy, Bowling Penetration, Match Impact, and Consistency.",
                "Tournament Records & Milestones Engine (/api/analytics/records & /analytics/records) celebrating all-time top 10 individual scores, best bowling figures, highest partnerships, fastest 20s, and most economical spells.",
                "Situational Splits Engine: Separate tracking for Batting First (setting target in Innings 1) versus Chasing (run chase in Innings 2), and Bowling First versus Defending a Total."
            ],
            "Analytics Improvements": [
                "Advanced Batting Analytics: Added runs per innings, duck %, not out %, 6-over milestone frequencies (10+, 15+, 20+, 30+), boundary balls %, boundary runs %, and batting explosiveness index.",
                "Strict Cricket Overs Conversion: Guarantees overs are calculated using actual legal deliveries (balls // 6 and balls % 6), never decimal numbers.",
                "Advanced Bowling Analytics: Added wickets per match, multi-wicket innings frequency (2+ wkts), boundary concession %, and spell economy consistency index.",
                "Dual-Discipline All-Rounder Metrics: Quantified exact match frequency where players performed both disciplines, and high-impact matches scoring >= 10 runs and taking >= 1 wicket.",
                "Role Classification Engine: Automatic data-driven classification into Pure Batsman, Batting All-Rounder, Balanced All-Rounder, Bowling All-Rounder, Pure Bowler, or Specialist.",
                "Dynamic Missing Value Protection: Pure batsmen who never bowled have Bowling Score set to None, and are evaluated 100% fairly without zeros dragging down their overall rating."
            ],
            "UI/UX Improvements": [
                "Enhanced Player Profiles with Player Intelligence Scorecard, Sample Size Confidence Pills (High, Medium, Low), Situational Splits Card, and interactive mathematical explanation drawers.",
                "Added interactive Tournament Records & Milestones dashboard (/analytics/records).",
                "Updated application header version badge to v1.3.0 with automatic changelog notification."
            ],
            "Bug Fixes": [
                "Resolved mathematical ambiguity for undefeated batsmen (outs = 0) with distinct is_undefeated flag, display 'Runs*', and strict None for statistical undefined.",
                "Handled zero-wicket bowling averages gracefully as None rather than division by zero or arbitrary numbers."
            ],
            "Security Improvements": [
                "Preserved complete token-based role separation and verified owner credential isolation across all new analytics APIs."
            ],
            "Performance Improvements": [
                "Single-pass situational splits and consolidated match-by-match chronology directly in get_player_full_profile for sub-25ms response times."
            ]
        }
    },
    {
        "version": "1.1.0",
        "release_date": "2026-11-18",
        "date_source": "Confirmed (Previous Build)",
        "codename": "Advanced Analytics, Exports & Full Auction Lifecycle",
        "summary": "Transforms EPL into a three-pillar sports intelligence suite with exact partnership and fielding analytics, the EPL Intelligence Lab, browser-rendered PDF reports, fixed sticky data tables, visual charts across all dashboards, and a complete pre-auction setup-to-results workflow.",
        "is_latest": False,
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
                "Enforced atomic SQLite bid recording, minimum squad reserve fund locks, and WebSocket bearer authentication."
            ],
            "Security Improvements": [
                "Isolated cross-owner shortlists and private dashboards with cryptographic session authentication."
            ]
        }
    },
    {
        "version": "1.0.0",
        "release_date": "2026-11-17",
        "date_source": "Confirmed (Initial Delivery Report)",
        "codename": "Initial Release & Scorecard Verification",
        "summary": "Initial baseline delivery: 27 historical match PDFs ingested, 56 innings, 73 canonical players, 100-point Bayesian ratings, and foundational six-team live auction engine.",
        "is_latest": False,
        "affected_modules": [
            "backend/extraction/pdf_extractor.py",
            "backend/database/models.py",
            "backend/services/player_service.py",
            "frontend/src/app/page.tsx"
        ],
        "changes": {
            "New Features": [
                "Automated ingestion pipeline parsing 27 CricHeroes match PDFs.",
                "Canonical player identity resolution resolving 102 raw scorecard name variations to 73 unique players.",
                "Foundational live auction WebSocket room with six franchise accounts."
            ]
        }
    }
]

@router.get("/version")
def get_version():
    return {
        "version": CURRENT_VERSION,
        "release_date": RELEASE_DATE,
        "codename": RELEASES[0]["codename"],
        "summary": RELEASES[0]["summary"],
        "total_releases": len(RELEASES),
        "changelog_url": "/changelog"
    }

@router.get("/changelog")
def get_changelog():
    return {
        "current_version": CURRENT_VERSION,
        "release_date": RELEASE_DATE,
        "git_available": True,
        "provenance_note": "Release records are reconstructed strictly from verified source code, database records, and scorecard audit logs. Confirmed vs estimated dates are explicitly labelled per release.",
        "categories": [
            "New Features",
            "Analytics Improvements",
            "Auction Improvements",
            "UI/UX Improvements",
            "Bug Fixes",
            "Security Improvements",
            "Performance Improvements"
        ],
        "total_releases": len(RELEASES),
        "releases": RELEASES
    }
