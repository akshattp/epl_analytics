# EPL v2.0 — ATHLETE PERFORMANCE DOSSIER SPECIFICATION

**Product**: EPL (Exotica Premier League) Historical Cricket Analytics & Live Auction Platform  
**Version**: 2.0.0 Signature Release  
**Status**: Feature Redesign Document  
**Date**: November 19, 2026  
**Implementation**: `frontend/src/app/players/[id]/page.tsx`  

---

## 1. Executive Summary

In previous versions, the player profile page (`/players/[id]`) functioned as a standard database table report. While mathematically accurate, it felt static, dense, and disconnected from the high-stakes, broadcast nature of a franchise cricket league.

In EPL v2.0, the player profile has been completely re-architected into a **Signature Athlete Performance Dossier**. It combines high-fashion athletic editorial layout, role-prioritized performance racks, visual micro-meters, and an interactive match timeline to give franchise owners and scouts an immediate, visceral understanding of an athlete's tournament pedigree.

---

## 2. Key Architecture Upgrades

### 1. Typographic Athlete Hero Stage
* **Oversized Name Display**: Displayed in `Space Grotesk 900` (`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight`).
* **Custom Athlete Monogram Badge**: Dynamically calculates two-letter athlete initials (e.g. "RS" for Rohit Sharma) placed inside a high-contrast geometric crest.
* **Marquee Gold Halo Ring**: Athletes with an EPL Intelligence Score $\ge 75$ are rendered with an ambient gold/electric blue halo ring and an apex star emblem.
* **Identity Pills**: Player ID (e.g. `P01`), Role Classification, Batting Hand, and Bayesian Confidence Rating (`HIGH`, `MEDIUM`, `LOW` with match sample size).

### 2. Role-Prioritized Key Statistics Rack
Rather than presenting the same generic metrics in a rigid sequence, the dossier inspects the player's primary role and renders specialized key performance racks:
* **All-Rounders**: Dual-impact 6-card grid displaying Career Runs, Strike Rate, 15+ Milestones, Wickets Bowled, Bowling Economy, and Multi-Wicket Spells simultaneously.
* **Specialist Batters**: 4-card grid prioritizing Career Runs, Strike Rate, Batting Average, and Balls Per Boundary.
* **Specialist Bowlers**: 4-card grid prioritizing Career Wickets, Bowling Economy, Bowling Strike Rate, and Multi-Wicket Spells.

### 3. Visual 100-Point PIS (Player Intelligence Scorecard)
* 5 distinct evaluation pillars:
  1. **BIS (Batting Intelligence Score)**: Volume, boundary percentage, and velocity.
  2. **BoIS (Bowling Intelligence Score)**: Wicket strike rate and dot ball pressure.
  3. **AIS (All-Rounder Intelligence Score)**: Dual-discipline balance.
  4. **CIS (Consistency Intelligence Score)**: Low scoring variance and dismissal stability.
  5. **MIS (Match Impact Score)**: High-impact milestones and playoff knockout bonuses.
* Each pillar includes a horizontal animated micro-progress meter and mathematical derivation drawer.

### 4. Interactive Match Timeline Log
* Season filter buttons (`ALL`, `2023`, `2024`, `2025`) allow scouts to isolate specific tournament campaigns.
* Highlight badges: Outstanding performances (e.g. scores $\ge 20$ runs or spells with $\ge 2$ wickets) are automatically highlighted with electric blue and emerald badges.

### 5. Multi-Dimensional Charts & Auction Substitutes
* High-resolution charts: Season progression trajectory, multi-axis radar chart, league-wide scatter plots, innings consistency bars, and win-vs-loss output differentials.
* Auction Intelligence: Target bidding range, scarcity multiplier, scouting strengths, and similar statistical substitutes for budget management.
