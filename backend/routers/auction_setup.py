import csv
import datetime
import io
import json
import re
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database.db import get_db
from backend.database.models import (
    AuctionConfig, AuctionPoolEntry, AuctionTeam, AuctionSquadMember,
    AuctionBidAudit, Player
)
from backend.auth.security import get_user_from_token
from backend.services.player_service import get_all_players_summary, get_player_full_profile
from backend.auction.live_auction_manager import auction_manager

router = APIRouter(prefix="/api/auction", tags=["Auction Setup & Lifecycle"])


def _require_auctioneer(authorization: Optional[str], db: Session):
    if not authorization:
        raise HTTPException(status_code=401, detail="Auctioneer authentication token required.")
    token = authorization.replace("Bearer ", "").strip()
    user = get_user_from_token(db, token)
    if not user or user.role != "auctioneer":
        raise HTTPException(status_code=403, detail="Only the official auctioneer can modify auction setup or lifecycle.")
    return user


def _get_or_create_config(db: Session) -> AuctionConfig:
    cfg = db.query(AuctionConfig).order_by(AuctionConfig.id.desc()).first()
    if not cfg:
        cfg = AuctionConfig()
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
    return cfg


class AuctionConfigUpdate(BaseModel):
    auction_name: Optional[str] = None
    season_year: Optional[int] = None
    auction_date: Optional[str] = None
    num_teams: Optional[int] = None
    initial_purse: Optional[float] = None
    min_base_price: Optional[float] = None
    min_bid_increment: Optional[float] = None
    min_squad_size: Optional[int] = None
    max_squad_size: Optional[int] = None
    timer_duration: Optional[int] = None
    categories: Optional[List[str]] = None
    unsold_rule: Optional[str] = None
    retention_rule: Optional[str] = None
    auction_format: Optional[str] = None
    nomination_order: Optional[str] = None


class TeamConfigUpdate(BaseModel):
    team_name: Optional[str] = None
    owner_name: Optional[str] = None
    logo_text: Optional[str] = None
    purse_total: Optional[float] = None
    min_squad_size: Optional[int] = None
    max_squad_size: Optional[int] = None
    role_requirements: Optional[Dict[str, int]] = None


class PoolEntryCreate(BaseModel):
    player_id: Optional[str] = None
    name: Optional[str] = None
    primary_role: str = "All-rounder"
    batting_hand: str = "RHB"
    category: str = "Uncapped / New"
    base_price: float = 2.0
    is_available: bool = True
    notes: str = ""


class PoolEntryUpdate(BaseModel):
    category: Optional[str] = None
    base_price: Optional[float] = None
    is_available: Optional[bool] = None
    nomination_rank: Optional[int] = None
    notes: Optional[str] = None


class CsvImportRequest(BaseModel):
    csv_text: str


class StartAuctionRequest(BaseModel):
    confirm: bool = False


def _serialize_config(cfg: AuctionConfig) -> Dict[str, Any]:
    try:
        cats = json.loads(cfg.categories_json or "[]")
    except Exception:
        cats = ["Marquee / Elite", "Tier 1 (High Impact)", "Tier 2 (Solid Core)", "Role Specialist", "Uncapped / New"]
    return {
        "id": cfg.id,
        "auction_name": cfg.auction_name,
        "season_year": cfg.season_year,
        "auction_date": cfg.auction_date,
        "num_teams": cfg.num_teams,
        "initial_purse": cfg.initial_purse,
        "min_base_price": cfg.min_base_price,
        "min_bid_increment": cfg.min_bid_increment,
        "min_squad_size": cfg.min_squad_size,
        "max_squad_size": cfg.max_squad_size,
        "timer_duration": cfg.timer_duration,
        "categories": cats,
        "unsold_rule": cfg.unsold_rule,
        "retention_rule": cfg.retention_rule,
        "auction_format": cfg.auction_format,
        "nomination_order": cfg.nomination_order,
        "status": cfg.status,
        "locked": cfg.locked,
        "started_at": cfg.started_at.isoformat() if cfg.started_at else None,
        "completed_at": cfg.completed_at.isoformat() if cfg.completed_at else None,
        "live_state": auction_manager.state
    }


@router.get("/config")
def get_auction_config(db: Session = Depends(get_db)):
    cfg = _get_or_create_config(db)
    return _serialize_config(cfg)


