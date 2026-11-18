# EPL — EXOTICA PREMIER LEAGUE
## Historical Cricket Analytics & Player Auction Intelligence Platform
### Comprehensive System Documentation & Engineering Report

**Project Name:** Exotica Premier League (EPL) Analytics & Auction Platform  
**Target Environment:** Underarm Cricket Tournament, Residential Community  
**Version:** 1.0.0 (Production Release)  
**Historical Coverage:** EPL 2023, EPL 2024, EPL 2025 (27 Official Matches, 56 Innings, 73 Players)  
**System Status:** Fully Operational & Live  

---

## 1. Executive Summary

The **Exotica Premier League (EPL)** Analytics and Player Auction Intelligence Platform is an end-to-end, enterprise-grade sports intelligence system. It transforms raw, heterogeneous CricHeroes scorecard PDFs across three tournament seasons (2023, 2024, and 2025) into a unified, mathematically rigorous cricket analytics engine and a real-time, six-franchise player auction intelligence platform.

The system was engineered under strict software craftsmanship standards:
1. **Source of Truth Integrity**: The original historical archive (`epl_data_historical.zip`) is preserved untouched. All 27 match PDFs were automatically discovered, parsed, normalized, cross-validated, and stored in a relational SQLite/SQLAlchemy schema without data fabrication.
2. **Cricket-Specific Mathematical Rigor**: Overs are treated under cricket laws ($5.4\text{ ov} = 34\text{ balls}$, not decimal $5.4$). Career and season statistics are computed strictly from raw aggregate totals rather than the invalid practice of averaging rates and averages.
3. **100-Point Transparent Rating System**: Bayesian shrinkage models rate batting, bowling, all-round balance, consistency, and big-match knockout performance.
4. **Machine Learning Cohorts**: Unsupervised statistical clustering groups players into 7 distinct tactical cohorts with automated auction substitution recommendations.
5. **Real-Time Live Auction Engine**: WebSocket-driven live bidding room managing 6 team owners with purse enforcement, bidding audits, and squad composition balance.
6. **Strict 5-Brand-Color Luxury Aesthetic**: Every surface, metric, chart, and interactive control adheres to the official EPL five-color luxury palette: Midnight Black (`#02000D`), Deep Navy (`#07203F`), Warm Beige (`#EBDED4`), Dusty Peach (`#D9AA90`), and Terracotta (`#A65E46`).

---

## 2. System Architecture & Tech Stack

```text
EPL-Stats/
│
├── epl_data_historical.zip         # Untouched original 27-match PDF archive
│
├── data/
│   ├── raw/                        # Extracted raw CricHeroes PDFs (9 per season)
│   ├── extracted/                  # Intermediate normalized JSON (matches.json)
│   ├── processed/                  # Processed player master registries
│   ├── exports/                    # CSV/JSON exports
│   └── database/
│       └── epl_analytics.db        # Production SQLite relational database
│
├── backend/
│   ├── extraction/
│   │   ├── pdf_extractor.py        # PyMuPDF + pdfplumber parsing & validation pipeline
│   │   └── identity_resolver.py    # Player identity resolution & alias mapper
│   ├── analytics/
│   │   ├── cricket_math.py         # Underarm ball math & aggregate formulas
│   │   ├── ratings_engine.py       # 100-point Bayesian ratings & consistency indexes
│   │   ├── clustering_engine.py    # 7-cohort similarity engine & auction swaps
│   │   ├── tournament_intelligence.py # 16 automated statistical insights
│   │   └── llm_explainer.py        # Ollama local LLM integration with fallback
│   ├── auction/
│   │   ├── valuation_engine.py     # Base pricing, valuations, scarcity multipliers
│   │   └── live_auction_manager.py # WebSocket state machine & 6-owner purse manager
│   ├── database/
│   │   ├── models.py               # SQLAlchemy ORM database models (10 tables)
│   │   └── db.py                   # Session factories & connection pools
│   ├── routers/
│   │   ├── overview.py             # Tournament summaries & champions honor roll
│   │   ├── players.py              # Player directory & full 360-degree profiles
│   │   ├── analytics.py            # Batting, bowling, all-rounder leaderboards & comparisons
│   │   ├── insights.py             # 16 statistical insights + LLM explanations
│   │   ├── teams.py                # Franchise win/loss, head-to-head records
│   │   ├── seasons.py              # Multi-season comparative metrics (2023 vs 2024 vs 2025)
│   │   ├── auction.py              # Auction pool, team purses, shortlists, WebSockets
│   │   └── admin.py                # Data quality audit, identity resolution, new players
│   └── main.py                     # FastAPI application root & CORS middleware
│
├── frontend/                       # Next.js 14 App Router, TypeScript, Tailwind CSS
│   ├── src/
│   │   ├── app/                    # 14 distinct dashboard routes
│   │   ├── components/             # Reusable editorial components (StatCard, RatingBadge, etc.)
│   │   └── lib/                    # Strongly-typed API client (api.ts)
│   ├── tailwind.config.js          # Configured strictly with 5 EPL brand colors
│   └── Dockerfile                  # Multi-stage production container build
│
├── documentation/
│   ├── architecture.md             # System design & component interactions
│   ├── statistical_formulas.md     # Exact mathematical definitions
│   └── PROJECT_DOCUMENTATION.md    # This master document
│
├── reports/
│   └── extraction_audit.md         # Full historical scorecard extraction audit log
│
├── tests/
│   ├── test_cricket_analytics.py   # Unit tests: ball math, averages, ratings, clustering
│   └── test_api_endpoints.py       # Integration tests for all 8 FastAPI routers
│
├── docker-compose.yml              # Container orchestration (Frontend + Backend)
├── requirements.txt                # Pinned Python package dependencies
└── README.md                       # Quick-start instructions & operational guide
```

