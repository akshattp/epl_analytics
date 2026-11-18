# EPL — EXOTICA PREMIER LEAGUE
### Historical Cricket Analytics & Player Auction Intelligence Platform

A full-stack cricket analytics and player auction intelligence platform custom-engineered for the **Exotica Premier League (EPL)** — an underarm cricket tournament hosted within the residential community.

The platform transforms raw historical match scorecards across three complete seasons (**EPL 2023, EPL 2024, EPL 2025**) into actionable player intelligence, deep statistical ratings, cohort clustering, automated explainable insights, and live auction management for six franchise owners.

---

## 1. System Architecture

```text
EPL-Stats/
├── epl_data_historical.zip     # Original 27-match PDF archive (source of truth preserved)
├── data/
│   ├── raw/                    # Extracted raw match PDFs (2023, 2024, 2025)
│   ├── extracted/              # Structured JSON extractions (matches.json)
│   ├── processed/              # Normalized player master records & exports
│   └── database/               # Production SQLite database (epl_analytics.db)
├── backend/
│   ├── extraction/             # PyMuPDF + pdfplumber parser & identity resolver
│   ├── analytics/              # Cricket math, 100-pt ratings, cohorts, 16 insights
│   ├── auction/                # 6-owner purse manager, valuations, WebSocket engine
│   ├── database/               # SQLAlchemy ORM models, session factories
│   ├── routers/                # FastAPI endpoints (Overview, Players, Analytics, Insights, etc.)
│   └── main.py                 # FastAPI application root with CORS & WebSocket
├── frontend/                   # Next.js 14 App Router, TypeScript, Tailwind CSS, Recharts
│   ├── src/app/                # 14 distinct dashboard pages
│   ├── src/components/         # Reusable luxury UI components
│   └── src/lib/                # API client, TypeScript definitions
├── documentation/              # Architecture guides and statistical formula references
├── reports/                    # Historical data extraction audit & anomalies report
├── tests/                      # Pytest automated test suite (18 unit & API integration tests)
├── docker-compose.yml          # Container orchestration (Backend + Frontend)
├── requirements.txt            # Python dependencies
└── README.md                   # System documentation
```

---

## 2. Strict 5-Brand-Color Palette

The application adheres strictly to the official EPL tournament color palette across all surfaces, typography, charts, and interactive states:

| Color Name | Hex Code | Purpose & Usage |
| :--- | :--- | :--- |
| **Midnight Black** | `#02000D` | Dark surfaces, deep borders, high-contrast typography |
| **Deep Navy** | `#07203F` | Primary header surfaces, luxury card backgrounds, table headers |
| **Warm Beige** | `#EBDED4` | Editorial background canvas, light cards, neutral data cells |
| **Dusty Peach** | `#D9AA90` | Secondary accents, metric progress bars, hover states |
| **Terracotta** | `#A65E46` | Primary action buttons, badges, top-tier highlights, active tabs |

*No generic neon colors, standard Bootstrap blues, or off-palette accents are permitted.*

---

## 3. Key Capabilities

### Engine A: Cricket Analytics & Intelligence
1. **Underarm Cricket Mathematics**:
   - Legal ball calculation: $5.4\text{ overs} \rightarrow 5 \times 6 + 4 = 34\text{ balls}$ (not decimal 5.4).
   - Aggregated metric recalculation: All career averages and strike rates are recalculated strictly from raw totals $\left(\frac{\sum \text{Runs}}{\sum \text{Dismissals}}\right)$, never averaged across season averages.
2. **Transparent 100-Point Rating Engine**:
   - **Batting Rating (0–100)**: Volume (30%), Strike Rate relative to tournament par of 135 (35%), Boundary percentage (20%), Bayesian-adjusted Average (15%).
   - **Bowling Rating (0–100)**: Economy relative to par of 6.2 (35%), Strike Rate (30%), Dot-ball percentage (20%), Volume (15%).
   - **All-Rounder Rating (0–100)**: Harmonic mean with dual-discipline bonus:
     $$R_{\text{AR}} = 2 \times \frac{R_{\text{Bat}} \times R_{\text{Bowl}}}{R_{\text{Bat}} + R_{\text{Bowl}} + 1\text{e-}6} + \text{Bonus}$$
   - **Knockout / Big-Match Rating (0–100)**: Weighted performance in Semifinals and Finals.
   - **Consistency Index (0–100)**: Inverse coefficient of variation across match innings.
3. **Statistical Cohort Clustering**:
   - Generates 7 distinct player cohorts using feature-scaled Cosine Similarity:
     *Powerplay Enforcers, Anchors, Death Finishers, Strike Bowlers, Tight Restrictors, Premium All-Rounders, Emerging Talents*.
4. **Tournament Intelligence & Explainability**:
   - 16 verified statistical insights across Player, Bowling, Team, Match, and Cross-Season dynamics.
   - Integrated with **Ollama** local LLM runtime (e.g. `llama3`) for natural-language editorial synthesis, with automated deterministic statistical fallbacks.

