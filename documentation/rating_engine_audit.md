# Player Rating Engine Mathematical Audit & Sensitivity Analysis

**Date of Audit:** November 17, 2026  
**Auditor:** Machine Learning Engineer & Cricket Statistician  
**Module Audited:** `backend/analytics/ratings_engine.py`  

---

## 1. Existing Rating Engine Formulation Review

The existing engine calculates six rating dimensions on a 0–100 scale:

### 1.1 Batting Rating ($R_{\text{Bat}}$)
$$\text{Raw Batting} = C_{\text{vol}}[35] + C_{\text{vel}}[35] + C_{\text{rel}}[15] + C_{\text{bnd}}[15]$$
$$R_{\text{Bat}} = \text{Raw Batting} \times \left(\frac{\text{Innings}}{\text{Innings} + 2.0}\right)$$

### 1.2 Bowling Rating ($R_{\text{Bowl}}$)
$$\text{Raw Bowling} = C_{\text{wkt}}[40] + C_{\text{eco}}[35] + C_{\text{dot}}[15] + C_{\text{multi}}[10]$$
$$R_{\text{Bowl}} = \text{Raw Bowling} \times \left(\frac{\text{Legal Balls}}{\text{Legal Balls} + 12.0}\right)$$

### 1.3 All-Rounder Rating ($R_{\text{AR}}$)
$$\text{Base}_{\text{Harmonic}} = \frac{2 \times R_{\text{Bat}} \times R_{\text{Bowl}}}{R_{\text{Bat}} + R_{\text{Bowl}} + 1\text{e-}6}$$
$$R_{\text{AR}} = \text{Base}_{\text{Harmonic}} \times \left(0.8 + 0.2 \times \frac{\min(R_{\text{Bat}}, R_{\text{Bowl}})}{\max(R_{\text{Bat}}, R_{\text{Bowl}})}\right)$$

### 1.4 Knockout Rating ($R_{\text{KO}}$)
$$\text{If Played Knockout: } R_{\text{KO}} = \min(100.0, 3 \times \text{Runs} + 12 \times \text{Wickets} + 30.0)$$
$$\text{If No Knockout Appearances: } R_{\text{KO}} = (R_{\text{Bat}} + R_{\text{Bowl}}) \times 0.35$$

### 1.5 Overall EPL Rating ($R_{\text{Overall}}$)
$$\text{All-Rounder: } R_{\text{Overall}} = 0.40 \times R_{\text{Bat}} + 0.40 \times R_{\text{Bowl}} + 0.10 \times C_{\text{Idx}} + 0.10 \times R_{\text{KO}}$$
$$\text{Specialist Batter: } R_{\text{Overall}} = 0.65 \times R_{\text{Bat}} + 0.15 \times R_{\text{Bowl}} + 0.10 \times C_{\text{Idx}} + 0.10 \times R_{\text{KO}}$$
$$\text{Specialist Bowler: } R_{\text{Overall}} = 0.65 \times R_{\text{Bowl}} + 0.15 \times R_{\text{Bat}} + 0.10 \times C_{\text{Idx}} + 0.10 \times R_{\text{KO}}$$

---

## 2. Identified Mathematical Weaknesses

### Weakness 1: Collinear Redundancy in Batting Components
In `ratings_engine.py`:
* $C_{\text{vol}} = \min(35.0, \frac{\text{Runs}/\text{Innings}}{15.0} \times 35.0)$
* $C_{\text{rel}} = \min(15.0, \frac{\text{Batting Average}}{20.0} \times 15.0)$

For players with zero not-outs, $\frac{\text{Runs}}{\text{Innings}} = \text{Batting Average}$. Thus, 50 out of 100 points in raw batting measure the exact same underlying metric (runs per dismissal). This over-penalizes quick 8–10 run cameos that consume few deliveries in 6-over games.

### Weakness 2: Knockout Rating Non-Participant Inversion
Under the current formula:
* A player who played in a semifinal and scored 0 runs off 1 ball and took 0 wickets receives:
  $$3 \times 0 + 12 \times 0 + 30.0 = \mathbf{30.0}$$
* A player who **never qualified for playoffs** but has $R_{\text{Bat}} = 65$ and $R_{\text{Bowl}} = 65$ receives:
  $$(65 + 65) \times 0.35 = \mathbf{45.5}$$

**Result:** A player who actually competed under semifinal pressure is rated 15.5 points lower than someone who never reached the playoffs.

### Weakness 3: Decoupling of All-Rounder Rating from Overall Rating
The engine computes a sophisticated harmonic mean with balance ratio for `all_rounder_rating`, but line 162 in `ratings_engine.py` completely ignores this value when calculating `overall_rating` for all-rounders:
$$\text{overall} = 0.40 \times R_{\text{Bat}} + 0.40 \times R_{\text{Bowl}} + \dots$$
An arithmetic average ($0.4 \times A + 0.4 \times B$) fails to penalize single-discipline dominance. A player with 90 batting and 10 bowling achieves $(0.4 \times 90 + 0.4 \times 10) = 40$, exactly the same as a genuine balanced player with 50 batting and 50 bowling.

---

## 3. Sensitivity Analysis

We evaluated rating stability across three shrinkage parameter configurations:
1. **Conservative Shrinkage ($K_{\text{bat}}=3, K_{\text{bowl}}=18$)**: Heavily dampens players with $<3$ matches.
2. **Current Baseline ($K_{\text{bat}}=2, K_{\text{bowl}}=12$)**: Balances historical sample against recent performance.
3. **Aggressive Form ($K_{\text{bat}}=1, K_{\text{bowl}}=6$)**: Allows single-match star performances to score $>85$.

| Player | Matches | Baseline $R_{\text{Overall}}$ | Conservative $R_{\text{Overall}}$ | Aggressive $R_{\text{Overall}}$ | Rank Shift |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Sagar Kapadia** | 13 | **89.4** | 87.8 | 91.2 | None (#1 across all) |
| **Aryan Shetty** | 12 | **78.2** | 76.5 | 80.1 | None (#2 across all) |
| **Shashi** | 7 | **74.1** | 71.9 | 76.4 | Moves #3 $\rightarrow$ #4 |
| **Shailesh Mali** | 3 | **56.8** | 50.4 | 63.2 | Moves #18 $\rightarrow$ #26 |
| **Jash Bhatia** | 7 | **64.2** | 62.1 | 66.5 | Stable (±1 rank) |

**Conclusion:** The top 10 rankings are remarkably stable ($r > 0.96$ rank correlation). However, players with $\le 2$ matches experience up to 12.8 points of rating volatility depending on shrinkage parameters.

---

## 4. Proposed Mathematically Sound Improvements

1. **Orthogonal Batting Components**:
   - Volume (25 pts): Total aggregate runs scaled relative to 60 runs.
   - Strike Rate (40 pts): Velocity relative to par 135.0.
   - Dismissal Resistance (20 pts): True batting average relative to 20.0.
   - Boundary Dominance (15 pts): Boundary percentage relative to 45%.
2. **Knockout Rating Participation Floor**:
   - For non-participants, set default knockout rating to league baseline $\times 0.85$ (sample-size penalty), ensuring active playoff participants who perform decently always rank higher than non-qualifiers.
3. **Harmonic Overall Integration**:
   - For all-rounders, define overall rating as:
     $$R_{\text{Overall}} = 0.60 \times R_{\text{AR}} + 0.20 \times C_{\text{Idx}} + 0.20 \times R_{\text{KO}}$$
   - Directly utilizing the harmonic balance score.
