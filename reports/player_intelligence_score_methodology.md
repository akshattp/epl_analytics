# EPL v1.3 — Player Intelligence Score (PIS) Methodology

**Framework:** EPL Multi-Pillar Player Intelligence Engine  
**Scale:** Normalized 0–100 Points  
**Version:** 1.3.0  
**Design Principle:** Rigorous Explainability, Adaptive Role-Based Weighting, and Zero-Fabrication Missing Discipline Handling.

---

## 1. Core Mathematical Philosophy

The **EPL Player Intelligence Score (PIS)** transforms traditional raw cricket statistics into an explainable, multi-pillar evaluation suite.

Unlike naive scoring algorithms that penalize pure batsmen for not bowling (or pure bowlers for not batting) by imputing zeros, the EPL PIS dynamically adapts its weights to the player's observed tactical role. Furthermore, Bayesian opportunity shrinkage prevents small-sample anomalies (e.g., a batter who hit 15 runs in 6 balls once) from outranking proven multi-season veterans.

---

## 2. The Five Intelligence Pillars (0–100 Scale)

### Pillar 1: Batting Intelligence Score (BIS)
Evaluates volume, scoring velocity, dismissal resistance, and boundary prowess:

$$\text{Raw BIS} = C_{\text{vol}} + C_{\text{vel}} + C_{\text{rel}} + C_{\text{bnd}}$$

Where:
- **Scoring Volume ($C_{\text{vol}}$, max 25 pts):** $\min\left(25, \frac{\text{Runs}}{50} \times 25\right)$ *(50 career runs benchmark)*
- **Scoring Velocity ($C_{\text{vel}}$, max 35 pts):** $\min\left(35, \frac{\text{SR}}{140} \times 35\right)$ *(140 strike rate benchmark)*
- **Reliability & Average ($C_{\text{rel}}$, max 25 pts):** $\min\left(25, \frac{\text{Avg}}{18} \times 25\right)$ *(18 batting average benchmark)*
- **Boundary Prowess ($C_{\text{bnd}}$, max 15 pts):** $\min\left(15, \frac{\text{Boundary Runs \%}}{50} \times 15\right)$ *(50% boundary share)*

**Bayesian Opportunity Shrinkage:**
$$\text{Weight}_{\text{bat}} = \frac{\text{Innings}}{\text{Innings} + 2.0}$$
$$\text{BIS} = \text{round}(\text{Raw BIS} \times \text{Weight}_{\text{bat}}, 1)$$
*(If $\text{Innings} = 0$, $\text{BIS} = \text{None}$; the player is not penalized in overall scoring).*

---

### Pillar 2: Bowling Intelligence Score (BoIS)
Evaluates wicket threat, economy run-suppression, dot-ball dominance, and multi-wicket spell ability:

$$\text{Raw BoIS} = C_{\text{wkt}} + C_{\text{eco}} + C_{\text{dot}} + C_{\text{multi}}$$

Where:
- **Wicket Threat ($C_{\text{wkt}}$, max 35 pts):** $\min\left(35, \frac{\text{Wkts/Over}}{0.65} \times 35\right)$ *(0.65 wickets/over is elite)*
- **Economy Control ($C_{\text{eco}}$, max 35 pts):** $\max\left(0, \min\left(35, \frac{8.5 - \text{Economy}}{4.5} \times 35\right)\right)$ *(<4.0 RPO = 35 pts; >8.5 RPO = 0)*
- **Dot-Ball Suppression ($C_{\text{dot}}$, max 15 pts):** $\min\left(15, \frac{\text{Dot Ball \%}}{50} \times 15\right)$ *(50% dot balls is elite)*
- **Multi-Wicket Impact ($C_{\text{multi}}$, max 15 pts):** $\min(15, \text{TwoPlusWickets} \times 7.5)$ *(2+ wickets in a spell)*

**Bayesian Opportunity Shrinkage:**
$$\text{Weight}_{\text{bowl}} = \frac{\text{Legal Balls}}{\text{Legal Balls} + 12.0}$$
$$\text{BoIS} = \text{round}(\text{Raw BoIS} \times \text{Weight}_{\text{bowl}}, 1)$$
*(If $\text{Legal Balls} = 0$, $\text{BoIS} = \text{None}$; the player is not penalized in overall scoring).*

---

### Pillar 3: All-Rounder Intelligence Score (AIS)
Evaluates genuine two-way match balance using a Harmonic Mean scaled by discipline balance and dual-match frequency:

