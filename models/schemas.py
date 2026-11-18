from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class BattingRecord(BaseModel):
    batting_position: int
    player_id: str
    player_name: str
    runs: int
    balls: int
    minutes: int = 0
    fours: int = 0
    sixes: int = 0
    strike_rate: float
    dismissal: str
    is_not_out: bool

class BowlingRecord(BaseModel):
    bowling_order: int
    player_id: str
    player_name: str
    overs: float
    legal_balls: int
    maidens: int = 0
    runs_conceded: int
    wickets: int
    dot_balls: int = 0
    economy: float

class PlayerRatingsSchema(BaseModel):
    batting_rating: float
    bowling_rating: float
    all_rounder_rating: float
    consistency_rating: float
    knockout_rating: float
    overall_rating: float
    primary_role: str
    secondary_roles: List[str]

class PlayerValuationSchema(BaseModel):
    category: str
    base_price: float
    estimated_valuation: float
    valuation_range: str
    scarcity_multiplier: float
    knockout_premium: float
    strengths: List[str]
    weaknesses: List[str]