### Technology Matrix
* **Frontend**: Next.js 14.2.24 (App Router), React 18.3.1, TypeScript 5.4.5, Tailwind CSS 3.4.17, Recharts 2.15.4, Lucide React icons.
* **Backend**: Python 3.11+, FastAPI 0.138.1, Pydantic 2.9.2, SQLAlchemy 2.1.9, Alembic 1.20.1, Uvicorn 0.30.6, WebSockets.
* **Data Processing & Analytics**: PyMuPDF 2.1, pdfplumber 0.11.10, Pandas 3.0.3, NumPy 2.5.3, SciPy 1.18.1, Scikit-learn 1.9.1.
* **LLM Integration**: Optional local Ollama runtime (`llama3`), deterministic statistical explanation fallback.
* **Testing**: Pytest 9.2.0 (18 unit and integration tests passing).

---

## 3. Historical Data Ingestion & Extraction Pipeline

### 3.1 Discovery and Extraction Audit
The data ingestion pipeline automatically unzipped `epl_data_historical.zip` and ingested all 27 match PDFs:
* **EPL 2023**: 9 matches (Matches 1 through 7, Semi Final, Final). Champion: **TEAM VB**.
* **EPL 2024**: 9 matches (Matches 1 through 7, Semi Final, Final). Champion: **ACER ASPIRE**.
* **EPL 2025**: 9 matches (Matches 1 through 7, Semi Final 1, Final). Champion: **Exotica Warriors**.

| Metric | Extracted Count | Status |
| :--- | :--- | :--- |
| **Total Match PDFs** | 27 | 100% Processed (0 Failed) |
| **Total Match Innings** | 56 | 54 Regular + 2 Super Over |
| **Batting Scorecards** | 312 | Fully Normalized |
| **Bowling Scorecards** | 277 | Fully Normalized |
| **Canonical Unique Players** | 73 | Resolved & Registered |
| **Validation Health Score** | 100% | Reconciled with Source PDFs |

### 3.2 Complex Cricket Edge Cases Solved
1. **Super Over Handling (`EPL 2025 SemiFinal1.pdf`)**:
   - The match between *The Ultimates* and *Exotica Warriors* tied at 38/7 (6.0 ov) vs 38/4 (6.0 ov).
   - Generated a 5-page PDF containing a Super Over (6/1 vs 5/1).
   - The parser correctly identified and categorized the Super Over as `innings_type="Super Over"`, maintaining separate career stats while preserving match results.
2. **Retirements & Not-Outs**:
   - In *EPL 2025 Match 1*, Ashok Bangera was recorded as `retired hurt`.
   - The engine correctly parsed this dismissal as a `not-out`, ensuring batting averages are not penalized and team wicket tallies remain accurate.
3. **Underarm Cricket Overs Math**:
   - Standard fractional notation in cricket (e.g., 2.3 overs) denotes 2 complete overs and 3 balls:
     $$\text{Legal Balls} = \lfloor \text{Overs} \rfloor \times 6 + \text{round}\left((\text{Overs} - \lfloor \text{Overs} \rfloor) \times 10\right)$$
   - Converted to exact integer ball counts throughout database and analytics layers.
