from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from backend.database.db import get_db
from backend.database.models import (
    Player, PlayerAlias, DataQualityAudit, Match, Innings
)
from backend.extraction.pdf_extractor import run_extraction_and_import

router = APIRouter(prefix="/api/admin", tags=["Admin & Data Management"])

class NewPlayerCreate(BaseModel):
    name: str
    batting_hand: str = "RHB"
    primary_role: str = "All-rounder"
    experience_notes: Optional[str] = "Registered via EPL 2026 Admin Portal"
    trial_rating: Optional[float] = 60.0

class AliasMappingCreate(BaseModel):
    raw_name: str
    target_player_id: str

@router.post("/players/new")
def register_new_player(player_data: NewPlayerCreate, db: Session = Depends(get_db)):
    # Find next player ID
    max_id = db.query(Player.id).order_by(Player.id.desc()).first()
    next_num = 1
    if max_id and max_id[0].startswith("EPL-P-"):
        try:
            next_num = int(max_id[0].replace("EPL-P-", "")) + 1
        except Exception:
            next_num = 100
    new_id = f"EPL-P-{next_num:03d}"

    # Check if name already exists
    existing = db.query(Player).filter(Player.name.ilike(player_data.name.strip())).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Player '{player_data.name}' already exists with ID {existing.id}")

    p = Player(
        id=new_id,
        name=player_data.name.strip(),
        normalized_name=player_data.name.strip().lower(),
        batting_hand=player_data.batting_hand,
        primary_role=player_data.primary_role,
        secondary_roles_json="[]",
        is_registered_auction=True,
        is_new_player=True,
        experience_notes=player_data.experience_notes,
        trial_rating=player_data.trial_rating
    )
    db.add(p)
    # Add self alias
    alias = PlayerAlias(
        raw_name=player_data.name.strip(),
        player_id=new_id,
        status="MANUALLY_CONFIRMED",
        notes="New Player Registration"
    )
    db.add(alias)
    db.commit()
    db.refresh(p)
    return {
        "status": "CREATED",
        "player_id": p.id,
        "name": p.name,
        "is_new_player": True
    }

@router.get("/identity-resolution")
def get_identity_resolution_list(db: Session = Depends(get_db)):
    aliases = db.query(PlayerAlias, Player).join(Player, PlayerAlias.player_id == Player.id).all()
    result = []
    for a, p in aliases:
        result.append({
            "alias_id": a.id,
            "raw_name": a.raw_name,
            "canonical_name": p.name,
            "player_id": p.id,
            "status": a.status,
            "notes": a.notes
        })
    return {
        "count": len(result),
        "aliases": result
    }

@router.post("/identity-resolution")
def create_or_update_alias(data: AliasMappingCreate, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == data.target_player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Target player ID not found")

    existing_alias = db.query(PlayerAlias).filter(PlayerAlias.raw_name == data.raw_name.strip()).first()
    if existing_alias:
        existing_alias.player_id = data.target_player_id
        existing_alias.status = "MANUALLY_CONFIRMED"
        db.commit()
        return {"status": "UPDATED", "alias_id": existing_alias.id}
    else:
        new_alias = PlayerAlias(
            raw_name=data.raw_name.strip(),
            player_id=data.target_player_id,
            status="MANUALLY_CONFIRMED"
        )
        db.add(new_alias)
        db.commit()
        return {"status": "CREATED", "alias_id": new_alias.id}

@router.get("/data-quality")
def get_data_quality_report(db: Session = Depends(get_db)):
    audits = db.query(DataQualityAudit).order_by(DataQualityAudit.id.desc()).all()
    matches_count = db.query(Match).count()
    innings_count = db.query(Innings).count()
    clean_innings = db.query(Innings).filter(Innings.validation_status == "VALIDATED").count()
    flagged_innings = db.query(Innings).filter(Innings.validation_status != "VALIDATED").count()

    audit_list = []
    for a in audits:
        audit_list.append({
            "id": a.id,
            "file_name": a.file_name,
            "season": a.season,
            "category": a.category,
            "severity": a.severity,
            "message": a.message,
            "created_at": a.created_at.isoformat() if a.created_at else None
        })

    return {
        "summary": {
            "total_matches": matches_count,
            "total_innings": innings_count,
            "clean_innings": clean_innings,
            "flagged_innings": flagged_innings,
            "data_health_score": round((clean_innings / innings_count) * 100, 1) if innings_count > 0 else 100.0
        },
        "audits": audit_list
    }

@router.post("/reimport")
def trigger_reimport():
    try:
        run_extraction_and_import()
        return {"status": "SUCCESS", "message": "Historical data re-extracted and imported successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
