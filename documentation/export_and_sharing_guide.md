# EPL Version 1.1 – Player Export & Profile Sharing Guide

## 1. Complete Player Statistics Export (`/api/exports/players`)

Available on the **Player Directory** (`/players`) as well as **Batting**, **Bowling**, and **All-Rounder** analytics leaderboards.

- **Endpoint**: `GET /api/exports/players?format=csv|xlsx|pdf&search=&role=&category=&min_matches=&sort_by=&sort_dir=`
- **Full Filtered Dataset Guarantee**: Exports ALWAYS serialize the **entire filtered and sorted dataset** from SQLite, never merely the currently visible page of a paginated UI table.
- **Included Columns (22 Fields)**:
  - Player ID, Player Name, Primary Role, Matches, Innings, Runs, Batting Average, Strike Rate, Boundaries (`4s + 6s`), Best Batting Score, Wickets, Overs, Economy, Bowling Strike Rate, Best Bowling Figures, Overall EPL Rating, Batting Rating, Bowling Rating, All-Rounder Rating, Auction Tier, Estimated Valuation (Lakhs), and Season Breakdown (`2023 / 2024 / 2025` Runs/Wkts).
- **Supported Formats**:
  - **CSV** (`UTF-8 with BOM` for seamless Excel opening).
  - **Excel (`.xlsx`)** via `openpyxl` with Deep Navy (`#07203F`) frozen header rows, Warm Beige (`#EBDED4`) alternating rows, and auto-sized column widths.
  - **PDF** rendered via Playwright headless Chromium in A4 Landscape with repeating headers (`display: table-header-group`) and strict EPL 5-colour styling.

---

## 2. Individual Player Profile PDF Report (`/api/exports/player/{player_id}/pdf`)

Available on every Player Profile page via **"Download Player Report (PDF)"**.

- **Browser-Based Visual Fidelity**:
  - Primary rendering path launches **Playwright Chromium** (`159.0.8154.6`) directly against the live Next.js route `/players/{player_id}?print=1`.
  - Waits for `[data-profile-ready="true"]` and Recharts SVG rendering, emulates `@media print`, and outputs a multi-page A4 PDF preserving exact React cards, Recharts charts (Season Progression, Rating Radar, Batting/Bowling Scatter Plots, Consistency, Win/Loss Splits), typography (`Playfair Display` + `Inter`), tables, and the five-colour EPL palette.
  - Intelligent fallback: If the frontend server is offline (e.g., isolated backend testing), Playwright renders a high-fidelity 5-colour HTML+SVG report directly from SQLite.

---

## 3. Shareable Player Profile Links & Public Mode

Available on every Player Profile page via **"Share Profile"**:

- **Stable Canonical URL**: `/players/EPL-P-001` (links directly to the permanent Player ID without requiring directory navigation).
- **Read-Only Public Mode (`?public=1`)**:
  - Displays a clean Public Read-Only banner and guarantees no private franchise shortlists, auction credentials, or admin controls are exposed.
- **Honest Local-Network Notice**:
  - When accessed via `localhost`, `127.0.0.1`, or private RFC1918 LAN IPs, the Share modal explicitly informs users that recipients outside the machine can only open the URL over the configured local network, via a reverse tunnel (e.g., Cloudflare Tunnel / ngrok), or once deployed to a public domain.

---

## 4. Auction Results Reporting (`/api/exports/auction-results`)

- **PDF**: `GET /api/exports/auction-results?format=pdf` (Chromium-rendered A4 summary of all 6 final squads, total spend, most expensive buy, and unsold pool).
- **Excel**: `GET /api/exports/auction-results?format=xlsx` (3-sheet workbook: `Team Summary`, `Sold Players`, and `Unsold Pool`).