@router.put("/config")
def update_auction_config(
    payload: AuctionConfigUpdate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    _require_auctioneer(authorization, db)
    cfg = _get_or_create_config(db)
    if cfg.locked:
        raise HTTPException(status_code=400, detail="Auction configuration is locked because the auction has already started.")

    data = payload.model_dump(exclude_unset=True)
    if "categories" in data:
        cfg.categories_json = json.dumps(data.pop("categories"))
    for k, v in data.items():
        if hasattr(cfg, k):
            setattr(cfg, k, v)

    # Sync initial purse and squad size limits to teams when still in DRAFT/CONFIGURED
    if "initial_purse" in data or "max_squad_size" in data or "min_squad_size" in data:
        for t in db.query(AuctionTeam).all():
            if t.purse_spent == 0:
                if "initial_purse" in data:
                    t.purse_total = cfg.initial_purse
                if "max_squad_size" in data:
                    t.max_squad_size = cfg.max_squad_size
                if "min_squad_size" in data:
                    t.min_squad_size = cfg.min_squad_size

    cfg.status = "CONFIGURED"
    cfg.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(cfg)
    return _serialize_config(cfg)


@router.put("/teams/{team_id}")
def update_auction_team(
    team_id: int,
    payload: TeamConfigUpdate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    _require_auctioneer(authorization, db)
    cfg = _get_or_create_config(db)
    if cfg.locked:
        raise HTTPException(status_code=400, detail="Team configuration is locked once the auction starts.")

    team = db.query(AuctionTeam).filter(AuctionTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")

    data = payload.model_dump(exclude_unset=True)
    if "role_requirements" in data:
        team.role_requirements_json = json.dumps(data.pop("role_requirements"))
    for k, v in data.items():
        if hasattr(team, k):
            setattr(team, k, v)
    db.commit()
    db.refresh(team)
    return {
        "status": "UPDATED",
        "team": {
            "team_id": team.id,
            "team_name": team.team_name,
            "owner_name": team.owner_name,
            "logo_text": team.logo_text,
            "purse_total": team.purse_total,
            "min_squad_size": team.min_squad_size,
            "max_squad_size": team.max_squad_size,
            "role_requirements": json.loads(team.role_requirements_json or "{}")
        }
    }


@router.get("/pool")
def get_auction_pool(db: Session = Depends(get_db)):
    cfg = _get_or_create_config(db)
    entries = (
        db.query(AuctionPoolEntry)
        .filter(AuctionPoolEntry.auction_config_id == cfg.id)
        .order_by(AuctionPoolEntry.nomination_rank.asc(), AuctionPoolEntry.id.asc())
        .all()
    )
    summaries_map = {p["player_id"]: p for p in get_all_players_summary(db)}
    teams_map = {t.id: t.team_name for t in db.query(AuctionTeam).all()}

    pool = []
    for e in entries:
        p = summaries_map.get(e.player_id)
        if not p:
            continue
        pool.append({
            "entry_id": e.id,
            "player_id": e.player_id,
            "name": p["name"],
            "primary_role": p["primary_role"],
            "batting_hand": p["batting_hand"],
            "matches": p["matches"],
            "total_runs": p["total_runs"],
            "strike_rate": p["strike_rate"],
            "wickets": p["wickets"],
            "economy": p["economy"],
            "overall_rating": p["ratings"]["overall_rating"],
            "cohort": p.get("cohort", {}).get("cohort_name", "Balanced Core") if isinstance(p.get("cohort"), dict) else "Balanced Core",
            "category": e.category,
            "base_price": e.base_price,
            "estimated_valuation": p["valuation"]["estimated_valuation"],
            "is_available": e.is_available,
            "is_returning": e.is_returning,
            "is_new_player": p["is_new_player"],
            "nomination_rank": e.nomination_rank,
            "auction_status": e.auction_status,
            "sold_to_team_id": e.sold_to_team_id,
            "sold_to_team_name": teams_map.get(e.sold_to_team_id) if e.sold_to_team_id else None,
            "sold_price": e.sold_price,
            "notes": e.notes
        })
    return {"config_id": cfg.id, "count": len(pool), "pool": pool}


@router.post("/pool")
def add_player_to_pool(
    payload: PoolEntryCreate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    _require_auctioneer(authorization, db)
    cfg = _get_or_create_config(db)
    if cfg.locked:
        raise HTTPException(status_code=400, detail="Pool is locked while auction is live.")

    player = None
    if payload.player_id:
        player = db.query(Player).filter(Player.id == payload.player_id).first()
    elif payload.name:
        norm = re.sub(r"\s+", " ", payload.name).strip().lower()
        player = db.query(Player).filter(Player.normalized_name == norm).first()
        if not player:
            # Create new canonical player safely without colliding with existing IDs
            existing_ids = [r[0] for r in db.query(Player.id).all()]
            max_num = max([int(m.group(1)) for pid in existing_ids if (m := re.search(r"EPL-P-(\d+)", pid))] + [73])
            new_pid = f"EPL-P-{max_num + 1:03d}"
            player = Player(
                id=new_pid,
                name=payload.name.strip(),
                normalized_name=norm,
                batting_hand=payload.batting_hand,
                primary_role=payload.primary_role,
                is_registered_auction=True,
                is_new_player=True,
                experience_notes=payload.notes or "Registered via Auction Setup Wizard"
            )
            db.add(player)
            db.commit()
            db.refresh(player)

    if not player:
        raise HTTPException(status_code=400, detail="Provide either an existing player_id or a new player name.")

    existing = db.query(AuctionPoolEntry).filter(
        AuctionPoolEntry.auction_config_id == cfg.id,
        AuctionPoolEntry.player_id == player.id
    ).first()
    if existing:
        existing.category = payload.category
        existing.base_price = payload.base_price
        existing.is_available = payload.is_available
        existing.notes = payload.notes
        db.commit()
        return {"status": "UPDATED_EXISTING", "entry_id": existing.id, "player_id": player.id}

    max_rank = db.query(AuctionPoolEntry).filter(AuctionPoolEntry.auction_config_id == cfg.id).count()
    entry = AuctionPoolEntry(
        auction_config_id=cfg.id,
        player_id=player.id,
        category=payload.category,
        base_price=max(cfg.min_base_price, payload.base_price),
        is_available=payload.is_available,
        is_returning=not player.is_new_player,
        nomination_rank=max_rank + 1,
        auction_status="PENDING",
        notes=payload.notes
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"status": "CREATED", "entry_id": entry.id, "player_id": player.id, "name": player.name}


@router.put("/pool/{entry_id}")
def update_pool_entry(
    entry_id: int,
    payload: PoolEntryUpdate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    _require_auctioneer(authorization, db)
    cfg = _get_or_create_config(db)
    if cfg.locked:
        raise HTTPException(status_code=400, detail="Pool is locked while auction is live.")
    entry = db.query(AuctionPoolEntry).filter(AuctionPoolEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Pool entry not found.")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(entry, k, v)
    db.commit()
    return {"status": "UPDATED", "entry_id": entry.id}


@router.delete("/pool/{entry_id}")
def delete_pool_entry(
    entry_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    _require_auctioneer(authorization, db)
    cfg = _get_or_create_config(db)
    if cfg.locked:
        raise HTTPException(status_code=400, detail="Pool is locked while auction is live.")
    entry = db.query(AuctionPoolEntry).filter(AuctionPoolEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Pool entry not found.")
    db.delete(entry)
    db.commit()
    return {"status": "DELETED"}


@router.post("/pool/import-csv")
def import_pool_csv(
    req: CsvImportRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Imports players from CSV text (columns: name, role, category, base_price, batting_hand).
    Matches existing canonical players by name so returning players are NEVER duplicated.
    """
    _require_auctioneer(authorization, db)
    cfg = _get_or_create_config(db)
    if cfg.locked:
        raise HTTPException(status_code=400, detail="Pool is locked while auction is live.")

    reader = csv.DictReader(io.StringIO(req.csv_text.strip()))
    added, updated, skipped = 0, 0, 0
    existing_ids = [r[0] for r in db.query(Player.id).all()]
    max_num = max([int(m.group(1)) for pid in existing_ids if (m := re.search(r"EPL-P-(\d+)", pid))] + [73])
    rank_cursor = db.query(AuctionPoolEntry).filter(AuctionPoolEntry.auction_config_id == cfg.id).count()

    for row in reader:
        name = (row.get("name") or row.get("Name") or row.get("player_name") or "").strip()
        if not name:
            skipped += 1
            continue
        norm = re.sub(r"\s+", " ", name).lower()
        role = (row.get("role") or row.get("primary_role") or "All-rounder").strip()
        cat = (row.get("category") or "Uncapped / New").strip()
        hand = (row.get("batting_hand") or "RHB").strip()
        try:
            bp = float(row.get("base_price") or cfg.min_base_price)
        except Exception:
            bp = cfg.min_base_price

        player = db.query(Player).filter(Player.normalized_name == norm).first()
        if not player:
            max_num += 1
            player = Player(
                id=f"EPL-P-{max_num:03d}",
                name=name,
                normalized_name=norm,
                batting_hand=hand,
                primary_role=role,
                is_registered_auction=True,
                is_new_player=True,
                experience_notes="Imported via Auction CSV Upload"
            )
            db.add(player)
            db.flush()

        entry = db.query(AuctionPoolEntry).filter(
            AuctionPoolEntry.auction_config_id == cfg.id,
            AuctionPoolEntry.player_id == player.id
        ).first()
        if entry:
            entry.category = cat
            entry.base_price = max(cfg.min_base_price, bp)
            entry.is_available = True
            updated += 1
        else:
            rank_cursor += 1
            db.add(AuctionPoolEntry(
                auction_config_id=cfg.id,
                player_id=player.id,
                category=cat,
                base_price=max(cfg.min_base_price, bp),
                is_available=True,
                is_returning=not player.is_new_player,
                nomination_rank=rank_cursor,
                auction_status="PENDING"
            ))
            added += 1

    db.commit()
    return {"status": "IMPORTED", "added": added, "updated": updated, "skipped": skipped}


@router.get("/preview")
def get_auction_preview(db: Session = Depends(get_db)):
    cfg = _get_or_create_config(db)
    entries = db.query(AuctionPoolEntry).filter(
        AuctionPoolEntry.auction_config_id == cfg.id,
        AuctionPoolEntry.is_available == True
    ).all()
    teams = db.query(AuctionTeam).all()

    cat_dist: Dict[str, int] = {}
    returning_cnt = 0
    new_cnt = 0
    for e in entries:
        cat_dist[e.category] = cat_dist.get(e.category, 0) + 1
        if e.is_returning:
            returning_cnt += 1
        else:
            new_cnt += 1

    total_purse = round(sum(t.purse_total for t in teams), 2)
    min_required_players = sum((t.min_squad_size or cfg.min_squad_size) for t in teams)
    max_capacity = sum((t.max_squad_size or cfg.max_squad_size) for t in teams)

    return {
        "config": _serialize_config(cfg),
        "total_registered_players": len(entries),
        "returning_players": returning_cnt,
        "new_players": new_cnt,
        "number_of_teams": len(teams),
        "total_available_purse": total_purse,
        "min_squad_size": cfg.min_squad_size,
        "max_squad_size": cfg.max_squad_size,
        "min_required_pool": min_required_players,
        "max_league_slots": max_capacity,
        "pool_sufficient": len(entries) >= min_required_players,
        "category_distribution": cat_dist,
        "teams": [
            {
                "team_id": t.id,
                "team_name": t.team_name,
                "owner_name": t.owner_name,
                "logo_text": t.logo_text or "EPL",
                "purse_total": t.purse_total,
                "min_squad_size": t.min_squad_size or cfg.min_squad_size,
                "max_squad_size": t.max_squad_size or cfg.max_squad_size
            }
            for t in teams
        ]
    }


@router.post("/lifecycle/start")
async def start_auction(
    req: StartAuctionRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    _require_auctioneer(authorization, db)
    if not req.confirm:
        raise HTTPException(status_code=400, detail="Explicit confirmation (confirm=true) is required to start the auction.")

    cfg = _get_or_create_config(db)
    if cfg.status == "LIVE":
        return {"status": "ALREADY_LIVE", "config": _serialize_config(cfg)}

    cfg.status = "LIVE"
    cfg.locked = True
    cfg.started_at = datetime.datetime.utcnow()
    cfg.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(cfg)

    auction_manager.bid_increment = cfg.min_bid_increment
    auction_manager.timer_duration = cfg.timer_duration
    auction_manager.min_base_price = cfg.min_base_price
    auction_manager.state = "IDLE"

    await auction_manager.broadcast({
        "event": "AUCTION_STARTED",
        "config": _serialize_config(cfg)
    })
    return {"status": "STARTED", "config": _serialize_config(cfg)}


@router.post("/lifecycle/pause")
async def pause_auction(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    _require_auctioneer(authorization, db)
    res = await auction_manager.pause_bidding(db=db)
    return res


@router.post("/lifecycle/resume")
async def resume_auction(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    _require_auctioneer(authorization, db)
    res = await auction_manager.resume_bidding(db=db)
    return res


@router.post("/lifecycle/complete")
async def complete_auction(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    _require_auctioneer(authorization, db)
    cfg = _get_or_create_config(db)
    cfg.status = "COMPLETED"
    cfg.completed_at = datetime.datetime.utcnow()
    cfg.updated_at = datetime.datetime.utcnow()
    db.commit()
    auction_manager.state = "IDLE"
    await auction_manager.broadcast({"event": "AUCTION_COMPLETED", "status": "COMPLETED"})
    return {"status": "COMPLETED", "config": _serialize_config(cfg)}


@router.get("/bid-history")
def get_persisted_bid_history(limit: int = 100, db: Session = Depends(get_db)):
    audits = db.query(AuctionBidAudit).order_by(AuctionBidAudit.id.desc()).limit(limit).all()
    players_map = {p.id: p.name for p in db.query(Player).all()}
    teams_map = {t.id: t for t in db.query(AuctionTeam).all()}
    return {
        "count": len(audits),
        "bids": [
            {
                "id": a.id,
                "player_id": a.player_id,
                "player_name": players_map.get(a.player_id, a.player_id),
                "team_id": a.team_id,
                "team_name": teams_map[a.team_id].team_name if a.team_id in teams_map else f"Team {a.team_id}",
                "owner_name": teams_map[a.team_id].owner_name if a.team_id in teams_map else "",
                "bid_amount": a.bid_amount,
                "status": a.status,
                "timestamp": a.timestamp.isoformat() if a.timestamp else ""
            }
            for a in audits
        ]
    }


def compute_auction_results(db: Session) -> Dict[str, Any]:
    cfg = _get_or_create_config(db)
    teams = db.query(AuctionTeam).all()
    summaries_map = {p["player_id"]: p for p in get_all_players_summary(db)}

    team_reports = []
    all_sold = []
    sold_pids = set()

    for t in teams:
        members = db.query(AuctionSquadMember).filter(AuctionSquadMember.team_id == t.id).all()
        squad = []
        for sm in members:
            sold_pids.add(sm.player_id)
            p = summaries_map.get(sm.player_id)
            est_val = p["valuation"]["estimated_valuation"] if p else 5.0
            overall = p["ratings"]["overall_rating"] if p else 50.0
            role = p["primary_role"] if p else "All-rounder"
            item = {
                "player_id": sm.player_id,
                "player_name": p["name"] if p else sm.player_id,
                "team_id": t.id,
                "team_name": t.team_name,
                "role": role,
                "overall_rating": overall,
                "batting_rating": p["ratings"]["batting_rating"] if p else 0.0,
                "bowling_rating": p["ratings"]["bowling_rating"] if p else 0.0,
                "purchase_price": sm.purchase_price,
                "estimated_valuation": est_val,
                "value_delta": round(est_val - sm.purchase_price, 2) # positive = bargain!
            }
            squad.append(item)
            all_sold.append(item)

        n = len(squad)
        avg_r = round(sum(x["overall_rating"] for x in squad) / n, 1) if n else 0.0
        bat_d = round(sum(x["batting_rating"] for x in squad) / n, 1) if n else 0.0
        bowl_d = round(sum(x["bowling_rating"] for x in squad) / n, 1) if n else 0.0
        ar_cnt = sum(1 for x in squad if x["role"] == "All-rounder")

        team_reports.append({
            "team_id": t.id,
            "team_name": t.team_name,
            "owner_name": t.owner_name,
            "logo_text": t.logo_text or "EPL",
            "purse_total": t.purse_total,
            "purse_spent": round(t.purse_spent, 2),
            "purse_remaining": round(t.purse_total - t.purse_spent, 2),
            "squad_size": n,
            "max_squad_size": t.max_squad_size,
            "average_rating": avg_r,
            "batting_depth": bat_d,
            "bowling_depth": bowl_d,
            "all_rounder_count": ar_cnt,
            "squad": squad
        })

    most_expensive = max(all_sold, key=lambda x: x["purchase_price"]) if all_sold else None
    best_value = sorted(all_sold, key=lambda x: -x["value_delta"])[:5]

    pool_entries = db.query(AuctionPoolEntry).filter(AuctionPoolEntry.auction_config_id == cfg.id).all()
    unsold_players = []
    for e in pool_entries:
        if e.player_id not in sold_pids:
            p = summaries_map.get(e.player_id)
            if p:
                unsold_players.append({
                    "player_id": e.player_id,
                    "name": p["name"],
                    "primary_role": p["primary_role"],
                    "category": e.category,
                    "base_price": e.base_price,
                    "overall_rating": p["ratings"]["overall_rating"],
                    "auction_status": e.auction_status
                })

    return {
        "auction_name": cfg.auction_name,
        "season_year": cfg.season_year,
        "status": cfg.status,
        "total_sold": len(all_sold),
        "total_unsold": len(unsold_players),
        "total_spend": round(sum(x["purchase_price"] for x in all_sold), 2),
        "most_expensive_player": most_expensive,
        "best_value_buys": best_value,
        "teams": team_reports,
        "unsold_players": unsold_players
    }


@router.get("/results")
def get_auction_results(db: Session = Depends(get_db)):
    return compute_auction_results(db)
