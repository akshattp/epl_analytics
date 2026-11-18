# EPL Version 1.1 – Historical Data Availability Matrix

All classifications below were audited directly against all **27 untouched CricHeroes PDF scorecards** in `data/raw/EPL Data/` and all **17 SQLite tables** in `data/database/epl_analytics.db`. No unavailable metrics are estimated or fabricated anywhere in the application.

| Module | Analytical Metric | Classification | Verified Source / Technical Basis |
| :--- | :--- | :---: | :--- |
| **Partnerships** | Wicket-by-Wicket Partnership Runs, Pairs & Unbroken Stands | **DERIVABLE FROM EXISTING DATA** | Reconstructed mathematically from complete Fall of Wickets (recovered across all 56 innings, including 11 multi-line PDF blocks) + `batting_scorecards.batting_position` (**252 partnerships**). |
| **Partnerships** | Exact Legal Balls Faced per Partnership | **REQUIRES ADDITIONAL DATA** | Fall of Wickets records over timestamps (e.g., `2.4 ov`) rather than exact legal ball counts per stand when wides/no-balls occur; exact runs & over spans are displayed instead. |
| **Fielding** | Catches, Caught & Bowled, Direct Run-Outs, Joint Run-Out Assists & Stumpings | **DIRECTLY AVAILABLE** | Extracted directly from `batting_scorecards.dismissal` & `fielder_name` across all 312 records (**163 canonical events**; 161/163 resolved to canonical Player IDs). |
| **Fielding** | Dropped Catches, Runs Saved & Misfields | **NOT AVAILABLE** | Not logged in CricHeroes summary scorecard PDFs; never fabricated. |
| **Advanced Batting** | Boundary %, Runs/Innings, Team Share %, Not-Out %, Consistency, High-Impact Inns, Wins vs Losses | **DERIVABLE FROM EXISTING DATA** | Computed from 312 regulation `batting_scorecards` joined with `innings` totals and `matches` winners. |
| **Advanced Batting** | Batting Dot-Ball Percentage (Batter `0s`) | **NOT AVAILABLE** | Verified across all 27 PDFs: CricHeroes batting tables record `R, B, 4s, 6s, SR` only (`0s` is omitted). Explicitly returned as `null` with transparent UI notice. |
| **Advanced Batting** | Phase-Wise Splits (Powerplay / Middle / Death Overs) | **NOT AVAILABLE** | Ball-by-ball commentary logs are not present in summary scorecard PDFs. |
| **Advanced Bowling** | Bowling Dot-Ball Percentage (Bowler `0s`) | **DIRECTLY AVAILABLE** | Recorded directly in `bowling_scorecards.dot_balls` across all **277 regulation spells** (827 dot balls). |
| **Advanced Bowling** | Wickets/Match, Economy Progression, Team Wicket Share, Opponent Splits, Winning Wickets, Best Spells | **DERIVABLE FROM EXISTING DATA** | Computed directly from 277 regulation `bowling_scorecards` joined with `matches` and `innings`. |
| **Player Impact** | Winning Contribution, Consistency, Knockout Uplift, Two-Way Impact | **DERIVABLE FROM EXISTING DATA** | Derived from regular + knockout scorecards with explicit correlation-vs-causation scientific framing. |
| **Intelligence Lab** | 2-Player & 3-Player Franchise Combinations, Win % With vs Without, Postseason Appearances | **DERIVABLE FROM EXISTING DATA** | Computed across all 27 historical matches with minimum threshold ($n \ge 3$) and explicit insufficient-evidence labeling whenever $n < 4$. |
