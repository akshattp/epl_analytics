import json
from fastapi import APIRouter, Depends, HTTPException, Header, WebSocket, WebSocketDisconnect, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from backend.database.db import get_db, SessionLocal
from backend.auth.security import get_user_from_token
from backend.auction.intelligence_service import get_owner_dashboard, get_player_scarcity_insight
from backend.auction.simulation_engine import run_in_memory_auction_simulation
from backend.database.models import (
    AuctionTeam, AuctionShortlist, AuctionSquadMember, AuctionBidAudit, AuctionConfig, AuctionPoolEntry, Player
)
from backend.services.player_service import get_all_players_summary, get_player_full_profile
from backend.auction.live_auction_manager import auction_manager

router = APIRouter(prefix="/api/auction", tags=["Auction"])


def _require_user(authorization: Optional[str], db: Session):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication token required.")
    token = authorization.replace("Bearer ", "").strip()
    user = get_user_from_token(db, token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session token.")
    return user


def _require_team_owner_access(team_id: int, authorization: Optional[str], db: Session, allow_auctioneer: bool = False):
    user = _require_user(authorization, db)
    if user.role == "auctioneer":
        if allow_auctioneer:
            return user
        raise HTTPException(status_code=403, detail="Private franchise shortlists are strictly restricted to their respective team owner.")
    if user.team_id != team_id:
        raise HTTPException(status_code=403, detail=f"Access denied: You can only access or modify data for your own franchise (Team {user.team_id}).")
    return user

class ShortlistCreate(BaseModel):
    team_id: int
    player_id: str
    priority: str = "Medium"
    max_target_bid: float = 12.0
    notes: str = ""

class SquadBalanceRequest(BaseModel):
    team_id: int
    player_ids: List[str]

@router.get("/players")
def get_auction_players(
    category: Optional[str] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db)
):
    all_players = get_all_players_summary(db)
    
    auction_pool = []
    for p in all_players:
        val = p["valuation"]
        if category and val["category"] != category:
            continue
        if role and p["primary_role"] != role:
            continue
            
        auction_pool.append({
            "player_id": p["player_id"],
            "name": p["name"],
            "batting_hand": p["batting_hand"],
            "primary_role": p["primary_role"],
            "secondary_roles": p["secondary_roles"],
            "is_new_player": p["is_new_player"],
            "category": val["category"],
            "base_price": val["base_price"],
            "estimated_valuation": val["estimated_valuation"],
            "valuation_range": val["valuation_range"],
            "scarcity_multiplier": val["scarcity_multiplier"],
            "overall_rating": p["ratings"]["overall_rating"],
            "batting_rating": p["ratings"]["batting_rating"],
            "bowling_rating": p["ratings"]["bowling_rating"],
            "all_rounder_rating": p["ratings"]["all_rounder_rating"],
            "matches": p["matches"],
            "total_runs": p["total_runs"],
            "strike_rate": p["strike_rate"],
            "wickets": p["wickets"],
            "economy": p["economy"],
            "strengths": val["strengths"],
            "weaknesses": val["weaknesses"]
        })

    # Sort by valuation descending
    auction_pool.sort(key=lambda x: -x["estimated_valuation"])
    return {
        "count": len(auction_pool),
        "players": auction_pool
    }

@router.get("/teams")
def get_auction_teams(db: Session = Depends(get_db)):
    teams = db.query(AuctionTeam).all()
    result = []
    for t in teams:
        members = db.query(AuctionSquadMember, Player).join(Player, AuctionSquadMember.player_id == Player.id)\
                    .filter(AuctionSquadMember.team_id == t.id).all()
        squad_list = []
        for sm, p in members:
            squad_list.append({
                "id": sm.id,
                "player_id": p.id,
                "player_name": p.name,
                "role": p.primary_role,
                "purchase_price": sm.purchase_price
            })
        result.append({
            "team_id": t.id,
            "team_name": t.team_name,
            "owner_name": t.owner_name,
            "purse_total": t.purse_total,
            "purse_spent": t.purse_spent,
            "purse_remaining": round(t.purse_total - t.purse_spent, 1),
            "squad_size": len(squad_list),
            "max_squad_size": t.max_squad_size,
            "squad": squad_list
        })
    return {
        "teams": result
    }