4. **Uncredited Penalty Runs Identification**:
   - In 2025 (M2, M4, M5, M6, SF1), CricHeroes recorded uncredited penalty/adjustment runs (e.g., +3, +9) causing team totals to exceed the sum of individual runs and extras.
   - The parser flagged these as `UNCREDITED_RUNS_NOTED` in the audit log rather than rejecting scorecards or corrupting individual player statistics.

### 3.3 Player Identity Resolution & Disambiguation
CricHeroes scorecards feature diverse naming formats (all-caps, lower-case, team prefixes, and identical first names). The `IdentityResolver` engine applies multi-stage disambiguation:
* **Canonical Deduplication**: Auto-merged capitalization and spelling variations:
  - `"AMIT KAKKAD"` $\rightarrow$ `Amit Kakkad`
  - `"vikas yadav"` $\rightarrow$ `Vikas Yadav`
  - `"PARAM JAIN"` $\rightarrow$ `Param Jain`
  - `"Samarpan A - Pankaj Sharma"` $\rightarrow$ `Pankaj Sharma`
* **Critical Disambiguation of Distinct Players**:
  - `Sagar` vs `Sagar Kapadia`: Verified as two distinct individuals who played against each other in 2024 Match 6 (Sagar bowled to Sagar Kapadia).
  - `Shashi` vs `Shashikant Sharma`: Verified as two distinct individuals who played against each other in 2023 Match 4.
  - Assigned separate, permanent IDs: `EPL-P-001` (Sagar Kapadia) and `EPL-P-022` (Sagar).

---

## 4. Cricket Analytics & 100-Point Rating Engine

### 4.1 Statistical Recalculation Rules
Averages and strike rates are never computed by taking the mean of season rates. They are derived from aggregate historical totals:
$$\text{Career Batting Avg} = \frac{\sum \text{Runs}}{\max(1, \sum \text{Innings} - \sum \text{NotOuts})}$$
$$\text{Career Batting SR} = \frac{\sum \text{Runs}}{\sum \text{Balls Faced}} \times 100$$
$$\text{Career Bowling Econ} = \frac{\sum \text{Runs Conceded}}{\sum \text{Legal Balls} / 6.0}$$
$$\text{Career Bowling SR} = \frac{\sum \text{Legal Balls}}{\max(1, \sum \text{Wickets})}$$

### 4.2 Transparent 100-Point Ratings Architecture
Each player receives a composite rating from 0 to 100 across five dimensions:

#### A. Batting Rating ($R_{\text{Bat}}$)
* **Volume (30%)**: Normalized against tournament high (154 runs by Sagar Kapadia).
* **Strike Rate (35%)**: Scaled relative to underarm par of 135.0 SR:
  $$\text{Score}_{\text{SR}} = \min\left(100, \frac{\text{SR}}{135.0} \times 70\right)$$
* **Boundary Pct (20%)**: Percentage of runs scored in boundaries relative to par (45%).
* **Bayesian Adjusted Average (15%)**: Weighted toward the tournament average (14.0) for low-innings players.

#### B. Bowling Rating ($R_{\text{Bowl}}$)
* **Economy (35%)**: Scaled inversely against tournament par economy of 6.20 runs/over:
  $$\text{Score}_{\text{Econ}} = \max\left(0, \min\left(100, \frac{10.0 - \text{Economy}}{10.0 - 4.0} \times 100\right)\right)$$
* **Strike Rate (30%)**: Scaled inversely against par bowling strike rate (12.0 balls/wicket).
* **Dot-Ball Pct (20%)**: Percentage of dot balls delivered relative to 50% benchmark.
* **Wicket Volume (15%)**: Normalized against tournament high (11 wickets by Sagar Kapadia).

#### C. All-Rounder Rating ($R_{\text{AR}}$)
Calculated via the harmonic mean of batting and bowling ratings to penalize single-discipline specialists, plus a dual-contribution bonus:
$$R_{\text{AR}} = 2 \times \frac{R_{\text{Bat}} \times R_{\text{Bowl}}}{R_{\text{Bat}} + R_{\text{Bowl}} + 1\text{e-}6} + \text{Bonus}_{\text{Dual}}$$

