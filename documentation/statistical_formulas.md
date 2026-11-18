# EPL Cricket Analytics — Statistical Methodology & Formulas

This document details the mathematical and statistical formulations implemented across the **Exotica Premier League (EPL)** cricket analytics and player auction intelligence engine.

---

## 1. Underarm Cricket Overs & Balls Normalization

In 6-over underarm cricket, overs are represented in cricket notation (e.g., `5.4` overs means 5 completed overs and 4 additional legal balls):

$$\text{Legal Balls} = (\lfloor\text{Overs}\rfloor \times 6) + \text{round}((\text{Overs} - \lfloor\text{Overs}\rfloor) \times 10)$$

$$\text{Overs Representation} = \left\lfloor\frac{\text{Balls}}{6}\right\rfloor + \frac{\text{Balls} \pmod 6}{10}$$

*Example*: $5.4\text{ overs} = (5 \times 6) + 4 = 34\text{ legal deliveries}$.

---

## 2. Fundamental Cricket Metrics (Recalculated from Aggregates)

To preserve mathematical truth, averages and rates are **never calculated by averaging season averages**. They are strictly calculated from aggregate sum totals:

### Batting Average:
$$\text{Batting Average} = \frac{\sum \text{Runs}}{\max(1, \sum \text{Dismissals})}$$
*Note*: `not out` and `retired hurt` do not count as dismissals.

### Strike Rate:
$$\text{Strike Rate} = \left(\frac{\sum \text{Runs}}{\sum \text{Balls Faced}}\right) \times 100$$

### Boundary Percentage:
$$\text{Boundary \%} = \left(\frac{(\sum \text{Fours} \times 4) + (\sum \text{Sixes} \times 6)}{\sum \text{Runs}}\right) \times 100$$

### Balls Per Boundary:
$$\text{Balls Per Boundary} = \frac{\sum \text{Balls Faced}}{\sum \text{Fours} + \sum \text{Sixes}}$$

### Bowling Economy Rate (Runs Per Over):
$$\text{Economy Rate} = \frac{\sum \text{Runs Conceded}}{\sum \text{Legal Balls} / 6.0}$$

### Bowling Average & Strike Rate:
$$\text{Bowling Average} = \frac{\sum \text{Runs Conceded}}{\sum \text{Wickets}}$$
$$\text{Bowling Strike Rate} = \frac{\sum \text{Legal Balls}}{\sum \text{Wickets}}$$

### Dot Ball Percentage:
$$\text{Dot Ball \%} = \left(\frac{\sum \text{Dot Balls}}{\sum \text{Legal Balls}}\right) \times 100$$

---

## 3. Transparent 100-Point Rating System

To eliminate arbitrary scoring, ratings out of 100 are computed using normalized components with **Bayesian opportunity shrinkage** to account for small sample sizes in short tournaments.

### Batting Rating ($0 - 100$):
$$\text{Raw Batting} = \text{Volume}[35] + \text{Velocity}[35] + \text{Reliability}[15] + \text{Boundary}[15]$$
$$\text{Batting Rating} = \text{Raw Batting} \times \left(\frac{\text{Innings}}{\text{Innings} + 2.0}\right)$$
- **Volume [35 pts]**: $\min\left(35, \frac{\text{Runs/Innings}}{15.0} \times 35\right)$
- **Velocity [35 pts]**: $\min\left(35, \frac{\text{Strike Rate}}{130.0} \times 35\right)$
- **Reliability [15 pts]**: $\min\left(15, \frac{\text{Batting Average}}{20.0} \times 15\right)$
- **Boundary Prowess [15 pts]**: $\min\left(15, \frac{\text{Boundary \%}}{50.0} \times 15\right)$

### Bowling Rating ($0 - 100$):
$$\text{Raw Bowling} = \text{Wickets}[40] + \text{Economy}[35] + \text{Dots}[15] + \text{MultiWkts}[10]$$
$$\text{Bowling Rating} = \text{Raw Bowling} \times \left(\frac{\text{Balls}}{\text{Balls} + 12.0}\right)$$
- **Wicket Threat [40 pts]**: $\min\left(40, \frac{\text{Wickets/Over}}{0.7} \times 40\right)$
- **Economy Control [35 pts]**: $\max\left(0, \min\left(35, \frac{8.5 - \text{Economy}}{4.5} \times 35\right)\right)$
- **Dot Ball Suppression [15 pts]**: $\min\left(15, \frac{\text{Dot \%}}{50.0} \times 15\right)$
- **Multi-Wicket Impact [10 pts]**: $\min(10, \text{TwoPlusWickets} \times 5.0)$

### All-Rounder Rating ($0 - 100$):
For players with contributions in both disciplines, the score uses a weighted harmonic mean:
$$\text{All-Rounder Rating} = 2 \times \frac{\text{BatRating} \times \text{BowlRating}}{\text{BatRating} + \text{BowlRating}} \times \left(0.8 + 0.2 \times \frac{\min(\text{BatRating}, \text{BowlRating})}{\max(\text{BatRating}, \text{BowlRating})}\right)$$

### Overall EPL Rating ($0 - 100$):
Weighted by primary role:
- **Specialist Batsman**: $0.65 \times \text{Bat} + 0.15 \times \text{Bowl} + 0.10 \times \text{Consistency} + 0.10 \times \text{Knockout}$
- **Specialist Bowler**: $0.65 \times \text{Bowl} + 0.15 \times \text{Bat} + 0.10 \times \text{Consistency} + 0.10 \times \text{Knockout}$
- **All-Rounder**: $0.40 \times \text{Bat} + 0.40 \times \text{Bowl} + 0.10 \times \text{Consistency} + 0.10 \times \text{Knockout}$

---

## 4. Player Similarity & Clustering Engine

Player similarity uses feature normalization via `StandardScaler` followed by **cosine distance** in $n$-dimensional performance space:

$$\text{Similarity}(\vec{A}, \vec{B}) = \frac{\vec{A} \cdot \vec{B}}{\|\vec{A}\| \|\vec{B}\|}$$

Cohorts:
1. **Explosive Batters**: Strike Rate $\ge 105.0$, Boundary $\% \ge 30.0\%$.
2. **Consistent Batters**: Batting Average $\ge 12.0$, Innings $\ge 3$.
3. **Finishers**: Strike Rate $\ge 95.0$, Not-Out rate or late order acceleration.
4. **Wicket-Taking Bowlers**: Wickets $\ge 3$, Bowling Strike Rate $\le 12.0$ balls/wkt.
5. **Economical Bowlers**: Economy $\le 5.2$ RPO, Deliveries $\ge 12$ balls.
6. **All-Rounders**: All-Rounder Rating $\ge 30.0$, Runs $\ge 15$, Deliveries $\ge 12$ balls.
7. **High-Impact Players**: Overall Rating $\ge 55.0$, Matches $\ge 3$.

---

## 5. Auction Valuation Framework

Auction Valuation is kept mathematically distinct from Performance Rating:

$$\text{Valuation} = \left(\text{Base Price} + \frac{\text{Overall Rating}}{100} \times 16.0 + \text{Knockout Premium}\right) \times \text{Scarcity Multiplier}$$

- **Base Price**: Calibrated by tier (Elite: 12.0 pts, Tier 1: 8.0 pts, Tier 2: 5.0 pts, Specialist: 3.0 pts, Uncapped: 2.0 pts).
- **Scarcity Multiplier**: All-rounders ($1.25\times$), Frontline strike bowlers ($1.15\times$), Batsmen ($1.05\times$).
- **Knockout Premium**: Up to $+3.5$ pts for verified playoff match-winners.
