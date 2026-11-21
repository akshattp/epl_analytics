import hashlib
import secrets
import datetime
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from backend.database.models import User, UserSession, AuctionTeam

SESSION_DURATION_HOURS = 24

def hash_password(password: str, salt: Optional[str] = None) -> str:
    """PBKDF2-HMAC-SHA256 password hasher with salt."""
    if not salt:
        salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()
    return f"{salt}${key}"

def verify_password(plain_password: str, stored_hash: str) -> bool:
    """Verifies a plain password against stored salt$key."""
    try:
        salt, key = stored_hash.split("$", 1)
        expected = hash_password(plain_password, salt=salt)
        return secrets.compare_digest(stored_hash, expected)
    except Exception:
        return False

def create_user_session(db: Session, user: User) -> str:
    """Creates a new bearer token session for user with 24-hr expiry."""
    token = secrets.token_urlsafe(32)
    now = datetime.datetime.utcnow()
    expires_at = now + datetime.timedelta(hours=SESSION_DURATION_HOURS)
    
    session = UserSession(
        token=token,
        user_id=user.id,
        created_at=now,
        expires_at=expires_at
    )
    db.add(session)
    db.commit()
    return token

def get_user_from_token(db: Session, token: str) -> Optional[User]:
    """Validates token and returns active User or None."""
    if not token:
        return None
    now = datetime.datetime.utcnow()
    session = db.query(UserSession).filter(
        UserSession.token == token,
        UserSession.expires_at > now
    ).first()
    if session:
        return session.user
    return None

def init_default_users(db: Session):
    """Idempotently provisions the 6 team owners and the official auctioneer."""
    default_accounts = [
        {
            "username": "auctioneer",
            "password": "epladmin2026",
            "role": "auctioneer",
            "team_id": None,
            "display_name": "Official Auctioneer & Controller"
        },
        {
            "username": "vipers",
            "password": "vipers2026",
            "role": "team_owner",
            "team_id": 1,
            "display_name": "Victory Vipers (Sandeep Dalvi)"
        },
        {
            "username": "warriors",
            "password": "warriors2026",
            "role": "team_owner",
            "team_id": 2,
            "display_name": "Exotica Warriors (Aryan Shetty)"
        },
        {
            "username": "ultimates",
            "password": "ultimates2026",
            "role": "team_owner",
            "team_id": 3,
            "display_name": "The Ultimates (Anurag Jain)"
        },
        {
            "username": "panthers",
            "password": "panthers2026",
            "role": "team_owner",
            "team_id": 4,
            "display_name": "Exotica Panthers (Ashish Chhawchharia)"
        },
        {
            "username": "legends",
            "password": "legends2026",
            "role": "team_owner",
            "team_id": 5,
            "display_name": "Exotica Living Legenda (Vijay Limbachiya)"
        },
        {
            "username": "lions",
            "password": "lions2026",
            "role": "team_owner",
            "team_id": 6,
            "display_name": "Exotica Lions Pride (Yash Patel)"
        },
        {
            "username": "admin",
            "password": "epladmin2026!",
            "role": "super_admin",
            "team_id": None,
            "display_name": "EPL System Administrator"
        }
    ]

    for acc in default_accounts:
        existing = db.query(User).filter(User.username == acc["username"]).first()
        if not existing:
            u = User(
                username=acc["username"],
                password_hash=hash_password(acc["password"]),
                role=acc["role"],
                team_id=acc["team_id"],
                display_name=acc["display_name"]
            )
            db.add(u)
    db.commit()