If $\text{BIS} > 10.0$ and $\text{BoIS} > 10.0$:
$$\text{Harmonic Base} = \frac{2 \times \text{BIS} \times \text{BoIS}}{\text{BIS} + \text{BoIS}}$$
$$\text{Balance Ratio} = \frac{\min(\text{BIS}, \text{BoIS})}{\max(\text{BIS}, \text{BoIS})}$$
$$\text{Multiplier} = 0.8 + 0.2 \times \text{Balance Ratio} + 0.1 \times \min\left(1.0, \frac{\text{Impact Dual Match \%}}{25}\right)$$
$$\text{AIS} = \min(100.0, \text{Harmonic Base} \times \text{Multiplier})$$
Else:
$$\text{AIS} = \max(\text{BIS}, \text{BoIS}) \times 0.25$$

---

### Pillar 4: Consistency Intelligence Score (CIS)
Combines batting score consistency and bowling economy consistency:
$$\text{CIS} = \begin{cases}
(\text{Batting Consistency} \times 0.5) + (\text{Bowling Consistency} \times 0.5) & \text{if both active} \\
\text{Batting Consistency} & \text{if only batting active} \\
\text{Bowling Consistency} & \text{if only bowling active} \\
50.0 & \text{if baseline}
\end{cases}$$

---

### Pillar 5: Match Impact Intelligence Score (MIS)
Measures game-changing events:
$$\text{Impact Points} = 20.0 + \min(30, 15\text{+ Scores} \times 6 + 20\text{+ Scores} \times 8) + \min(30, \text{MultiWkts} \times 12) + \min(20, \text{KO Runs} \times 1.5 + \text{KO Wkts} \times 6)$$
$$\text{MIS} = \max(10.0, \min(100.0, \text{Impact Points}))$$

---

## 3. Adaptive Role-Based Weighting (Zero-Fabrication Guarantee)

The overall Player Intelligence Score (PIS) applies weights that correspond to the player's data-driven role:

| Tactical Role | BIS Weight | BoIS Weight | AIS Weight | CIS Weight | MIS Weight |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Pure Batsman** | **65%** | **0% (Excluded)** | **0%** | **15%** | **20%** |
| **Pure Bowler** | **0% (Excluded)** | **65%** | **0%** | **15%** | **20%** |
| **Balanced All-Rounder** | **25%** | **25%** | **35%** | **7.5%** | **7.5%** |
| **Batting All-Rounder** | **45%** | **20%** | **15%** | **10%** | **10%** |
| **Bowling All-Rounder** | **20%** | **45%** | **15%** | **10%** | **10%** |
| **Specialist / Emerging** | **70% (Lead Craft)**| — | — | — | **30% (Impact)** |

$$\text{PIS} = \text{round}(\max(10.0, \min(99.0, \sum w_i \times S_i)), 1)$$

---

## 4. Sample Size Confidence Safeguards

Every player receives a transparent statistical confidence indicator:

| Confidence Level | Required Criteria | Interpretation |
| :---: | :--- | :--- |
| **HIGH** | $\ge 5$ matches **AND** ($\ge 4$ innings **OR** $\ge 24$ balls bowled) | Statistically verified over extensive tournament play |
| **MEDIUM** | $\ge 2$ matches **AND** ($\ge 2$ innings **OR** $\ge 12$ balls bowled) | Moderate sample; performance trends established |
| **LOW** | $< 2$ matches **OR** ($< 2$ innings **AND** $< 12$ balls bowled) | Limited sample; subject to trial ratings and regression |

---

## 5. 6-Axis Visual Performance Radar

The engine generates 6 standardized dimensions ($0–100$) for visual radar charts:

1. **Batting Power:** $\min\left(100, \frac{\text{SR}}{150} \times 60 + \frac{\text{Boundary Runs \%}}{50} \times 40\right)$
2. **Batting Reliability:** $\min\left(100, \frac{\text{Avg}}{18} \times 60 + \text{Not-Out \%} \times 0.4\right)$
3. **Bowling Economy:** $\max\left(0, \min\left(100, \frac{8.5 - \text{Economy}}{4.5} \times 100\right)\right)$
4. **Bowling Penetration:** $\min\left(100, \frac{\text{Wickets/Over}}{0.65} \times 100\right)$
5. **Match Impact:** Equals MIS (0–100)
6. **Consistency:** Equals CIS (0–100)