@router.get("/shortlists/{team_id}")
def get_team_shortlist(
    team_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    _require_team_owner_access(team_id, authorization, db, allow_auctioneer=False)
    items = db.query(AuctionShortlist, Player).join(Player, AuctionShortlist.player_id == Player.id)\
              .filter(AuctionShortlist.team_id == team_id).all()
    result = []
    for sl, p in items:
        prof = get_player_full_profile(db, p.id)
        result.append({
            "shortlist_id": sl.id,
            "team_id": sl.team_id,
            "player_id": p.id,
            "player_name": p.name,
            "priority": sl.priority,
            "max_target_bid": sl.max_target_bid,
            "notes": sl.notes,
            "rating": prof["ratings"]["overall_rating"] if prof else 0.0,
            "role": prof["primary_role"] if prof else "All-rounder",
            "valuation": prof["valuation"]["estimated_valuation"] if prof else 5.0,
            "base_price": prof["valuation"]["base_price"] if prof else 2.0
        })
    return {
        "count": len(result),
        "shortlist": result
    }

@router.post("/shortlists")
def add_to_shortlist(
    data: ShortlistCreate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    _require_team_owner_access(data.team_id, authorization, db, allow_auctioneer=False)
    existing = db.query(AuctionShortlist).filter(
        AuctionShortlist.team_id == data.team_id,
        AuctionShortlist.player_id == data.player_id
    ).first()
    if existing:
        existing.priority = data.priority
        existing.max_target_bid = data.max_target_bid
        existing.notes = data.notes
        db.commit()
        return {"status": "UPDATED", "id": existing.id}
    
    item = AuctionShortlist(
        team_id=data.team_id,
        player_id=data.player_id,
        priority=data.priority,
        max_target_bid=data.max_target_bid,
        notes=data.notes
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"status": "CREATED", "id": item.id}

@router.delete("/shortlists/{shortlist_id}")
def remove_from_shortlist(
    shortlist_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    item = db.query(AuctionShortlist).filter(AuctionShortlist.id == shortlist_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Shortlist item not found")
    _require_team_owner_access(item.team_id, authorization, db, allow_auctioneer=False)
    db.delete(item)
    db.commit()
    return {"status": "DELETED"}

@router.post("/squad-balance")
def analyze_squad_balance(req: SquadBalanceRequest, db: Session = Depends(get_db)):
    players = []
    for pid in req.player_ids:
        prof = get_player_full_profile(db, pid)
        if prof: players.append(prof)
        
    batters = sum(1 for p in players if p["primary_role"] == "Specialist Batsman")
    bowlers = sum(1 for p in players if p["primary_role"] == "Specialist Bowler")
    all_rounders = sum(1 for p in players if p["primary_role"] == "All-rounder")
    
    total_val = sum(p["valuation"]["estimated_valuation"] for p in players)
    avg_rating = round(sum(p["ratings"]["overall_rating"] for p in players) / len(players), 1) if players else 0.0

    # Diagnostics
    balance_status = "Optimal"
    recommendations = []
    if all_rounders < 2:
        recommendations.append("Acquire at least 2 genuine all-rounders for 6-over flexibility.")
    if bowlers < 2 and all_rounders < 3:
        recommendations.append("Bowling unit lacks specialist depth; prioritize a frontline strike bowler.")
    if batters < 2 and all_rounders < 3:
        recommendations.append("Batting firepower is thin; target an explosive top-order batsman.")
    if not recommendations:
        recommendations.append("Squad balance meets all competitive requirements for 6-over tournament conditions.")

    return {
        "squad_size": len(players),
        "composition": {
            "specialist_batsmen": batters,
            "specialist_bowlers": bowlers,
            "all_rounders": all_rounders
        },
        "average_rating": avg_rating,
        "projected_cost": round(total_val, 1),
        "balance_status": "Well-Balanced" if len(recommendations) <= 1 else "Needs Adjustment",
        "recommendations": recommendations
    }

@router.get("/dashboard/{team_id}")
def get_franchise_owner_dashboard(
    team_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Dedicated private intelligence dashboard for a franchise owner (or auctioneer overview)."""
    _require_team_owner_access(team_id, authorization, db, allow_auctioneer=True)
    data = get_owner_dashboard(db, team_id)
    if not data:
        raise HTTPException(status_code=404, detail="Team not found.")
    return data

@router.get("/scarcity/{player_id}")
def get_player_scarcity_analysis(player_id: str, db: Session = Depends(get_db)):
    """Market scarcity insight for a nominated player."""
    data = get_player_scarcity_insight(db, player_id)
    if not data:
        raise HTTPException(status_code=404, detail="Player not found.")
    return data

@router.post("/simulate")
def simulate_full_auction(db: Session = Depends(get_db)):
    """Simulates an entire 6-team auction in-memory with ZERO database mutations."""
    res = run_in_memory_auction_simulation(db)
    return res

@router.post("/admin/reset")
def reset_auction_state(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Resets all squads, bids, pool statuses, and team purses to clean initial state (Auctioneer Admin only)."""
    user = _require_user(authorization, db)
    if user.role != "auctioneer":
        raise HTTPException(status_code=403, detail="Only the official auctioneer can reset the auction database.")
    db.query(AuctionSquadMember).delete()
    db.query(AuctionBidAudit).delete()
    cfg = db.query(AuctionConfig).order_by(AuctionConfig.id.desc()).first()
    init_purse = cfg.initial_purse if cfg else 100.0
    teams = db.query(AuctionTeam).all()
    for t in teams:
        t.purse_total = init_purse
        t.purse_spent = 0.0
    if cfg:
        cfg.status = "DRAFT"
        cfg.locked = False
        cfg.current_player_id = None
        cfg.current_bid = 0.0
        cfg.current_bidder_team_id = None
        cfg.started_at = None
        cfg.completed_at = None
        db.query(AuctionPoolEntry).filter(AuctionPoolEntry.auction_config_id == cfg.id).update({
            "auction_status": "PENDING",
            "sold_to_team_id": None,
            "sold_price": None
        })
    db.commit()
    auction_manager.state = "IDLE"
    auction_manager.current_player = None
    auction_manager.current_bid = 0.0
    auction_manager.current_bidder = None
    auction_manager.bid_history = []
    return {"status": "SUCCESS", "message": f"Auction state, rosters, pool, and purses reset cleanly to {init_purse}L."}

# Live Auction WebSocket
@router.websocket("/ws")
async def live_auction_ws(websocket: WebSocket, token: Optional[str] = None, team_id: Optional[str] = None):
    db = SessionLocal()
    authenticated_user = None
    if token:
        authenticated_user = get_user_from_token(db, token)

    assigned_team_id = str(authenticated_user.team_id) if authenticated_user and authenticated_user.team_id else (str(team_id) if team_id else None)
    await auction_manager.connect(websocket, assigned_team_id)

    # Send initial state snapshot on connection
    await websocket.send_text(json.dumps({
        "event": "CONNECTION_ESTABLISHED",
        "authenticated": authenticated_user is not None,
        "user": {
            "username": authenticated_user.username,
            "role": authenticated_user.role,
            "team_id": authenticated_user.team_id,
            "display_name": authenticated_user.display_name
        } if authenticated_user else None,
        "auction_state": {
            "state": auction_manager.state,
            "current_player": auction_manager.current_player,
            "current_bid": auction_manager.current_bid,
            "current_bidder": auction_manager.current_bidder,
            "bid_history": auction_manager.bid_history[-20:],
            "bid_increment": auction_manager.bid_increment,
            "timer_duration": auction_manager.timer_duration
        }
    }))

    try:
        while True:
            raw_text = await websocket.receive_text()
            data = json.loads(raw_text)
            action = data.get("action")
            
            # Action: NOMINATE (Auctioneer only)
            if action == "NOMINATE":
                if not authenticated_user or authenticated_user.role != "auctioneer":
                    await websocket.send_text(json.dumps({
                        "event": "AUTH_ERROR",
                        "message": "Only the official auctioneer can nominate players."
                    }))
                    continue
                await auction_manager.nominate_player(data["player"], data.get("base_price", 2.0), db=db)

            # Action: PAUSE / RESUME (Auctioneer only)
            elif action == "PAUSE":
                if not authenticated_user or authenticated_user.role != "auctioneer":
                    await websocket.send_text(json.dumps({"event": "AUTH_ERROR", "message": "Only the official auctioneer can pause bidding."}))
                    continue
                await auction_manager.pause_bidding(db=db)

            elif action == "RESUME":
                if not authenticated_user or authenticated_user.role != "auctioneer":
                    await websocket.send_text(json.dumps({"event": "AUTH_ERROR", "message": "Only the official auctioneer can resume bidding."}))
                    continue
                await auction_manager.resume_bidding(db=db)

            # Action: UNDO / CANCEL NOMINATION (Auctioneer only)
            elif action in ["UNDO", "CANCEL_NOMINATION"]:
                if not authenticated_user or authenticated_user.role != "auctioneer":
                    await websocket.send_text(json.dumps({
                        "event": "AUTH_ERROR",
                        "message": "Only the official auctioneer can undo nominations."
                    }))
                    continue
                await auction_manager.undo_nomination(db=db)

            # Action: SET_TIMER (Auctioneer only)
            elif action == "SET_TIMER":
                if not authenticated_user or authenticated_user.role != "auctioneer":
                    continue
                await auction_manager.set_timer(data.get("seconds", 15))

            # Action: BID
            elif action == "BID":
                target_team_id = data.get("team_id")
                if not authenticated_user:
                    await websocket.send_text(json.dumps({
                        "event": "AUTH_ERROR",
                        "message": "Authentication required to place bids."
                    }))
                    continue
                # Role check: If authenticated as team_owner, MUST bid only for own team
                if authenticated_user.role == "team_owner":
                    if target_team_id != authenticated_user.team_id:
                        await websocket.send_text(json.dumps({
                            "event": "AUTH_ERROR",
                            "message": f"Identity violation: You can only place bids for your own team (Team {authenticated_user.team_id})."
                        }))
                        continue

                success, msg = await auction_manager.place_bid(
                    team_id=target_team_id,
                    team_name=data.get("team_name", f"Team {target_team_id}"),
                    owner_name=data.get("owner_name", "Owner"),
                    bid_amount=data["bid_amount"],
                    db=db
                )
                if not success:
                    await websocket.send_text(json.dumps({
                        "event": "BID_REJECTED",
                        "reason": msg,
                        "team_id": target_team_id,
                        "attempted_bid": data.get("bid_amount")
                    }))

            # Action: SOLD / UNSOLD (Auctioneer only)
            elif action in ["SOLD", "UNSOLD"]:
                if not authenticated_user or authenticated_user.role != "auctioneer":
                    await websocket.send_text(json.dumps({
                        "event": "AUTH_ERROR",
                        "message": "Only the official auctioneer can declare SOLD or UNSOLD."
                    }))
                    continue
                await auction_manager.close_bidding(action, db=db)
    except WebSocketDisconnect:
        auction_manager.disconnect(websocket)
    finally:
        db.close()
