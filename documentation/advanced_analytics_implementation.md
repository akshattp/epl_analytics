# EPL Version 1.1 – Advanced Analytics & Intelligence Lab Implementation

## 1. Architecture Overview

All Version 1.1 analytics modules sit cleanly beside existing Phase 1 engines without altering historical scorecards or canonical player IDs:

- **Additive Database Schema** (`backend/database/models.py`):
  - `partnerships` (252 rows): Wicket-by-wicket stands across all 56 innings.
  - `fielding_events` (163 rows): Canonical fielding dismissals extracted from `batting_scorecards.dismissal` plus future manual admin entries.
- **Migration & Enrichment Pipeline** (`backend/ingestion/v1_1_migration.py`):
  - Idempotent script backed up prior to execution (`data/database/epl_analytics_backup_pre_v1_1.db`).
  - Recovers 11 truncated multi-line Fall of Wickets blocks directly from the 27 untouched source PDFs in `data/raw/EPL Data/`.
- **Analytics Engines**:
  - `backend/analytics/advanced_analytics.py`
  - `backend/analytics/intelligence_lab.py`
  - Exposed via `backend/routers/advanced_analytics.py`.

---

## 2. Partnership Analytics Reconstruction Methodology

Source CricHeroes PDFs do not contain a standalone Partnerships table, but **all 56 innings** include exact Fall of Wickets (`Score-Wicket (Batter, Over)`). Partnerships are reconstructed mathematically without estimation:

1. Batting positions 1 & 2 open at `start_score = 0`.
2. For each ordered Fall of Wickets entry $(S_k, k, \text{Batter}_k, O_k)$:
   $$\text{Partnership Runs}_k = S_k - S_{k-1}, \quad \text{Contribution \%} = \frac{\text{Partnership Runs}_k}{\text{Innings Total}} \times 100$$
3. The dismissed batter is replaced by the next batter in `batting_position` order.
4. If an innings concludes with 2 not-out batters (`len(not_out_batters) >= 2`), the unbroken stand equals $\text{Total Runs} - S_{\text{last}}$.

### Verified Historical Records
- **Tied Highest Partnerships**:
  - **50\*** (Unbroken 3rd wicket, 80.6% of team total): **Pankaj Mistry & Sagar Kapadia** (Exotica Warriors, EPL 2025).
  - **50\*** (Unbroken 2nd wicket, 92.6% of team total): **Akshat Panchal & Shashi** (Victory Vipers, EPL 2025).
- **Highest Opening Stand**: **39** by **Aryan Shetty & Pankaj Mistry** (Exotica Warriors, EPL 2025); **34\*** (100% of team total) by **Aryan Shetty & Smeet Shah** (TEAM VB, EPL 2023).

---

## 3. Canonical Fielding Analytics

Parsed deterministically across all 312 batting scorecards:
- **Catches** (`c <Fielder> b <Bowler>`): 31
- **Caught & Bowled** (`c & b <Bowler>`): 6 (credited as catches to the bowler)
- **Stumpings** (`st †<Keeper> b <Bowler>`): 12 (stripping wicketkeeper `†` prefix)
- **Run-Outs** (`run out <Fielder>` and joint `run out A / B`): 93 dismissals generating direct run-outs and shared run-out assists across both participating fielders.
- **Total Canonical Events**: 163 (161/163 resolved to canonical Player IDs; 2 stumpings belong to wicketkeeper `Aditya Gurav`, who never batted or bowled and is preserved cleanly without fabricating batting rows).
- **Top Fielders**: Sagar Kapadia (12 dismissals: 2 catches, 9 run-outs, 1 stumping), Smeet Shah (11: 2 catches, 9 run-outs), Jash Bhatia (9: 3 catches, 5 run-outs, 1 stumping).
- **Admin Manual Entry**: `POST /api/advanced/fielding/manual` allows the auctioneer/admin to log future-season fielding events cleanly.

---

## 4. Advanced Batting, Bowling & Player Impact Model

- **Advanced Batting** (`/api/advanced/batting`): Boundary run %, boundary ball %, runs/innings, team run share %, not-out frequency, scoring standard deviation & consistency index ($n \ge 3$), high-impact innings ($\ge 20$ runs or $\ge 35\%$ of team total), season progression, and wins-vs-losses splits. Batting Dot-Ball % is explicitly returned as `null` (`NOT AVAILABLE`).
- **Advanced Bowling** (`/api/advanced/bowling`): Wickets/spell, **verified Bowling Dot-Ball %** (`dot_balls / legal_balls`, 827 dot balls across 277 spells), team wicket share %, winning-match wickets & economy, opponent splits, best spells, and economy standard deviation.
- **Player Impact Model** (`/api/advanced/impact`): Composite score weighting Overall Rating (40%), Winning-Match Contribution (25%), Knockout Impact (20%), and Two-Way Harmonic Balance (15%). Explicitly displays a correlation-vs-causation guardrail disclaimer.

---

## 5. EPL Intelligence Lab (`/intelligence-lab`)

- **2-Player & 3-Player Franchise Combinations** (`/api/intelligence-lab/combinations`): Evaluates every pair and trio who played together on the same franchise across all 27 matches—reporting shared matches ($n$), shared wins, team win % WITH vs WITHOUT the combination, semifinals, finals, championships, and combined runs/wickets.
- **Reliability Guardrails**:
  - $n \ge 6$: `Moderate Exploratory`
  - $4 \le n \le 5$: `Low Exploratory`
  - $n < 4$: `Insufficient Evidence` displaying *"Interesting historical pattern – insufficient evidence for a reliable conclusion."*
- **Empirical Discoveries** (`/api/intelligence-lab/discoveries`): Tests 5 historical squad hypotheses (2+ strong all-rounders vs Finals, 2+ wicket bowling spell vs wins, 3+ batters scoring $\ge 5$ runs vs wins, above-median squad rating vs Semifinals, and roster experience vs head-to-head wins), along with multi-season finalists and recurring semifinal pairs.
