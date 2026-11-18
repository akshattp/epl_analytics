from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any

from backend.database.db import get_db
from backend.database.models import User, AuctionTeam
from backend.auth.security import (
    verify_password, create_user_session, get_user_from_token, init_default_users
)

router = APIRouter(prefix="/api/auth", tags=["Authentication & Access Control"])

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    # Initialize default users if empty
    init_default_users(db)

    user = db.query(User).filter(User.username == creds.username.strip().lower()).first()
    if not user or not verify_password(creds.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    token = create_user_session(db, user)

    team_data = None
    if user.team_id:
        team = db.query(AuctionTeam).filter(AuctionTeam.id == user.team_id).first()
        if team:
            team_data = {
                "team_id": team.id,
                "team_name": team.team_name,
                "owner_name": team.owner_name,
                "purse_total": team.purse_total,
                "purse_spent": team.purse_spent,
                "purse_remaining": round(team.purse_total - team.purse_spent, 2)
            }

    return {
        "status": "SUCCESS",
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "team_id": user.team_id,
            "display_name": user.display_name
        },
        "team": team_data
    }

@router.get("/me")
def get_current_user_profile(
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    init_default_users(db)

    auth_token = token
    if not auth_token and authorization:
        if authorization.startswith("Bearer "):
            auth_token = authorization.replace("Bearer ", "").strip()
        else:
            auth_token = authorization.strip()

    if not auth_token:
        raise HTTPException(status_code=401, detail="Authentication token required.")

    user = get_user_from_token(db, auth_token)
    if not user:
        raise HTTPException(status_code=401, detail="Session expired or invalid token.")

    team_data = None
    if user.team_id:
        team = db.query(AuctionTeam).filter(AuctionTeam.id == user.team_id).first()
        if team:
            team_data = {
                "team_id": team.id,
                "team_name": team.team_name,
                "owner_name": team.owner_name,
                "purse_total": team.purse_total,
                "purse_spent": team.purse_spent,
                "purse_remaining": round(team.purse_total - team.purse_spent, 2)
            }

    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "team_id": user.team_id,
            "display_name": user.display_name
        },
        "team": team_data
    }

@router.get("/accounts")
def list_available_auction_personas(db: Session = Depends(get_db)):
    """Provides non-sensitive auction account metadata (usernames & roles only; never exposes PINs)."""
    init_default_users(db)
    users = db.query(User).order_by(User.id).all()
    personas = []
    for u in users:
        personas.append({
            "username": u.username,
            "display_name": u.display_name,
            "role": u.role,
            "team_id": u.team_id
        })
    return {
        "personas": personas
    }