### Engine B: Player Auction Intelligence & Live Engine
1. **Player Valuation Engine**:
   - Four distinct categories: **Platinum** (Base 12.0 L), **Gold** (Base 8.0 L), **Silver** (Base 5.0 L), **Bronze** (Base 2.0 L).
   - Dynamic scarcity multiplier based on primary skill availability in the auction pool.
2. **Six-Franchise Live Auction Manager**:
   - Six team owners with 100.0 Lakh purse limits:
     *Victory Vipers, Exotica Warriors, The Ultimates, Exotica Panthers, Exotica Living Legends, Exotica Lions Pride*.
   - Real-time WebSocket bidding engine (`/api/auction/ws`) with automated purse validation, squad size tracking, and live bid broadcasting.
3. **Interactive Squad Builder & Shortlists**:
   - Franchise-specific target shortlists with priority tracking and live squad balance checking.

---

## 4. Quick Start Guide (macOS)

### Prerequisites
- Python 3.11+ (configured in `/Users/akshat/Document/Coding Project/venv`)
- Node.js 18+ and npm
- (Optional) Docker & Docker Compose
- (Optional) Ollama running locally for generative LLM explanations (`ollama run llama3`)

### 1. Backend Setup & Startup
Open your terminal and activate the project virtual environment:

```bash
cd "/Users/akshat/Document/Coding Project/EPL-Stats"
source "/Users/akshat/Document/Coding Project/venv/bin/activate"

# Verify all dependencies are installed
pip install -r requirements.txt

# Run the automated pytest suite (18 unit & API integration tests)
pytest -v

# Start the FastAPI backend server
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```
*The interactive API documentation is available at `http://localhost:8000/docs`.*

### 2. Frontend Setup & Startup
In a separate terminal window:

```bash
cd "/Users/akshat/Document/Coding Project/EPL-Stats/frontend"

# Start the Next.js development server
npm run dev
```
*Open `http://localhost:3000` in your browser.*

---

## 5. Docker Deployment

To launch the full production stack in isolated containers:

```bash
cd "/Users/akshat/Document/Coding Project/EPL-Stats"
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## 6. Frontend Sitemap (14 App Views)

1. **Overview Dashboard** (`/`): Executive tournament KPIs, historical records, champions roll of honor.
2. **Player Directory** (`/players`): Comprehensive directory of all 73 canonical players with filters, sorting, and rating cards.
3. **Player Profile** (`/players/[id]`): In-depth career card, season breakdown, match log, radar ratings, and similar player recommendations.
4. **Player Comparison** (`/comparison`): Side-by-side head-to-head metric comparison with radar overlays.
5. **Similar Player Groups** (`/similar-players`): 7 clustered cohorts with auction replacement analysis.
6. **Batting Analytics** (`/analytics/batting`): Sortable leaderboards, strike-rate vs average scatter plots.
7. **Bowling Analytics** (`/analytics/bowling`): Economy leaders, dot-ball percentage rankings, best bowling spells.
8. **All-Rounder Rankings** (`/analytics/all-rounders`): Dual-discipline contribution matrix and ratings.
9. **Tournament Insights** (`/insights`): 16 automated statistical stories with optional Ollama LLM deep-dives.
10. **Team Analytics** (`/teams`): Win/loss records, head-to-head records, and historical run rates.
11. **Season Comparison** (`/seasons`): Multi-season tournament evolution (2023 vs 2024 vs 2025).
12. **Live Auction Room** (`/auction`): Real-time bidding console, live purse tracking, and auction podium.
13. **Auction Shortlists & Squad Builder** (`/shortlists`): Target player organizer and squad composition validator.
14. **Admin & Data Quality Portal** (`/admin`): Scorecard audit logs, identity resolution mapping, and new player registration.

---

## 7. Automated Test Suite

The test suite validates data integrity, mathematical correctness, and API endpoints:

```bash
cd "/Users/akshat/Document/Coding Project/EPL-Stats"
pytest -v
```

**Test Coverage Highlights:**
- `test_overs_conversion`: Ensures underarm overs (e.g. 5.4 ov = 34 balls) are converted accurately without floating-point distortion.
- `test_batting_metrics_recalculation`: Asserts averages use underlying totals and not-outs correctly.
- `test_bowling_metrics`: Asserts economy and dot-ball metrics adhere to cricket laws.
- `test_identity_resolution`: Validates auto-resolution of name casing and disambiguation of separate players (`Sagar` vs `Sagar Kapadia`).
- `test_ratings_and_valuation`: Validates 100-point ceiling and minimum auction base pricing.
- `test_similarity_cohorts`: Confirms clustering into 7 distinct groups.
- `test_api_*`: End-to-end integration tests for all 8 FastAPI router modules.

---

## 8. License & Provenance
- Tournament: **Exotica Premier League (EPL)**
- Historical Data Source: Official CricHeroes Tournament Scorecard PDFs (2023, 2024, 2025)
- Implementation: Fully self-contained local-first architecture. Zero external paid API dependencies.