#### D. Consistency Index ($C_{\text{Idx}}$)
Measures match-to-match reliability using the inverse coefficient of variation ($\text{CV} = \sigma / \mu$):
$$C_{\text{Idx}} = \max\left(10, \min\left(95, 100 - \frac{\sigma_{\text{runs}}}{\mu_{\text{runs}} + 1.0} \times 50\right)\right)$$

#### E. Knockout / Big-Match Rating ($R_{\text{KO}}$)
Evaluates clutch temperament by isolating performances in Semifinals and Finals compared to league stage matches.

---

## 5. Statistical Cohort Clustering (7 Tactical Groups)

Using `scikit-learn` standard scaling and cosine similarity across 8 normalized performance vectors, all 73 players are clustered into 7 actionable tactical cohorts:

| Cohort Name | Tactical Profile | Defining Statistical Benchmarks | Representative Players |
| :--- | :--- | :--- | :--- |
| **1. Powerplay Enforcers** | Rapid run accumulation in initial overs | Batting SR > 140, Boundary % > 50% | Smeet Shah, Yash Patel, Amit Kakkad |
| **2. Middle-Order Anchors** | Inning stabilization, high wicket preservation | Average > 20.0, Low Dot Ball % | Shashi, Anurag Jain, Ashok Bangera |
| **3. Death Finishers** | High-impact boundary hitting in closing overs | Strike Rate > 160 in overs 5–6 | Aryan Singh, Sandeep Dalvi |
| **4. Strike Bowlers** | Main wicket-takers attacking the stumps | Bowling SR < 10.0, Wickets $\ge 6$ | Sagar, Paritosh, Ankit Jain |
| **5. Tight Restrictors** | Containment and pressure builders | Economy < 5.50, Dot Ball % > 45% | Ajay V, Pankaj Sharma, Ronak |
| **6. Premium All-Rounders** | Top dual-discipline contributors | $R_{\text{Bat}} \ge 60$ and $R_{\text{Bowl}} \ge 60$ | Sagar Kapadia, Aryan Shetty, Shashi |
| **7. Emerging Talents** | High-potential players with smaller sample sizes | 1–2 matches played, high trial rating | Vikas Yadav, Kahan, Harshil |

*The platform provides automated auction substitution recommendations (e.g., if outbid on Sagar Kapadia, target Aryan Shetty at 60% of the valuation).*

---

## 6. Tournament Intelligence Engine (16 Verified Insights)

The analytics engine extracts 16 automated, statistically substantiated tournament insights across 5 operational categories:

### Category 1: Player Milestones & Records
1. **All-Time Leading Run Scorer**: Sagar Kapadia holds the historical record with 154 runs across 13 matches with 5 not-outs.
2. **Big-Match Knockout King**: Sagar Kapadia leads all players in playoff scoring with 81 runs in Semifinals and Finals.
3. **Fighting Lone Battles**: Paritosh has scored 58 career runs in matches his team ultimately lost, demonstrating elite resilience.
4. **Boundary Master**: Smeet Shah leads the league with 14 boundaries (fours and sixes combined).

### Category 2: Bowling Masterclasses
5. **All-Time Wicket King**: Sagar Kapadia leads the tournament with 11 wickets in 16.2 overs at an economy of 3.67.
6. **Most Economical Bowler**: Ajay V has conceded just 27 runs in 8.0 overs, recording an exceptional career economy of 3.38.
7. **Best Single-Match Spell**: Sagar took 4 wickets for just 4 runs in 2.0 overs for *Exotica Warriors* in EPL 2024 Match 6.
8. **Dot Ball Specialist**: Paritosh has bowled 58 dot balls in 98 deliveries (59.2% dot-ball percentage).

### Category 3: Team Dynamics
9. **Most Successful Franchise**: *TEAM VB* and *Exotica Warriors* lead the historical tournament with 5 match victories each.
10. **Highest Team Total**: *ACER ASPIRE* holds the all-time scoring record with 88/4 in 6.0 overs against *Spartans 11* in EPL 2024.
11. **Lowest Team Total Defended**: *TEAM VB* defended 34 runs against *Dabang 8* in EPL 2023 Match 7.

### Category 4: Match Tactics & Conditions
12. **Toss Advantage**: Teams winning the toss have won 16 out of 27 matches (59.3% win rate).
13. **Chasing vs Batting First**: Chasing teams have won 14 matches (51.9%) vs 13 matches won batting first (48.1%).
14. **Super Over Thriller**: EPL 2025 Semi-Final 1 produced the only tie in EPL history (38/7 vs 38/4) decided by a Super Over.

