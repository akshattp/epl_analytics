# EPL v1.3 — Cricket Analytics Formula & Methodology Reference

This document provides the mathematical specifications for all batting, bowling, situational, and all-rounder metrics implemented in the EPL Analytics Engine.

---

## 1. Cricket Overs & Deliveries Invariants

In standard cricket accounting, overs are recorded in base-6 notation where the integer represents completed 6-ball overs and the fraction represents remaining balls.

### Overs to Legal Deliveries
$$\text{legal\_balls} = (\lfloor\text{overs}\rfloor \times 6) + \text{round}((\text{overs} - \lfloor\text{overs}\rfloor) \times 10)$$

*Example:* `5.4` overs $\rightarrow (5 \times 6) + 4 = 34$ balls.

### Legal Deliveries to Overs
$$\text{completed\_overs} = \lfloor\text{balls} / 6\rfloor, \quad \text{remaining\_balls} = \text{balls} \pmod 6$$
$$\text{overs\_float} = \text{float}(\text{completed\_overs} + \text{remaining\_balls} \times 0.1)$$
$$\text{overs\_display} = \text{f"{completed\_overs}.{remaining\_balls}"}$$

*Example:* $15$ balls $\rightarrow \lfloor 15/6 \rfloor = 2$, $15 \pmod 6 = 3 \rightarrow$ `2.3` overs.

---

## 2. Advanced Batting Analytics Formulas

### Batting Average & Undefeated Handling
$$\text{outs} = \text{innings} - \text{not\_outs}$$
$$\text{Batting Average} = \begin{cases} 
\frac{\sum \text{runs}}{\text{outs}} & \text{if } \text{outs} > 0 \\
\text{undefined (Flag: } \text{is\_undefeated} = \text{True, Display: } \text{"Runs*"}) & \text{if } \text{outs} = 0 \text{ and } \sum \text{runs} > 0 \\
0.00 & \text{if } \text{outs} = 0 \text{ and } \sum \text{runs} = 0 
\end{cases}$$

### Strike Rate (SR)
$$\text{Strike Rate} = \left(\frac{\sum \text{runs}}{\sum \text{balls faced}}\right) \times 100 \quad (\text{for } \text{balls} > 0)$$

### Runs Per Innings (RPI)
$$\text{RPI} = \frac{\sum \text{runs}}{\text{innings}} \quad (\text{for } \text{innings} > 0)$$

### Boundary Scoring Metrics
$$\text{boundary\_runs} = (\text{total\_4s} \times 4) + (\text{total\_6s} \times 6)$$
$$\text{Boundary Runs \%} = \left(\frac{\text{boundary\_runs}}{\sum \text{runs}}\right) \times 100 \quad (\text{proportion of runs from boundaries})$$
$$\text{Boundary Balls \%} = \left(\frac{\text{total\_4s} + \text{total\_6s}}{\sum \text{balls faced}}\right) \times 100 \quad (\text{frequency of boundary hits per ball})$$
$$\text{Balls Per Boundary} = \frac{\sum \text{balls faced}}{\text{total\_4s} + \text{total\_6s}}$$

### Dismissal Proportions
$$\text{Duck \%} = \left(\frac{\sum \text{innings where runs} = 0 \land \neg\text{is\_not\_out}}{\text{innings}}\right) \times 100$$
$$\text{Not-Out \%} = \left(\frac{\text{not\_outs}}{\text{innings}}\right) \times 100$$

### 6-Over Tournament Milestone Frequencies
In 6-over cricket, individual contributions are condensed into 6–12 ball bursts. Standard 50s and 100s are replaced by 10+, 15+, 20+, and 30+ milestone thresholds:
$$\text{Pct 10+} = \left(\frac{\sum \mathbb{I}(\text{runs} \ge 10)}{\text{innings}}\right) \times 100$$
$$\text{Pct 15+} = \left(\frac{\sum \mathbb{I}(\text{runs} \ge 15)}{\text{innings}}\right) \times 100$$
$$\text{Pct 20+} = \left(\frac{\sum \mathbb{I}(\text{runs} \ge 20)}{\text{innings}}\right) \times 100$$

### Batting Consistency Index (0–100)
Evaluates score variance across regulation innings using Coefficient of Variation (CV):
$$\mu = \frac{\sum \text{runs}}{\text{innings}}, \quad \sigma = \sqrt{\frac{\sum (\text{runs}_i - \mu)^2}{\text{innings} - 1}}, \quad \text{CV} = \frac{\sigma}{\mu}$$
$$\text{Consistency Index} = \max(0, \min(100, 100 - (\text{CV} \times 35)))$$
*(Innings $= 1$ assigns a baseline 50.0 index with low sample indicator).*

