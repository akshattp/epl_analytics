from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database.db import get_db
from backend.database.models import FieldingEvent, Player, Match, Innings
from backend.auth.security import get_user_from_token
from backend.analytics.advanced_analytics import (
    get_data_availability_matrix,
    get_partnership_analytics,
    get_fielding_analytics,
    get_advanced_batting_analytics,
    get_advanced_bowling_analytics,
    get_player_impact_analytics,
    get_overview_charts,
    get_player_charts,
    get_team_charts
)
from backend.analytics.intelligence_lab import (
    get_combination_intelligence,
    get_intelligence_lab_discoveries
)

router = APIRouter(prefix="/api", tags=["Advanced Analytics & Intelligence Lab"])


class ManualFieldingEntry(BaseModel):
    player_id: str
    season: int = 2026
    fielding_team: str
    dismissal_type: str # catch, caught_and_bowled, run_out, run_out_assist, stumping
    match_id: Optional[int] = None
    notes: str = ""


@router.get("/advanced/data-availability")
def api_data_availability():
    return {"matrix": get_data_availability_matrix()}


@router.get("/advanced/partnerships")
def api_partnerships(season: Optional[int] = None, db: Session = Depends(get_db)):
    return get_partnership_analytics(db, season=season)


@router.get("/advanced/fielding")
def api_fielding(season: Optional[int] = None, db: Session = Depends(get_db)):
    return get_fielding_analytics(db, season=season)


@router.post("/advanced/fielding/manual")
def api_add_manual_fielding(
    entry: ManualFieldingEntry,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication token required to record manual fielding events.")
    token = authorization.replace("Bearer ", "").strip()
    user = get_user_from_token(db, token)
    if not user or user.role != "auctioneer":
        raise HTTPException(status_code=403, detail="Only admin/auctioneer can record manual fielding events.")

    valid_types = {"catch", "caught_and_bowled", "run_out", "run_out_assist", "stumping"}
    if entry.dismissal_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid dismissal_type. Must be one of {sorted(valid_types)}")

    player = db.query(Player).filter(Player.id == entry.player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Canonical player not found.")

    match = db.query(Match).filter(Match.id == entry.match_id).first() if entry.match_id else db.query(Match).order_by(Match.id.desc()).first()
    inn = db.query(Innings).filter(Innings.match_id == match.id).first() if match else None

    ev = FieldingEvent(
        match_id=match.id if match else 1,
        innings_id=inn.id if inn else 1,
        season=entry.season,
        innings_type="Regular",
        fielding_team=entry.fielding_team,
        fielder_id=player.id,
        fielder_name=player.name,
        dismissal_type=entry.dismissal_type,
        dismissal_raw=f"Manual entry: {entry.dismissal_type} ({entry.notes})".strip(),
        is_manual_entry=True
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return {"status": "CREATED", "id": ev.id, "fielder_name": player.name, "dismissal_type": entry.dismissal_type}


@router.get("/advanced/batting")
def api_advanced_batting(season: Optional[int] = None, db: Session = Depends(get_db)):
    return get_advanced_batting_analytics(db, season=season)


@router.get("/advanced/bowling")
def api_advanced_bowling(season: Optional[int] = None, db: Session = Depends(get_db)):
    return get_advanced_bowling_analytics(db, season=season)


@router.get("/advanced/impact")
def api_player_impact(db: Session = Depends(get_db)):
    return get_player_impact_analytics(db)


@router.get("/advanced/charts/overview")
def api_charts_overview(db: Session = Depends(get_db)):
    return get_overview_charts(db)


@router.get("/advanced/charts/player/{player_id}")
def api_charts_player(player_id: str, db: Session = Depends(get_db)):
    res = get_player_charts(db, player_id)
    if not res:
        raise HTTPException(status_code=404, detail="Player not found.")
    return res


@router.get("/advanced/charts/teams")
def api_charts_teams(db: Session = Depends(get_db)):
    return get_team_charts(db)


@router.get("/intelligence-lab/combinations")
def api_combinations(
    size: int = 2,
    min_matches: int = 3,
    player_id: Optional[str] = None,
    limit: int = 30,
    db: Session = Depends(get_db)
):
    return get_combination_intelligence(db, combo_size=size, min_matches=min_matches, player_id_filter=player_id, limit=limit)


@router.get("/intelligence-lab/discoveries")
def api_discoveries(db: Session = Depends(get_db)):
    return get_intelligence_lab_discoveries(db)