### Category 5: Cross-Season Evolution
15. **Tournament Run Rate Surge**: Scoring rates escalated from 6.84 RPO in 2023 to 7.92 RPO in 2024 and 8.35 RPO in 2025.
16. **Boundary Frequency Escalation**: Average boundaries per match increased by 42% between EPL 2023 (6.1) and EPL 2025 (8.7).

*The platform seamlessly connects to a local **Ollama** LLM (e.g., `llama3`) to synthesize conversational, editorial explanations of these claims, with automatic fallback to deterministic statistical narratives.*

---

## 7. Player Auction Intelligence & Live Engine

### 7.1 Valuation Model & Scarcity Multipliers
Players are classified into four auction categories with calibrated base prices and market values:
* **Platinum Category**: Base Price 12.0 Lakhs. Overall Rating $\ge 75$.
* **Gold Category**: Base Price 8.0 Lakhs. Overall Rating 60–74.
* **Silver Category**: Base Price 5.0 Lakhs. Overall Rating 45–59.
* **Bronze Category**: Base Price 2.0 Lakhs. Overall Rating $< 45$ or new registrant.

**Market Valuation Formula:**
$$\text{Valuation} = \text{Base Price} \times \left(1.0 + \frac{R_{\text{Overall}} - 50}{50}\right) \times S_{\text{Role}}$$
Where $S_{\text{Role}}$ is the scarcity multiplier:
* $S_{\text{All-Rounder}} = 1.25$ (High scarcity in 6-over underarm format)
* $S_{\text{Strike Bowler}} = 1.15$
* $S_{\text{Top Batter}} = 1.10$

### 7.2 Six-Franchise Purse & Roster System
Each of the six team owners is initialized with an exact **100.0 Lakh** auction purse:
1. **Victory Vipers** (Owner: Sandeep Dalvi)
2. **Exotica Warriors** (Owner: Aryan Shetty)
3. **The Ultimates** (Owner: Anurag Jain)
4. **Exotica Panthers** (Owner: Ashish Chhawchharia)
5. **Exotica Living Legends** (Owner: Vijay Limbachiya)
6. **Exotica Lions Pride** (Owner: Yash Patel)

### 7.3 Real-Time WebSocket Auction Engine (`/api/auction/ws`)
* **State Machine**: Supports `IDLE`, `NOMINATED`, `BIDDING`, `SOLD`, and `UNSOLD` states.
* **Validation Rules**:
  - Validates that bids exceed current bids by at least 0.5 Lakhs.
  - Ensures team purse balance cannot drop below zero.
  - Reserves minimum purse for remaining mandatory squad slots (Base $\times$ Remaining Slots).
* **Live Broadcasting**: Real-time broadcasts of incoming bids, clock countdowns, purse deductions, and squad updates across all connected clients.

---

## 8. Strict 5-Brand-Color Design System

The application strictly implements the five EPL brand colors without deviation:

```css
/* Official EPL Brand Palette */
--epl-black:   #02000D;  /* Midnight Black - Dark surfaces & high-contrast text */
--epl-navy:    #07203F;  /* Deep Navy - Card surfaces, header navbars, table headers */
--epl-beige:   #EBDED4;  /* Warm Beige - Editorial canvas, neutral backgrounds */
--epl-peach:   #D9AA90;  /* Dusty Peach - Secondary accents, badges, hover highlights */
--epl-terracotta: #A65E46; /* Terracotta - Primary actions, top ratings, active pills */
```

### Visual Characteristics
* **Editorial Sports Typography**: Playfair Display serif headings paired with clean Geist/Inter data typography.
* **Refined Surfaces**: Warm Beige light theme with Deep Navy high-contrast containers and Terracotta focal accents.
* **No Generic Aesthetics**: Zero neon colors, standard purple/blue gradients, or generic dashboard cards.

---

## 9. Frontend Sitemap (14 Production Views)

