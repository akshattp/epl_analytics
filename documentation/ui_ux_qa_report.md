# EPL v1.2 – UI/UX Acceptance & Playwright Chromium QA Report

**Audit Date:** November 18, 2026  
**Browser Engine:** Playwright Chromium `159.0.8154.6`  
**Viewports Tested:** Desktop (`1440×900`), Tablet (`768×1024`), Mobile (`390×844`)  
**Screenshots Captured:** 35 PNG captures stored in `reports/v1_2_screenshots/`

---

## 1. Visual & Interaction Acceptance Matrix

| QA Area | Status | Evidence & Findings |
| :--- | :---: | :--- |
| Five-colour EPL brand compliance | **VERIFIED** | Strictly adheres to Midnight Black (`#02000D`), Deep Navy (`#07203F`), Warm Beige (`#EBDED4`), Dusty Peach (`#D9AA90`), and Terracotta (`#A65E46`) across all upgraded screens (`auction`, `shortlists`, `players`, `advanced`, `intelligence-lab`, `changelog`). |
| Desktop navigation & mobile drawer | **VERIFIED** | 0 broken links across all 18 tested routes; Analytics dropdown, Intel Lab, Auction, Shortlists, and `v1.1.0` Changelog pill operate cleanly. |
| Sticky opaque table headers & contrast | **VERIFIED** | Audited programmatically across every rendered `<table>` in Chromium: **100% of `<thead> <th>` cells** (`11/11`, `8/8`, `9/9`, `25/25`, `21/21`, `3/3`, `9/9`, `11/11`, `8/8`) have `position: sticky` and high-contrast `#EBDED4` text on opaque `#07203F` background. |
| Horizontal scrolling & mobile responsiveness | **VERIFIED** | Tested 6 core routes on Tablet (`768×1024`) and Mobile (`390×844`) — **0/12 pages exhibited document body overflow (`scrollWidth <= innerWidth`)**; wide tables scroll inside `.table-wrapper` with pinned first columns. |
| Recharts visual analytics rendering | **VERIFIED** | Verified live SVG surfaces rendered: Overview (`22`), Player Profile (`16`), Teams (`10`), Advanced Analytics (`6`), Comparison (`6`), Intelligence Lab (`3`). Zero NaN axes or broken labels. |
| Playwright Chromium PDF visual consistency | **VERIFIED** | `/api/exports/player/EPL-P-001/pdf` renders directly from `/players/EPL-P-001?print=1` (844 KB, 7 pages, 5,207 chars) preserving SVG charts, Playfair/Inter typography, cards, and 5-colour palette. |
| Shareable player profile & Public mode | **VERIFIED** | Clicked **Share Profile** on `/players/EPL-P-001`; verified stable canonical URL, `?public=1` read-only toggle, copy button, and explicit `Local Environment Notice`. |
| Hardened Auction & Private Shortlists UI | **VERIFIED** | Verified real PIN sign-in, session persistence across `/auction` and `/shortlists`, Owner Dashboard private view, AI Mock Sandbox execution (post `BUG-UI-01` fix), and Shortlist Add/Balance/Remove flow with **0 console errors and 0 page errors**. |
| Error, empty & loading states | **VERIFIED** | Loading spinners render cleanly; empty shortlists & clear auction podium display clean guidance; unauthenticated `/shortlists` and `/auction` Owner Dashboard display explicit lock/sign-in cards. |

---

## 2. Captured Screenshot Evidence (`reports/v1_2_screenshots/`)
- Desktop (18 routes + 5 interactive flows): `desktop_home.png`, `desktop_players.png`, `desktop_player_profile.png`, `desktop_player_profile_public.png`, `desktop_player_share_modal.png`, `desktop_batting.png`, `desktop_bowling.png`, `desktop_all_rounders.png`, `desktop_advanced_analytics.png`, `desktop_intelligence_lab.png`, `desktop_comparison.png`, `desktop_similar_players.png`, `desktop_insights.png`, `desktop_teams.png`, `desktop_seasons.png`, `desktop_auction.png`, `desktop_auction_hardened.png`, `desktop_owner_dashboard.png`, `desktop_auction_sandbox.png`, `desktop_shortlists.png`, `desktop_shortlists_owner.png`, `desktop_changelog.png`, `desktop_admin.png`.
- Tablet & Mobile (12 responsive captures): `tablet_*.png` and `mobile_*.png` for `/`, `/players`, `/players/EPL-P-001`, `/analytics/advanced`, `/intelligence-lab`, and `/auction`.