### Batting Explosiveness Index (0–100)
Quantifies velocity and boundary-clearing threat:
$$\text{Explosiveness} = \min\left(100, \left(\frac{\text{SR}}{150} \times 60\right) + \left(\frac{\text{Boundary Runs \%}}{60} \times 40\right)\right)$$

---

## 3. Advanced Bowling Analytics Formulas

### Economy Rate (RPO)
$$\text{Economy} = \frac{\sum \text{runs conceded}}{(\text{legal\_balls} / 6.0)} = \frac{\sum \text{runs conceded} \times 6}{\text{legal\_balls}}$$
*Strict Invariant:* Calculated strictly from legal deliveries, never treating decimal overs as fractions of 10.

### Bowling Average & Strike Rate
$$\text{Bowling Average} = \begin{cases} \frac{\sum \text{runs conceded}}{\sum \text{wickets}} & \text{if } \text{wickets} > 0 \\ \text{None (undefined)} & \text{if } \text{wickets} = 0 \end{cases}$$
$$\text{Bowling Strike Rate} = \begin{cases} \frac{\sum \text{legal\_balls}}{\sum \text{wickets}} & \text{if } \text{wickets} > 0 \\ \text{None (undefined)} & \text{if } \text{wickets} = 0 \end{cases}$$

### Dot Ball Percentage
$$\text{Dot Ball \%} = \left(\frac{\sum \text{dot\_balls}}{\sum \text{legal\_balls}}\right) \times 100$$

### Boundary Concession Percentage
$$\text{Boundary Concession \% (Runs)} = \left(\frac{(\text{4s conceded} \times 4) + (\text{6s conceded} \times 6)}{\sum \text{runs conceded}}\right) \times 100$$
$$\text{Boundary Concession \% (Balls)} = \left(\frac{\text{4s conceded} + \text{6s conceded}}{\sum \text{legal\_balls}}\right) \times 100$$

### Multi-Wicket Spell Frequency (6-Over Cricket)
In 6-over cricket where bowlers are restricted to 1 or 2 overs maximum, taking 2+ wickets is a match-winning spell:
$$\text{Multi-Wicket Frequency} = \left(\frac{\sum \mathbb{I}(\text{wickets in spell} \ge 2)}{\text{bowling innings}}\right) \times 100$$

### Bowling Consistency Index (0–100)
Measures spell-by-spell economy variance:
$$\sigma_{\text{eco}} = \sqrt{\frac{\sum (\text{eco}_j - \bar{\text{eco}})^2}{N - 1}}$$
$$\text{Bowling Consistency Index} = \max(0, \min(100, 100 - (\sigma_{\text{eco}} \times 12)))$$

---

## 4. Situational Splits Formulas (Innings 1 vs Innings 2)

Matches are partitioned into tactical contexts using official innings number ($I \in \{1, 2\}$):

| Context | Cricket Role | Game State Dynamics |
| :--- | :--- | :--- |
| **Innings 1 Batting** | Setting Target | Building baseline score without target anchor |
| **Innings 2 Batting** | Chasing Target | Batting under scoreboard pressure and required run rate |
| **Innings 1 Bowling** | First Inning Bowling | Restricting opponent to an achievable target |
| **Innings 2 Bowling** | Defending Total | Defending a total under death-overs pressure |

Separate aggregates ($\text{Runs}, \text{Balls}, \text{Avg}, \text{SR}, \text{Boundaries}, \text{Economy}, \text{Wickets}$) are computed strictly over subsets $\{r \in \text{Records} \mid \text{innings\_number} = I\}$.

---

## 5. All-Rounder Analytics & Role Classification

### Dual-Discipline Participation
$$\text{Both Disciplines \%} = \left(\frac{|\text{Matches where Batted} \cap \text{Matches where Bowled}|}{\text{Total Matches Played}}\right) \times 100$$

### High-Impact All-Rounder Match Rate
$$\text{Impact Dual Match \%} = \left(\frac{|\{m \in \text{Matches} \mid \text{runs}_m \ge 10 \land \text{wickets}_m \ge 1\}|}{\text{Total Matches Played}}\right) \times 100$$

### 6-Tier Role Classification Decision Logic
```python
if total_balls_bowled < 6 and total_runs >= 10:
    role = "Pure Batsman"
elif total_balls_bowled < 6 and total_runs < 10:
    role = "Specialist Batsman"
elif total_balls_faced < 6 and total_balls_bowled >= 12:
    role = "Pure Bowler"
elif total_runs >= 25 and total_balls_bowled >= 18 and total_wickets >= 2:
    role = "Balanced All-Rounder"
elif total_runs >= 20 and total_balls_bowled >= 6:
    role = "Batting All-Rounder"
elif total_balls_bowled >= 12:
    role = "Bowling All-Rounder"
else:
    role = "Specialist / Emerging"
```
