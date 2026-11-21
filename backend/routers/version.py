from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["Version & Changelog"])

CURRENT_VERSION = "2.0.1-dev"
RELEASE_DATE = "2026-11-19"

RELEASES = [
    {
        "version": "2.0.1-dev",
        "release_date": "2026-11-19",
        "date_source": "Active Development Sprint (2.0.1-dev)",
        "codename": "Luxury Creative Direction, 3D Match Ball & Website-Wide Visual Transformation",
        "summary": "Establishes a bold luxury colour identity (Obsidian #111318, Warm Ivory #F1EBDD, Electric Vermilion #FF4B35); creates a procedural Three.js 3D cricket match ball with physically raised Torus seam and 72 stitches; reconstructs the landing page with GSAP parallel scrolling; implements the Player Intelligence & Classification Rule Engine with Bayesian shrinkage and 73-player audit; transforms all operational routes into luxury editorial layouts; enforces permanent documentation governance.",
        "is_latest": True,
        "affected_modules": [
            "backend/analytics/classification_engine.py",
            "backend/analytics/ratings_engine.py",
            "backend/services/player_service.py",
            "backend/routers/players.py",
            "backend/routers/version.py",
            "frontend/src/app/page.tsx",
            "frontend/src/app/players/page.tsx",
            "frontend/src/app/players/[id]/page.tsx",
            "frontend/src/app/dashboard/page.tsx",
            "frontend/src/app/teams/page.tsx",
            "frontend/src/app/comparison/page.tsx",
            "frontend/src/app/auction/page.tsx",
            "frontend/src/components/Cricket3DScene.tsx",
            "frontend/src/components/HorizontalScrollDossiers.tsx",
            "frontend/src/components/Navbar.tsx",
            "frontend/src/components/EplBrandLogo.tsx",
            "frontend/src/components/CustomCursor.tsx",
            "frontend/src/components/PageCurlTransition.tsx",
            "frontend/src/components/StatCard.tsx",
            "frontend/src/components/EplCharts.tsx",
            "frontend/src/app/globals.css",
            "frontend/tailwind.config.js",
            "documentation/CHANGELOG.md",
            "documentation/VERSION_HISTORY.md",
            "documentation/RELEASE_REGISTER.md",
            "documentation/CURRENT_SYSTEM_INVENTORY.md",
            "documentation/UI_UX_CHANGELOG.md",
            "documentation/DESIGN_SYSTEM.md",
            "documentation/RELEASES/v2.0.1_release_notes.md",
            "documentation/PLAYER_CLASSIFICATION_AUDIT.md",
            "scripts/verify_documentation_governance.py",
            "tests/test_v2_0_1_governance_and_fixes.py",
            "tests/test_player_classification_engine.py"
        ],
        "changes": {
            "Bug Fixes": [
                "Resolved critical landing page bug where player runs and wickets displayed as zero due to missing nested career_batting and career_bowling objects in /api/players summary. Enriched backend player service to provide both flat and nested properties.",
                "Updated frontend binding logic to use fallback coalition (p.total_runs ?? p.career_batting?.total_runs ?? 0) across all landing and profile components.",
                "Resolved hero vertical whitespace defect (H1 at y: 167px instead of 391px) and replaced orphaned blue pulsing circular loader.",
                "Fixed All-Rounder over-classification defect in ratings engine (which previously assigned 37 players as All-rounders due to an unweighted fall-through default), reducing true all-rounders to 16 verified contributors."
            ],
            "New Features": [
                "Player Intelligence, Tagging & Classification Rule Engine (classification_engine.py): Decoupled experience tiers (Emerging, Developing, Established, Proven), independent batting/bowling evidence thresholds, statistical confidence scores (HIGH, MEDIUM, LOW, VERY LOW), and Bayesian shrinkage towards league replacement baseline (mu = 30.0).",
                "Controlled Vocabulary Performance Tags: 10 strictly audited performance tags with clear qualification gates and human-readable tooltips.",
                "Player Classification Audit Route (/api/players/classification-audit) and comprehensive 73-player audit documentation.",
                "Procedural 3D WebGL Cricket Match Ball (Cricket3DScene.tsx): Interactive Three.js sphere with leather bump map, physically raised Torus seam, 72 criss-cross cotton relief stitches, 3-point stadium lighting, cursor lerping, and scroll scrubbing.",
                "Parallel Scrolling Experience on Landing Page (ParallelScrollColumns.tsx & HorizontalScrollDossiers.tsx): Opposing-direction column kinetics and pinned horizontal player dossiers driven by GSAP ScrollTrigger.",
                "Permanent Documentation Governance: Automated verification script (scripts/verify_documentation_governance.py) validating all 7 governance files."
            ],
            "UI/UX Improvements": [
                "Bold Luxury Colour Identity: Obsidian (#111318), Warm Ivory (#F1EBDD), Electric Vermilion (#FF4B35) disciplined to ~10% visual presence.",
                "Website-Wide Visual Transformation: Completely refactored /players, /players/[id], /dashboard, /teams, /comparison, and /auction into luxury editorial layouts.",
                "Compacting Glass Navigation: Scroll-responsive navbar height reduction (h-16 to h-14), backdrop blur, and vermilion dot active indicators.",
                "3D Page-Curl Sheet Transition with vermilion foil edge highlight and custom magnetic desktop cursor."
            ],
            "Security Improvements": [
                "Verified zero leakage of private franchise credentials or auction secrets across all components."
            ],
            "Performance Improvements": [
                "IntersectionObserver auto-pauses Three.js rendering when offscreen (0% idle CPU consumption).",
                "Optimized scroll listeners with passive transforms and hardware-accelerated transforms to eliminate main-thread jank."
            ]
        }
    },
    {
        "version": "2.0.0",
        "release_date": "2026-11-19",
        "date_source": "Confirmed (Signature Release Commit ab69371)",
        "codename": "Signature Design Experience",
        "summary": "Transformed EPL from an AI-generated dashboard into an award-worthy digital experience with a custom geometric vector brand identity, 3D Page-Curl theme transition, custom desktop magnetic cursor, initial cinematic landing page, and athlete performance dossier profile.",
        "is_latest": False,
        "affected_modules": [
            "frontend/src/components/EplBrandLogo.tsx",
            "frontend/src/components/PageCurlTransition.tsx",
            "frontend/src/components/CustomCursor.tsx",
            "frontend/src/components/AnimatedCounter.tsx",
            "frontend/src/app/page.tsx",
            "frontend/src/app/dashboard/page.tsx",
            "frontend/src/app/players/[id]/page.tsx",
            "frontend/public/favicon.svg"
        ],
        "changes": {
            "New Features": [
                "Bespoke EPL Geometric Crest & Logo System (EplBrandLogo.tsx) featuring three kinetic stump pillars, aerodynamic ribbons tracing 'EPL', and precision apex sensor.",
                "Signature 3D Page-Curl Theme Transition (PageCurlTransition.tsx) simulating a folded glossy page reveal when toggling light/dark themes.",
                "Desktop Custom Interactive Cursor (CustomCursor.tsx) with spring follower and 'VIEW' label expansion.",
                "Cinematic Landing Page (/) and preserved operational dashboard at (/dashboard)."
            ],
            "UI/UX Improvements": [
                "Transformed player profiles into Athlete Performance Dossiers with oversized typography, custom initials monogram crest, and 6-over milestone grid."
            ]
        }
    },
    {
        "version": "1.5.0",
        "release_date": "2026-11-19",
        "date_source": "Reconstructed from Git history (commit 6e434ef)",
        "codename": "Global Dual-Theme Redesign & Bold Editorial Typography",
        "summary": "Historically implemented — reconstructed from Git history. Introduced Light and Dark dual-theme switch with CSS variables, Space Grotesk display typography, Inter body font, electric blue and laser cyan brand palette, and comprehensive redesign of all 19 application routes.",
        "is_latest": False,
        "affected_modules": [
            "frontend/src/lib/theme.tsx",
            "frontend/src/app/globals.css",
            "frontend/tailwind.config.js",
            "frontend/src/components/Navbar.tsx",
            "frontend/src/components/EplCharts.tsx"
        ],
        "changes": {
            "New Features": [
                "Dual-Theme Switcher (Light and Dark) with localStorage persistence and CSS custom properties.",
                "Space Grotesk Google Font integration for high-contrast architectural headings."
            ],
            "UI/UX Improvements": [
                "Replaced generic brown/beige styling with high-contrast Midnight Black (#02000D), Deep Navy (#07203F), Electric Blue (#2563EB), and Cyan (#0891B2)."
            ]
        }
    },
    {
        "version": "1.4.0",
        "release_date": "2026-11-19",
        "date_source": "Reconstructed from Git history (commit c2a0b9a)",
        "codename": "Premium Dark Sports Intelligence Modernization",
        "summary": "Historically implemented — reconstructed from Git history. Upgraded the entire platform to a unified dark sports analytics theme with modernized card styling, high-contrast tables, and enhanced data visualizations.",
        "is_latest": False,
        "affected_modules": [
            "frontend/src/app/globals.css",
            "frontend/src/components/DataTable.tsx",
            "frontend/src/app/analytics/*/page.tsx"
        ],
        "changes": {
            "UI/UX Improvements": [
                "System-wide visual modernization across all analytics dashboards.",
                "Added high-contrast borders and elevated card surfaces for low-light legibility."
            ]
        }
    },
    {
        "version": "1.3.0",
        "release_date": "2026-11-19",
        "date_source": "Confirmed (Official Release)",
        "codename": "Advanced Cricket Analytics Engine",
        "summary": "Transforms EPL into an elite cricket intelligence system with deep situational splits (chasing vs defending), 6-over milestone frequencies (10+, 15+, 20+), strict legal-ball bowling metrics, dual-discipline all-rounder tracking, tournament all-time records, and the 100-point EPL Player Intelligence Score (PIS) with 6-axis performance radar.",
        "is_latest": False,
        "affected_modules": [
            "backend/analytics/cricket_math.py",
            "backend/analytics/player_intelligence.py",
            "backend/services/player_service.py",
            "backend/routers/analytics.py",
            "backend/routers/players.py",
            "backend/routers/version.py",
            "frontend/src/app/analytics/records/page.tsx",
            "tests/test_v1_3_advanced_analytics.py"
        ],
        "changes": {
            "New Features": [
                "100-point EPL Player Intelligence Score (PIS) covering BIS, BoIS, AIS, CIS, and MIS.",
                "6-Axis Performance Radar Chart data model.",
                "Tournament All-Time Records & Milestones Engine (/api/analytics/records).",
                "Situational Splits (Target Setting in 1st Innings vs Chasing in 2nd Innings)."
            ],
            "Analytics Improvements": [
                "Strict legal-ball overs conversion (balls // 6 and balls % 6).",
                "6-over milestone frequencies (10+, 15+, 20+ runs; 2+ wickets).",
                "Dynamic missing value protection for pure batsmen/bowlers."
            ]
        }
    },
    {
        "version": "1.2.0",
        "release_date": "2026-11-18",
        "date_source": "Confirmed (Acceptance Test Release)",
        "codename": "System Acceptance & Concurrency Hardening",
        "summary": "Complete 6-team live auction rehearsal, single-tunnel ngrok gateway, token-based role separation, zero credential leakage verification, and database corruption recovery procedure.",
        "is_latest": False,
        "affected_modules": [
            "backend/auction/live_auction_manager.py",
            "backend/auth/security.py",
            "scripts/gateway.mjs",
            "tests/test_v1_2_acceptance_rehearsal.py"
        ],
        "changes": {
            "Security Improvements": [
                "Owner authentication isolation with zero secret leakage in public payloads.",
                "Multi-client WebSocket locking preventing concurrent over-budget bids."
            ],
            "New Features": [
                "Unified single-tunnel Node.js gateway (port 8080) routing both frontend and backend."
            ]
        }
    },
    {
        "version": "1.1.0",
        "release_date": "2026-11-18",
        "date_source": "Confirmed (Product Enhancement Release)",
        "codename": "Advanced Analytics, Exports & Full Auction Lifecycle",
        "summary": "Transforms EPL into a three-pillar sports intelligence suite with exact partnership and fielding analytics, the EPL Intelligence Lab, browser-rendered PDF reports, fixed sticky data tables, visual charts across all dashboards, and a complete pre-auction setup-to-results workflow.",
        "is_latest": False,
        "affected_modules": [
            "backend/database/models.py",
            "backend/ingestion/v1_1_migration.py",
            "backend/analytics/advanced_analytics.py",
            "backend/analytics/intelligence_lab.py",
            "backend/services/export_service.py",
            "frontend/src/app/changelog/page.tsx",
            "frontend/src/app/intelligence-lab/page.tsx",
            "frontend/src/app/auction/page.tsx"
        ],
        "changes": {
            "New Features": [
                "Wicket-by-wicket partnership reconstruction across all 56 innings.",
                "Canonical fielding events extraction (163 dismissals).",
                "PDF, Excel, and CSV player and auction results export engine.",
                "EPL Intelligence Lab for combination discovery."
            ]
        }
    },
    {
        "version": "1.0.2",
        "release_date": "2026-11-17",
        "date_source": "Confirmed (Phase 2 Audit Documentation)",
        "codename": "Phase 2 Verification & Live Auction Hardening",
        "summary": "Introduced cryptographic authentication for the auctioneer and all six franchise owners, WebSocket token enforcement, owner intelligence dashboards, and in-memory AI auction simulator.",
        "is_latest": False,
        "affected_modules": [
            "backend/auth/security.py",
            "backend/routers/auth.py",
            "backend/auction/intelligence_service.py",
            "backend/auction/simulation_engine.py"
        ],
        "changes": {
            "New Features": [
                "Owner Intelligence Dashboard API and Market Scarcity Indicator.",
                "In-Memory 6-Team AI Auction Simulation Engine."
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
        "provenance_note": "Release records are reconstructed strictly from verified source code, Git history, database records, and scorecard audit logs. Confirmed vs historically reconstructed versions are explicitly labelled per release.",
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