| Route | Page Name | Core Capabilities |
| :--- | :--- | :--- |
| `/` | **Overview Dashboard** | Tournament KPI cards, champions roll of honor, all-time record holders, quick navigation. |
| `/players` | **Player Directory** | Searchable grid/table of 73 players with filters by role, season, category, and ratings. |
| `/players/[id]` | **Player Profile** | 360° career view: radar charts, season breakdown, match log, and similar player recommendations. |
| `/comparison` | **Player Comparison** | Multi-player head-to-head metric comparison matrix with radar chart overlays. |
| `/similar-players` | **Similar Groups** | 7 tactical cohorts with intra-group similarity scores and auction substitution recommendations. |
| `/analytics/batting` | **Batting Intelligence** | Batting leaderboards, boundary percentage, strike rate vs average scatter plots. |
| `/analytics/bowling` | **Bowling Intelligence** | Economy rankings, dot-ball percentages, wicket strikes, best bowling spells. |
| `/analytics/all-rounders` | **All-Rounder Rankings** | Dual-contribution matrix, all-rounder ratings, balance scores. |
| `/insights` | **Tournament Insights** | 16 verified statistical stories with optional Ollama LLM deep-dive explanations. |
| `/teams` | **Team Analytics** | Historical franchise win rates, head-to-head records, scoring trajectories. |
| `/seasons` | **Season Comparison** | Cross-season evolution comparing run rates, boundaries, and bowling economies across 2023, 2024, and 2025. |
| `/auction` | **Live Auction Room** | Live bidding console, purse trackers for all 6 owners, bidding ledger, live WebSocket state. |
| `/shortlists` | **Squad Builder & Shortlists** | Franchise-specific player shortlists, target prices, and squad balance composition analyzer. |
| `/admin` | **Admin & Data Quality** | Extraction audit log, scorecard validation status, identity alias mapper, new player creation. |

---

## 10. Complete Backend API Reference

### Overview & Core Endpoints
* `GET /api/overview`: Tournament KPIs, champions list, top run scorer, top wicket taker, best-rated player.
* `GET /api/seasons`: Detailed metrics for 2023, 2024, and 2025 seasons.
* `GET /api/teams`: Historical performance records and statistics for all franchises.

### Players & Analytics
* `GET /api/players`: List players with search, role, category, and season filters.
* `GET /api/players/{id}`: Complete player profile, career stats, season breakdown, match history, and similar players.
* `GET /api/analytics/batting`: Batting leaderboards sorted by runs, average, strike rate, or rating.
* `GET /api/analytics/bowling`: Bowling leaderboards sorted by wickets, economy, strike rate, or dot ball %.
* `GET /api/analytics/all-rounders`: All-rounder leaderboards and dual-discipline ratings.
* `GET /api/analytics/comparison?ids=EPL-P-001,EPL-P-002`: Multi-player comparative metrics.
* `GET /api/analytics/similar-groups`: 7 statistical cohorts and member rosters.

### Insights & AI
* `GET /api/insights`: 16 verified tournament statistical insights.
* `POST /api/insights/explain`: Generates natural language editorial commentary via Ollama LLM or fallback.

### Auction & Live Room
* `GET /api/auction/players`: Auction-eligible player pool with category, base price, and valuation.
* `GET /api/auction/teams`: 6 franchise owners, total purse, spent amount, remaining purse, and squad count.
* `GET /api/auction/shortlists/{team_id}`: Team-specific target shortlists.
* `POST /api/auction/shortlists`: Add player to team shortlist with target bid.
* `DELETE /api/auction/shortlists/{shortlist_id}`: Remove player from shortlist.
* `POST /api/auction/squad-balance`: Validates squad balance and role distribution.
* `WebSocket /api/auction/ws`: Real-time bidirectional live bidding connection.

### Admin & Data Management
* `GET /api/admin/data-quality`: Complete extraction audit log and scorecard validation scores.
* `GET /api/admin/identity-resolution`: List of raw names and canonical player mappings.
* `POST /api/admin/identity-resolution`: Map a new name variation to a canonical player ID.
* `POST /api/admin/players/new`: Register an unlisted player for upcoming auctions.
* `POST /api/admin/reimport`: Triggers complete re-extraction and database re-import.

---

## 11. Automated Test Suite & Quality Assurance

The platform features an automated test suite with **18 passing tests** across two test suites:

```text
tests/
├── test_cricket_analytics.py   # Unit tests for cricket mathematical engines
└── test_api_endpoints.py       # Integration tests for all 8 FastAPI router modules
```

