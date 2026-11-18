from typing import Dict, Any, List

# Standard budget per franchise: 100.0 auction points
BASE_PURSE_PER_TEAM = 100.0
BASE_PRICE_BY_CATEGORY = {
    "Marquee / Elite": 12.0,
    "Tier 1 (High Impact)": 8.0,
    "Tier 2 (Solid Core)": 5.0,
    "Role Specialist": 3.0,
    "Uncapped / New": 2.0
}

def determine_player_category(overall_rating: float, is_new_player: bool = False, trial_rating: float = None) -> str:
    """Categorizes player based on verified performance rating or trial rating."""
    if is_new_player:
        if trial_rating and trial_rating >= 75.0:
            return "Uncapped (High Potential)"
        return "Uncapped / New"
    
    if overall_rating >= 75.0:
        return "Marquee / Elite"
    elif overall_rating >= 58.0:
        return "Tier 1 (High Impact)"
    elif overall_rating >= 42.0:
        return "Tier 2 (Solid Core)"
    else:
        return "Role Specialist"

def calculate_player_valuation(
    player_id: str,
    overall_rating: float,
    primary_role: str,
    ratings: Dict[str, Any],
    is_new: bool = False,
    trial_rating: float = None
) -> Dict[str, Any]:
    """
    Transparent mathematical auction valuation in auction units/points (0 to ~25.0 max).
    Separates statistical performance rating from financial scarcity valuation.
    """
    category = determine_player_category(overall_rating, is_new, trial_rating)
    base_price = BASE_PRICE_BY_CATEGORY.get(category, 2.0)
    
    if is_new:
        effective_rating = trial_rating if trial_rating is not None else 50.0
        scarcity_multiplier = 1.0
        knockout_premium = 0.0
        confidence = "Unverified (New Registration)"
        est_valuation = round(base_price * (effective_rating / 50.0), 1)
    else:
        effective_rating = overall_rating
        # Scarcity multiplier: All-rounders & death bowlers carry high premium in 6-over games
        if primary_role == "All-rounder":
            scarcity_multiplier = 1.25 # 25% scarcity premium
        elif primary_role == "Specialist Bowler" and ratings.get("bowling_rating", 0) >= 55:
            scarcity_multiplier = 1.15
        else:
            scarcity_multiplier = 1.05

        # Knockout big-match premium
        ko_rating = ratings.get("knockout_rating", 50.0)
        knockout_premium = max(0.0, (ko_rating - 60.0) * 0.1) # Up to ~3.5 pts
        
        # Performance base valuation
        perf_component = (effective_rating / 100.0) * 16.0 # Max ~16 pts
        est_valuation = round((base_price + perf_component + knockout_premium) * scarcity_multiplier, 1)
        # Cap realistic valuation within 100-pt team purse
        est_valuation = min(28.0, max(base_price, est_valuation))
        confidence = "High (Historical Match Records)"

    # Strengths & Weaknesses derivation
    strengths = []
    weaknesses = []
    bat_r = ratings.get("batting_rating", 0)
    bowl_r = ratings.get("bowling_rating", 0)
    cons_r = ratings.get("consistency_rating", 50)
    
    if bat_r >= 50: strengths.append("Proven high-velocity batting and power hitting")
    elif bat_r < 25 and not is_new: weaknesses.append("Limited batting scoring volume")
    
    if bowl_r >= 50: strengths.append("Disciplined economy and reliable wicket-taking ability")
    elif bowl_r < 25 and not is_new: weaknesses.append("Rarely bowls or high boundary concession rate")
    
    if cons_r >= 65: strengths.append("Consistent match-to-match reliability")
    elif cons_r < 40 and not is_new: weaknesses.append("High score volatility across innings")

    if not strengths: strengths.append("Solid squad depth and role versatility")
    if not weaknesses: weaknesses.append("Requires active game-plan positioning")

    return {
        "category": category,
        "base_price": base_price,
        "estimated_valuation": est_valuation,
        "valuation_range": f"{round(est_valuation * 0.85, 1)} - {round(est_valuation * 1.15, 1)}",
        "scarcity_multiplier": scarcity_multiplier if not is_new else 1.0,
        "knockout_premium": round(knockout_premium, 1) if not is_new else 0.0,
        "valuation_confidence": confidence,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "formula": "Valuation = (Base_Price + (Overall_Rating / 100 * 16) + Knockout_Premium) * Scarcity_Multiplier"
    }
