import random
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from backend.services.player_service import get_all_players_summary
from backend.database.models import AuctionTeam

def run_in_memory_auction_simulation(
    db: Session,
    strategy_mode: str = "BALANCED_COMPETITIVE"
) -> Dict[str, Any]:
    """
    Simulates a full 6-team player auction in-memory with ZERO database mutations.
    Tests AI agent bidding behaviors:
    - Team 1 & 2: Aggressive Marquee Hunters (bid up to 140% on top talent)
    - Team 3 & 4: Disciplined Value Investors (bid strictly <= 105% of valuation)
    - Team 5 & 6: Balanced Squad Builders (bid dynamically based on squad needs)
    """
    # Load 6 teams from DB as clean in-memory dicts
    db_teams = db.query(AuctionTeam).all()
    teams = []
    for t in db_teams:
        # Assign strategy
        if t.id in [1, 2]:
            strat = "Aggressive Marquee Hunter"
        elif t.id in [3, 4]:
            strat = "Disciplined Value Investor"
        else:
            strat = "Balanced Squad Builder"

        teams.append({
            "team_id": t.id,
            "team_name": t.team_name,
            "owner_name": t.owner_name,
            "strategy": strat,
            "purse_total": 100.0,
            "purse_remaining": 100.0,
            "squad_target": 8,
            "squad": [],
            "roles_count": {"All-rounder": 0, "Specialist Batsman": 0, "Specialist Bowler": 0}
        })

    # Load all 73 players
    all_players = get_all_players_summary(db)
    # Sort top players first with slight shuffle to mimic nomination flow
    pool = sorted(all_players, key=lambda p: -p["ratings"]["overall_rating"])

    rounds_log = []
    unsold_players = []

    for p in pool:
        # Check if all teams are full
        if all(len(t["squad"]) >= t["squad_target"] for t in teams):
            unsold_players.append(p)
            continue

        base_price = p["valuation"]["base_price"]
        est_val = p["valuation"]["estimated_valuation"]
        p_role = p["primary_role"]
        p_cat = p["valuation"]["category"]

        current_bid = base_price
        current_bidder = None
        bid_history = []

        # Bidding loop
        active_bidding = True
        iterations = 0

        while active_bidding and iterations < 30:
            iterations += 1
            eligible_bidders = []

            for t in teams:
                # Check squad full
                if len(t["squad"]) >= t["squad_target"]:
                    continue
                # Check reserve funds
                unfilled = t["squad_target"] - len(t["squad"]) - 1
                min_reserve = unfilled * 2.0
                max_allowed = t["purse_remaining"] - min_reserve
                
                next_bid = current_bid + 0.5 if current_bidder else current_bid
                if next_bid > max_allowed:
                    continue

                # Decision to bid based on strategy
                strat = t["strategy"]
                willingness = 1.0
                if strat == "Aggressive Marquee Hunter":
                    willingness = 1.35 if p_cat in ["Marquee / Elite", "Tier 1 (High Impact)"] else 1.05
                elif strat == "Disciplined Value Investor":
                    willingness = 1.02
                else: # Balanced
                    role_c = t["roles_count"].get(p_role, 0)
                    willingness = 1.25 if role_c < 2 else 0.95

                max_willing_price = round(est_val * willingness, 1)

                if next_bid <= max_willing_price and (current_bidder is None or current_bidder["team_id"] != t["team_id"]):
                    eligible_bidders.append((t, next_bid))

            if eligible_bidders:
                # Pick a random bidder from eligible
                chosen_team, bid_amt = random.choice(eligible_bidders)
                current_bid = round(bid_amt, 2)
                current_bidder = chosen_team
                bid_history.append({
                    "team_name": chosen_team["team_name"],
                    "bid": current_bid
                })
            else:
                active_bidding = False

        if current_bidder:
            # Award player to team
            current_bidder["purse_remaining"] = round(current_bidder["purse_remaining"] - current_bid, 2)
            current_bidder["squad"].append({
                "player_id": p["player_id"],
                "name": p["name"],
                "price": current_bid,
                "purchase_price": current_bid,
                "role": p_role,
                "rating": p["ratings"]["overall_rating"]
            })
            current_bidder["roles_count"][p_role] = current_bidder["roles_count"].get(p_role, 0) + 1

            rounds_log.append({
                "round": len(rounds_log) + 1,
                "player_id": p["player_id"],
                "player_name": p["name"],
                "category": p_cat,
                "base_price": base_price,
                "valuation": est_val,
                "sold_price": current_bid,
                "winning_team": current_bidder["team_name"],
                "bids_count": len(bid_history),
                "premium_pct": round(((current_bid - est_val) / est_val) * 100, 1)
            })
        else:
            unsold_players.append(p)

    # Calculate final squad scores
    team_results = []
    for t in teams:
        sq = t["squad"]
        avg_rating = round(sum(item["rating"] for item in sq) / len(sq), 1) if sq else 0.0
        spent = round(t["purse_total"] - t["purse_remaining"], 2)
        team_results.append({
            "team_id": t["team_id"],
            "team_name": t["team_name"],
            "owner_name": t["owner_name"],
            "strategy": t["strategy"],
            "strategy_archetype": t["strategy"],
            "squad_count": len(sq),
            "purse_spent": spent,
            "purse_remaining": t["purse_remaining"],
            "average_squad_rating": avg_rating,
            "squad": sq
        })

    total_spent = round(sum(tr["purse_spent"] for tr in team_results), 2)
    return {
        "simulation_status": "COMPLETED",
        "mode": strategy_mode,
        "total_players_nominated": len(pool),
        "total_players_sold": len(rounds_log),
        "total_players_unsold": len(unsold_players),
        "total_purse_spent": total_spent,
        "summary": {
            "total_players_nominated": len(pool),
            "total_players_sold": len(rounds_log),
            "total_players_unsold": len(unsold_players),
            "total_purse_spent": total_spent
        },
        "teams": team_results,
        "rounds_sample": rounds_log[:15]
    }