### Execution Results
```text
============================= test session starts ==============================
platform darwin -- Python 3.13.7, pytest-9.2.0 -- configfile: pytest.ini
collected 18 items

tests/test_api_endpoints.py::test_api_overview PASSED                    [  5%]
tests/test_api_endpoints.py::test_api_players PASSED                     [ 11%]
tests/test_api_endpoints.py::test_api_player_detail PASSED               [ 16%]
tests/test_api_endpoints.py::test_api_analytics_batting PASSED           [ 22%]
tests/test_api_endpoints.py::test_api_analytics_bowling PASSED           [ 27%]
tests/test_api_endpoints.py::test_api_analytics_similar_groups PASSED    [ 33%]
tests/test_api_endpoints.py::test_api_insights PASSED                    [ 38%]
tests/test_api_endpoints.py::test_api_auction_players PASSED             [ 44%]
tests/test_api_endpoints.py::test_api_auction_teams PASSED               [ 50%]
tests/test_api_endpoints.py::test_api_seasons PASSED                     [ 55%]
tests/test_api_endpoints.py::test_api_teams PASSED                       [ 61%]
tests/test_api_endpoints.py::test_api_admin_data_quality PASSED          [ 66%]
tests/test_cricket_analytics.py::test_overs_conversion PASSED            [ 72%]
tests/test_cricket_analytics.py::test_batting_metrics_recalculation PASSED [ 77%]
tests/test_cricket_analytics.py::test_bowling_metrics PASSED             [ 83%]
tests/test_cricket_analytics.py::test_identity_resolution PASSED         [ 88%]
tests/test_cricket_analytics.py::test_ratings_and_valuation PASSED       [ 94%]
tests/test_cricket_analytics.py::test_similarity_cohorts PASSED          [100%]

======================== 18 passed in 4.63s ========================
```

---

## 12. Quick Start & Operational Runbook

### 12.1 Environment Activation & Local Execution
```bash
# Navigate to project directory
cd "/Users/akshat/Document/Coding Project/EPL-Stats"

# Activate Python Virtual Environment
source "/Users/akshat/Document/Coding Project/venv/bin/activate"

# Run Test Suite
pytest -v

# Start FastAPI Backend Server
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

In a second terminal:
```bash
# Start Next.js Frontend Server
cd "/Users/akshat/Document/Coding Project/EPL-Stats/frontend"
npm run dev
```

* **Frontend Web Application**: [http://localhost:3000](http://localhost:3000)
* **Backend API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 12.2 Multi-Container Docker Deployment
```bash
cd "/Users/akshat/Document/Coding Project/EPL-Stats"
docker-compose up --build
```
This builds and launches both the backend container (Python 3.11-slim) and frontend container (Node 20-alpine multi-stage build) with automatic port mapping.

---

## 13. Summary of Deliverables & Project Files

* **Master Guide**: [README.md](file:///Users/akshat/Document/Coding%20Project/EPL-Stats/README.md)
* **Project Documentation**: [PROJECT_DOCUMENTATION.md](file:///Users/akshat/Document/Coding%20Project/EPL-Stats/documentation/PROJECT_DOCUMENTATION.md)
* **Architecture Guide**: [architecture.md](file:///Users/akshat/Document/Coding%20Project/EPL-Stats/documentation/architecture.md)
* **Statistical Formulas**: [statistical_formulas.md](file:///Users/akshat/Document/Coding%20Project/EPL-Stats/documentation/statistical_formulas.md)
* **Scorecard Extraction Audit**: [extraction_audit.md](file:///Users/akshat/Document/Coding%20Project/EPL-Stats/reports/extraction_audit.md)
* **Backend Application**: [main.py](file:///Users/akshat/Document/Coding%20Project/EPL-Stats/backend/main.py)
* **Database Models**: [models.py](file:///Users/akshat/Document/Coding%20Project/EPL-Stats/backend/database/models.py)
* **Ratings Engine**: [ratings_engine.py](file:///Users/akshat/Document/Coding%20Project/EPL-Stats/backend/analytics/ratings_engine.py)
* **Live Auction Engine**: [live_auction_manager.py](file:///Users/akshat/Document/Coding%20Project/EPL-Stats/backend/auction/live_auction_manager.py)
* **Automated Tests**: [test_cricket_analytics.py](file:///Users/akshat/Document/Coding%20Project/EPL-Stats/tests/test_cricket_analytics.py) and [test_api_endpoints.py](file:///Users/akshat/Document/Coding%20Project/EPL-Stats/tests/test_api_endpoints.py)
