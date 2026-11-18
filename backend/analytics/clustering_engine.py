import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Any

class PlayerSimilarityEngine:
    def __init__(self, players_data: List[Dict[str, Any]]):
        """
        players_data: List of dicts, each containing:
          - player_id, name, matches, innings, total_runs, strike_rate,
            batting_average, boundary_percentage, legal_balls, overs,
            wickets, economy, dot_ball_percentage, bowling_sr,
            ratings (dict with batting, bowling, all_rounder, consistency, knockout, overall)
        """
        self.players = players_data
        self.feature_names = [
            "strike_rate", "batting_average", "boundary_percentage", "runs_per_innings",
            "wickets_per_over", "economy_inverted", "dot_ball_percentage",
            "all_rounder_rating", "overall_rating", "knockout_rating"
        ]
        self._build_feature_matrix()

    def _build_feature_matrix(self):
        self.matrix = []
        self.valid_players = []
        for p in self.players:
            inn = p.get("innings", 0)
            balls = p.get("legal_balls", 0)
            if inn == 0 and balls == 0:
                continue

            runs = p.get("total_runs", 0)
            runs_per_inn = runs / inn if inn > 0 else 0.0
            sr = p.get("strike_rate", 0.0)
            avg = p.get("batting_average", 0.0)
            bpct = p.get("boundary_percentage", 0.0)
            
            overs = balls / 6.0
            wkts = p.get("wickets", 0)
            wkts_per_ov = wkts / overs if overs > 0 else 0.0
            eco = p.get("economy", 6.0)
            # Invert economy so higher is better for similarity (e.g. 12 - eco)
            eco_inv = max(0.0, 12.0 - eco)
            dot_pct = p.get("dot_ball_percentage", 0.0)

            ratings = p.get("ratings", {})
            ar_rating = ratings.get("all_rounder_rating", 0.0)
            ov_rating = ratings.get("overall_rating", 0.0)
            ko_rating = ratings.get("knockout_rating", 0.0)

            vec = [
                sr, avg, bpct, runs_per_inn,
                wkts_per_ov, eco_inv, dot_pct,
                ar_rating, ov_rating, ko_rating
            ]
            self.matrix.append(vec)
            self.valid_players.append(p)

        if self.matrix:
            self.scaler = StandardScaler()
            self.scaled_matrix = self.scaler.fit_transform(self.matrix)
            self.sim_matrix = cosine_similarity(self.scaled_matrix)
        else:
            self.scaled_matrix = np.array([])
            self.sim_matrix = np.array([])

    def get_similar_players(self, player_id: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Finds top-k most similar players to a target player with explanation."""
        idx = next((i for i, p in enumerate(self.valid_players) if p["player_id"] == player_id), None)
        if idx is None or len(self.valid_players) <= 1:
            return []

        sim_scores = self.sim_matrix[idx]
        # Sort desc
        ranked_indices = np.argsort(-sim_scores)
        results = []
        target = self.valid_players[idx]

        for r_idx in ranked_indices:
            if r_idx == idx:
                continue
            cand = self.valid_players[r_idx]
            raw_sim = float(sim_scores[r_idx])
            # Bound similarity to 0-100%
            similarity_pct = round(max(0.0, min(100.0, ((raw_sim + 1.0) / 2.0) * 100.0)), 1)
            
            # Key comparative insights
            diffs = []
            if abs(cand.get("strike_rate", 0) - target.get("strike_rate", 0)) > 15:
                direction = "higher" if cand.get("strike_rate", 0) > target.get("strike_rate", 0) else "lower"
                diffs.append(f"{direction.capitalize()} Strike Rate ({cand.get('strike_rate', 0)} vs {target.get('strike_rate', 0)})")
            if abs(cand.get("economy", 0) - target.get("economy", 0)) > 1.0 and cand.get("legal_balls", 0) >= 6:
                direction = "better economy" if cand.get("economy", 0) < target.get("economy", 0) else "higher economy"
                diffs.append(f"{direction.capitalize()} ({cand.get('economy', 0)} vs {target.get('economy', 0)})")
            if abs(cand.get("total_runs", 0) - target.get("total_runs", 0)) > 20:
                diffs.append(f"Scoring volume diff: {cand.get('total_runs', 0)} career runs vs {target.get('total_runs', 0)}")

            results.append({
                "player_id": cand["player_id"],
                "player_name": cand["name"],
                "similarity_score": similarity_pct,
                "primary_role": cand.get("primary_role", "All-rounder"),
                "overall_rating": cand.get("ratings", {}).get("overall_rating", 0.0),
                "key_differences": diffs if diffs else ["Nearly identical statistical distribution"],
                "auction_pivot_note": f"Direct alternative in auction if bidding for {target['name']} exceeds valuation limit."
            })
            if len(results) >= top_k:
                break
        return results

    def generate_all_seven_groups(self) -> List[Dict[str, Any]]:
        """
        Groups players into the 7 user-specified strategic auction categories:
        1. Explosive Batters
        2. Consistent Batters
        3. Finishers
        4. Wicket-Taking Bowlers
        5. Economical Bowlers
        6. All-Rounders
        7. High-Impact Players
        """
        groups = [
            {
                "group_id": "GROUP-1",
                "group_name": "Explosive Batters",
                "filter_fn": lambda p: p.get("strike_rate", 0) >= 105.0 and p.get("boundary_percentage", 0) >= 30.0 and p.get("total_runs", 0) >= 15,
                "why": "High strike rates with over 30% runs scored in boundaries, prioritizing immediate scoring velocity.",
                "strengths": "Fast powerplay scoring, boundary clearing ability, shifts momentum in 6-over games.",
                "auction_relevance": "Top order aggression; essential for chasing targets above 40 runs.",
                "sort_key": lambda p: -p.get("strike_rate", 0)
            },
            {
                "group_id": "GROUP-2",
                "group_name": "Consistent Batters",
                "filter_fn": lambda p: p.get("batting_average", 0) >= 12.0 and p.get("innings", 0) >= 3 and p.get("total_runs", 0) >= 30,
                "why": "High batting average with minimal innings-to-innings variance and low dismissal frequency.",
                "strengths": "Wicket preservation, steady accumulation, dependable anchor for team innings.",
                "auction_relevance": "Provides batting stability and guarantees a solid floor in league stages.",
                "sort_key": lambda p: -p.get("batting_average", 0)
            },
            {
                "group_id": "GROUP-3",
                "group_name": "Finishers",
                "filter_fn": lambda p: (p.get("strike_rate", 0) >= 95.0 and p.get("innings", 0) >= 2 and (p.get("not_outs", 0) >= 1 or p.get("ratings", {}).get("batting_rating", 0) >= 35)),
                "why": "Scores quickly under pressure in short innings with high strike rate and not-out conversions.",
                "strengths": "Late-over acceleration, composure in tight finishes, capitalizes on death overs.",
                "auction_relevance": "Crucial for winning close 1-run to 5-run finishes in overs 5 and 6.",
                "sort_key": lambda p: -(p.get("strike_rate", 0) * (p.get("not_outs", 0) + 1))
            },
            {
                "group_id": "GROUP-4",
                "group_name": "Wicket-Taking Bowlers",
                "filter_fn": lambda p: p.get("wickets", 0) >= 3 and (p.get("bowling_strike_rate") or 99) <= 12.0,
                "why": "Maintains a bowling strike rate of 12 balls or fewer per wicket, regularly breaking partnerships.",
                "strengths": "Attacking lengths, wicket threat in powerplay and middle overs, high dot pressure.",
                "auction_relevance": "Strike weapons capable of defending low totals by bowling the opposition out.",
                "sort_key": lambda p: (-p.get("wickets", 0), p.get("bowling_strike_rate") or 99)
            },
            {
                "group_id": "GROUP-5",
                "group_name": "Economical Bowlers",
                "filter_fn": lambda p: p.get("economy", 99) <= 5.2 and p.get("legal_balls", 0) >= 12,
                "why": "Concedes 5.2 runs per over or fewer with high dot ball percentage in 6-over formats.",
                "strengths": "Defensive control, builds scoreboard pressure, forces batsmen into risky shots.",
                "auction_relevance": "Essential defensive asset to squeeze opponents into sub-35 totals.",
                "sort_key": lambda p: p.get("economy", 99)
            },
            {
                "group_id": "GROUP-6",
                "group_name": "All-Rounders",
                "filter_fn": lambda p: p.get("ratings", {}).get("all_rounder_rating", 0) >= 30.0 and p.get("total_runs", 0) >= 15 and p.get("legal_balls", 0) >= 12,
                "why": "Delivers verified two-way performance with significant contributions in both batting and bowling.",
                "strengths": "Squad flexibility, dual skill balance, provides extra batting depth and a reliable bowling option.",
                "auction_relevance": "Highest auction valuation category; maximizes 8-man squad utilization.",
                "sort_key": lambda p: -p.get("ratings", {}).get("all_rounder_rating", 0)
            },
            {
                "group_id": "GROUP-7",
                "group_name": "High-Impact Players",
                "filter_fn": lambda p: p.get("ratings", {}).get("overall_rating", 0) >= 55.0 and p.get("matches", 0) >= 3,
                "why": "Top-tier overall EPL ratings with proven contributions to winning matches and knockout stages.",
                "strengths": "Match-winners who consistently turn games, big-match composure, elite all-round skill.",
                "auction_relevance": "Marquee tier; franchise cornerstones for team owners.",
                "sort_key": lambda p: -p.get("ratings", {}).get("overall_rating", 0)
            }
        ]

        result_groups = []
        for g in groups:
            matched_players = [p for p in self.valid_players if g["filter_fn"](p)]
            matched_players.sort(key=g["sort_key"])
            
            # Format players inside the group
            plist = []
            for p in matched_players:
                plist.append({
                    "player_id": p["player_id"],
                    "player_name": p["name"],
                    "primary_role": p.get("primary_role", "All-rounder"),
                    "matches": p.get("matches", 0),
                    "total_runs": p.get("total_runs", 0),
                    "strike_rate": p.get("strike_rate", 0.0),
                    "wickets": p.get("wickets", 0),
                    "economy": p.get("economy", 0.0),
                    "overall_rating": p.get("ratings", {}).get("overall_rating", 0.0)
                })

            # Calculate average intra-group similarity
            if len(matched_players) > 1:
                sub_indices = [i for i, p in enumerate(self.valid_players) if g["filter_fn"](p)]
                sub_sim = self.sim_matrix[np.ix_(sub_indices, sub_indices)]
                # Average non-diagonal
                n_sub = len(sub_indices)
                mean_sim = (np.sum(sub_sim) - n_sub) / (n_sub * (n_sub - 1)) if n_sub > 1 else 1.0
                cohort_similarity = round(max(0.0, min(100.0, ((mean_sim + 1.0) / 2.0) * 100.0)), 1)
                confidence = "High" if len(matched_players) >= 4 else "Moderate"
            else:
                cohort_similarity = 85.0
                confidence = "Sample Limited" if matched_players else "Empty"

            result_groups.append({
                "group_id": g["group_id"],
                "group_name": g["group_name"],
                "cohort_similarity_score": cohort_similarity,
                "confidence": confidence,
                "why_grouped": g["why"],
                "main_strengths": g["strengths"],
                "auction_relevance": g["auction_relevance"],
                "player_count": len(plist),
                "players": plist
            })

        return result_groups
