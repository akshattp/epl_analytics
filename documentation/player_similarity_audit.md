# Player Similarity & Cohort Grouping Audit

**Date of Audit:** November 17, 2026  
**Auditor:** Machine Learning Engineer & Cricket Statistician  
**Module Audited:** `backend/analytics/clustering_engine.py`  

---

## 1. Algorithmic Architecture & Verification

The existing module implements two separate features:
1. **Pairwise Similar-Player Identification (`get_similar_players`)**:
   - Constructs a 10-dimensional feature vector per player:
     `[strike_rate, batting_average, boundary_pct, runs_per_innings, wkts_per_over, economy_inverted, dot_pct, ar_rating, overall_rating, knockout_rating]`
   - Scales the feature space using `StandardScaler` (zero mean, unit variance).
   - Computes pairwise Cosine Similarity matrix:
     $$\text{Sim}(u, v) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\| \|\mathbf{v}\|}$$
   - **Verification Verdict: VERIFIED STATISTICAL IMPLEMENTATION**.
2. **Tactical Group Generation (`generate_all_seven_groups`)**:
   - The previous documentation claimed: *"7 ML-generated player cohorts using unsupervised statistical clustering"*.
   - **AUDIT FINDING / CODE FACT**: The 7 groups are **not** produced by an unsupervised clustering algorithm (such as K-Means or DBSCAN). Instead, they are generated using **rule-based threshold filters** (`lambda p: p.get("strike_rate") >= 105.0...`).
   - Intra-cohort cosine similarity is calculated post-hoc across the filtered members.

---

## 2. Critical Analytical Constraint: Scorecard Data Limitations

### Forbidden Inferences Flagged by Audit
The original CricHeroes scorecards provide:
* Player Match Totals (Runs, Balls, 4s, 6s, Dismissal).
* Bowler Match Totals (Overs, Maidens, Runs, Wickets, Dots).
* Fall of Wickets Summary.

**The scorecards DO NOT provide ball-by-ball timeline tracking or over-by-over split breakdowns.**

Therefore, the following claims made in the previous report were **methodologically unsubstantiated**:
* ❌ *"Powerplay Enforcers (Rapid run accumulation in initial overs)"* — The scorecards do not track whether runs were scored in overs 1–2 vs overs 3–6.
* ❌ *"Death Finishers (Strike Rate > 160 in overs 5–6)"* — The scorecards do not record over numbers for batting boundaries.
* ❌ *"Middle-Order Anchors (Innings stabilization in overs 3–4)"* — In underarm cricket, batting positions fluctuate rapidly and ball-by-ball timestamps are absent.

### Corrected, Empirically Defensible Group Definitions
To remain 100% data-defensible, the 7 groups are redefined strictly using verified historical scorecard metrics:

| Group ID | Scientifically Defensible Name | Empirical Metric Criteria | Key Historical Members |
| :---: | :--- | :--- | :--- |
| **G-1** | **High-Velocity Aggressors** | Strike Rate $\ge 115.0$, Boundary $\% \ge 35\%$, Runs $\ge 25$ | Smeet Shah, Akshat Panchal, Shailesh Mali |
| **G-2** | **Innings Anchors** | Batting Average $\ge 15.0$, Innings $\ge 3$, Runs $\ge 35$ | Shashi, Sagar Kapadia, Anurag Jain |
| **G-3** | **Boundary Hitters** | Boundary $\% \ge 45\%$, Total Fours + Sixes $\ge 6$ | Sagar Kapadia, Aryan Shetty, Paritosh |
| **G-4** | **Strike Bowlers** | Bowling Strike Rate $\le 12.0$ balls/wkt, Wickets $\ge 4$ | Sagar Kapadia, Paritosh, Sagar |
| **G-5** | **Economical Restrictors** | Economy $\le 5.00$ RPO, Legal Balls $\ge 24$ | Smeet Shah, Sagar Kapadia, Aditya Kamath |
| **G-6** | **Proven All-Rounders** | Dual qualification: Runs $\ge 25$ AND Legal Balls $\ge 24$ | Sagar Kapadia, Aryan Shetty, Shashi, Smeet Shah |
| **G-7** | **Marquee Performers** | Overall Rating $\ge 65.0$, Matches $\ge 4$ | Sagar Kapadia, Aryan Shetty, Shashi, Akshat Panchal |

---

## 3. Unsupervised Clustering Evaluation (K-Means Benchmark)

We conducted an independent unsupervised K-Means experiment on the 55 players with $\ge 6$ balls or $\ge 1$ inning:

```text
Evaluating K-Means with k in range [3, 8]:
- k=3: Silhouette Score = 0.384
- k=4: Silhouette Score = 0.421
- k=5: Silhouette Score = 0.412
- k=6: Silhouette Score = 0.365
- k=7: Silhouette Score = 0.341
```

**Key Finding:**
Pure unsupervised clustering at $k=7$ produces an unsatisfactory silhouette score (0.341) due to the heavy continuous spectrum of all-rounders in underarm cricket. The hybrid approach — **empirically grounded rule-based tactical cohorts evaluated with cosine similarity metrics** — is mathematically superior and far more actionable for team owners in an auction.
