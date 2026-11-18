import asyncio
import datetime
import json
from typing import Dict, Any, List, Optional
from fastapi import WebSocket
from sqlalchemy.orm import Session
from backend.database.models import (
    AuctionTeam, AuctionSquadMember, AuctionBidAudit, AuctionConfig, AuctionPoolEntry, Player
)


class LiveAuctionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.owner_connections: Dict[str, WebSocket] = {}  # team_id -> websocket
        self.lock = asyncio.Lock()

        # State machine
        self.state = "IDLE"  # IDLE, NOMINATED, BIDDING_ACTIVE, PAUSED, SOLD, UNSOLD
        self.current_player: Optional[Dict[str, Any]] = None
        self.current_bid = 0.0
        self.current_bidder: Optional[Dict[str, Any]] = None
        self.bid_history: List[Dict[str, Any]] = []
        self.bid_increment = 0.5
        self.timer_duration = 15
        self.min_base_price = 2.0

    def sync_from_db(self, db: Session):
        """Restores active auction settings & in-progress state from SQLite after a backend restart."""
        cfg = db.query(AuctionConfig).order_by(AuctionConfig.id.desc()).first()
        if not cfg:
            return
        self.bid_increment = cfg.min_bid_increment or 0.5
        self.timer_duration = cfg.timer_duration or 15
        self.min_base_price = cfg.min_base_price or 2.0

        if cfg.status == "PAUSED":
            self.state = "PAUSED"
        elif cfg.current_player_id and cfg.status == "LIVE":
            p = db.query(Player).filter(Player.id == cfg.current_player_id).first()
            if p:
                entry = db.query(AuctionPoolEntry).filter(
                    AuctionPoolEntry.auction_config_id == cfg.id,
                    AuctionPoolEntry.player_id == p.id
                ).first()
                self.current_player = {
                    "id": p.id,
                    "player_id": p.id,
                    "name": p.name,
                    "primary_role": p.primary_role,
                    "batting_hand": p.batting_hand,
                    "category": entry.category if entry else "Tier 2 (Solid Core)",
                    "base_price": entry.base_price if entry else self.min_base_price
                }
                self.current_bid = cfg.current_bid or self.current_player["base_price"]
                self.state = "BIDDING_ACTIVE"
                if cfg.current_bidder_team_id:
                    t = db.query(AuctionTeam).filter(AuctionTeam.id == cfg.current_bidder_team_id).first()
                    if t:
                        self.current_bidder = {
                            "team_id": t.id,
                            "team_name": t.team_name,
                            "owner_name": t.owner_name
                        }
                # Recover recent bids for current player
                audits = (
                    db.query(AuctionBidAudit)
                    .filter(AuctionBidAudit.player_id == p.id, AuctionBidAudit.status == "ACCEPTED")
                    .order_by(AuctionBidAudit.id.asc())
                    .all()
                )
                teams_map = {t.id: t for t in db.query(AuctionTeam).all()}
                self.bid_history = [
                    {
                        "type": "BID",
                        "team_id": a.team_id,
                        "team_name": teams_map[a.team_id].team_name if a.team_id in teams_map else f"Team {a.team_id}",
                        "owner_name": teams_map[a.team_id].owner_name if a.team_id in teams_map else "Owner",
                        "amount": a.bid_amount,
                        "timestamp": a.timestamp.isoformat() if a.timestamp else datetime.datetime.utcnow().isoformat()
                    }
                    for a in audits
                ]

    def _persist_live_pointer(self, db: Optional[Session]):
        if not db:
            return
        cfg = db.query(AuctionConfig).order_by(AuctionConfig.id.desc()).first()
        if not cfg:
            return
        cfg.current_player_id = self.current_player["id"] if self.current_player else None
        cfg.current_bid = self.current_bid
        cfg.current_bidder_team_id = self.current_bidder["team_id"] if self.current_bidder else None
        cfg.updated_at = datetime.datetime.utcnow()
        try:
            db.commit()
        except Exception:
            db.rollback()

    async def connect(self, websocket: WebSocket, team_id: Optional[str] = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        if team_id:
            self.owner_connections[str(team_id)] = websocket

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        for tid, ws in list(self.owner_connections.items()):
            if ws == websocket:
                del self.owner_connections[tid]

    async def broadcast(self, message: Dict[str, Any]):
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                dead.append(connection)
        for d in dead:
            self.disconnect(d)

    async def send_private(self, team_id: str, message: Dict[str, Any]):
        ws = self.owner_connections.get(str(team_id))
        if ws:
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                self.disconnect(ws)

    async def nominate_player(self, player_data: Dict[str, Any], base_price: float, db: Optional[Session] = None):
        async with self.lock:
            pid = player_data.get("id") or player_data.get("player_id", "UNKNOWN")
            pname = player_data.get("name") or player_data.get("player_name", "Unknown Player")
            self.current_player = {
                "id": pid,
                "player_id": pid,
                "name": pname,
                "primary_role": player_data.get("primary_role", "All-rounder"),
                "batting_hand": player_data.get("batting_hand", "RHB"),
                "rating": player_data.get("rating") or player_data.get("overall_rating", 0.0),
                "overall_rating": player_data.get("overall_rating") or player_data.get("rating", 0.0),
                "category": player_data.get("category", "Tier 2 (Solid Core)"),
                "base_price": base_price,
                "matches": player_data.get("matches", 0),
                "total_runs": player_data.get("total_runs", 0),
                "strike_rate": player_data.get("strike_rate", 0.0),
                "wickets": player_data.get("wickets", 0),
                "economy": player_data.get("economy", 0.0),
                "estimated_valuation": player_data.get("estimated_valuation", base_price),
                "scarcity_multiplier": player_data.get("scarcity_multiplier", 1.0),
            }
            self.current_bid = base_price
            self.current_bidder = None
            self.state = "BIDDING_ACTIVE"
            self.bid_history = []

            if db:
                cfg = db.query(AuctionConfig).order_by(AuctionConfig.id.desc()).first()
                if cfg:
                    self.bid_increment = cfg.min_bid_increment or 0.5
                    self.timer_duration = cfg.timer_duration or 15
                    self.min_base_price = cfg.min_base_price or 2.0
                    entry = db.query(AuctionPoolEntry).filter(
                        AuctionPoolEntry.auction_config_id == cfg.id,
                        AuctionPoolEntry.player_id == pid
                    ).first()
                    if entry:
                        entry.auction_status = "NOMINATED"
                self._persist_live_pointer(db)

            await self.broadcast({
                "event": "PLAYER_NOMINATED",
                "state": self.state,
                "player": self.current_player,
                "base_price": base_price,
                "current_bid": self.current_bid,
                "current_bidder": None,
                "bid_timer": self.timer_duration
            })

    async def place_bid(
        self,
        team_id: int,
        team_name: str,
        owner_name: str,
        bid_amount: float,
        db: Optional[Session] = None
    ) -> tuple[bool, str]:
        async with self.lock:
            if self.state != "BIDDING_ACTIVE":
                return False, f"Bidding is not currently active (status: {self.state})."
            if bid_amount <= self.current_bid:
                return False, f"Bid must be higher than current bid ({self.current_bid:.1f}L)."
            if (bid_amount - self.current_bid) < (self.bid_increment - 1e-4) and self.current_bidder is not None:
                return False, f"Minimum bid increment is {self.bid_increment}L."

            if db:
                team = db.query(AuctionTeam).filter(AuctionTeam.id == team_id).first()
                if not team:
                    return False, f"Team with ID {team_id} does not exist."

                remaining_purse = team.purse_total - team.purse_spent
                if remaining_purse < bid_amount:
                    return False, f"Insufficient purse: {team.team_name} only has {remaining_purse:.1f}L remaining."

                current_squad_count = db.query(AuctionSquadMember).filter(AuctionSquadMember.team_id == team_id).count()
                if current_squad_count >= team.max_squad_size:
                    return False, f"Squad full: {team.team_name} already has {team.max_squad_size} players."

                # Prevent duplicate purchase of an already-sold player
                if self.current_player:
                    already_sold = db.query(AuctionSquadMember).filter(
                        AuctionSquadMember.player_id == self.current_player["id"]
                    ).first()
                    if already_sold:
                        return False, "Player has already been sold to a franchise."

                unfilled_slots = max(0, team.max_squad_size - current_squad_count - 1)
                min_reserve = unfilled_slots * self.min_base_price
                if (remaining_purse - bid_amount) < min_reserve:
                    return False, f"Reserve violation: must retain at least {min_reserve:.1f}L for {unfilled_slots} remaining roster slots."

            self.current_bid = round(bid_amount, 2)
            self.current_bidder = {
                "team_id": team_id,
                "team_name": team_name,
                "owner_name": owner_name
            }
            bid_entry = {
                "type": "BID",
                "team_id": team_id,
                "team_name": team_name,
                "owner_name": owner_name,
                "amount": self.current_bid,
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            self.bid_history.append(bid_entry)

            if db and self.current_player:
                try:
                    audit = AuctionBidAudit(
                        player_id=self.current_player["id"],
                        team_id=team_id,
                        bid_amount=self.current_bid,
                        status="ACCEPTED"
                    )
                    db.add(audit)
                    db.commit()
                except Exception:
                    db.rollback()
                self._persist_live_pointer(db)

            await self.broadcast({
                "event": "NEW_HIGHEST_BID",
                "bid_amount": self.current_bid,
                "current_bid": self.current_bid,
                "team_id": team_id,
                "team_name": team_name,
                "owner_name": owner_name,
                "current_bidder": self.current_bidder,
                "bid_entry": bid_entry,
                "bid_history": self.bid_history[-20:],
                "bid_timer": self.timer_duration
            })
            return True, "Bid placed successfully"

    async def close_bidding(self, outcome: str, db: Optional[Session] = None) -> Dict[str, Any]:
        async with self.lock:
            if outcome not in ["SOLD", "UNSOLD"]:
                outcome = "UNSOLD"

            self.state = outcome
            win_team = self.current_bidder if outcome == "SOLD" else None
            sold_price = self.current_bid if outcome == "SOLD" else 0.0
            player_ref = self.current_player

            if db and player_ref:
                cfg = db.query(AuctionConfig).order_by(AuctionConfig.id.desc()).first()
                entry = None
                if cfg:
                    entry = db.query(AuctionPoolEntry).filter(
                        AuctionPoolEntry.auction_config_id == cfg.id,
                        AuctionPoolEntry.player_id == player_ref["id"]
                    ).first()

                if outcome == "SOLD" and win_team:
                    win_tid = win_team["team_id"]
                    team = db.query(AuctionTeam).filter(AuctionTeam.id == win_tid).first()
                    existing_member = db.query(AuctionSquadMember).filter(
                        AuctionSquadMember.player_id == player_ref["id"]
                    ).first()
                    if team and not existing_member:
                        team.purse_spent = round(team.purse_spent + sold_price, 2)
                        db.add(AuctionSquadMember(
                            team_id=win_tid,
                            player_id=player_ref["id"],
                            purchase_price=sold_price
                        ))
                        db.add(AuctionBidAudit(
                            player_id=player_ref["id"],
                            team_id=win_tid,
                            bid_amount=sold_price,
                            status="SOLD"
                        ))
                        if entry:
                            entry.auction_status = "SOLD"
                            entry.sold_to_team_id = win_tid
                            entry.sold_price = sold_price
                else:
                    if entry:
                        entry.auction_status = "UNSOLD"
                if cfg:
                    cfg.current_player_id = None
                    cfg.current_bid = 0.0
                    cfg.current_bidder_team_id = None
                    cfg.updated_at = datetime.datetime.utcnow()
                try:
                    db.commit()
                except Exception:
                    db.rollback()

            result = {
                "event": f"PLAYER_{outcome}",
                "state": self.state,
                "player": player_ref,
                "final_price": sold_price,
                "winning_team": win_team,
                "winning_team_id": win_team["team_id"] if win_team else None,
                "winning_team_name": win_team["team_name"] if win_team else None
            }
            await self.broadcast(result)
            return result

    async def pause_bidding(self, db: Optional[Session] = None) -> Dict[str, Any]:
        async with self.lock:
            self.state = "PAUSED"
            if db:
                cfg = db.query(AuctionConfig).order_by(AuctionConfig.id.desc()).first()
                if cfg and cfg.status == "LIVE":
                    cfg.status = "PAUSED"
                    cfg.updated_at = datetime.datetime.utcnow()
                    db.commit()
            payload = {"event": "AUCTION_PAUSED", "state": "PAUSED", "message": "Auctioneer paused live bidding."}
            await self.broadcast(payload)
            return payload

    async def resume_bidding(self, db: Optional[Session] = None) -> Dict[str, Any]:
        async with self.lock:
            self.state = "BIDDING_ACTIVE" if self.current_player else "IDLE"
            if db:
                cfg = db.query(AuctionConfig).order_by(AuctionConfig.id.desc()).first()
                if cfg and cfg.status == "PAUSED":
                    cfg.status = "LIVE"
                    cfg.updated_at = datetime.datetime.utcnow()
                    db.commit()
            payload = {"event": "AUCTION_RESUMED", "state": self.state, "message": "Auctioneer resumed live bidding."}
            await self.broadcast(payload)
            return payload

    async def undo_nomination(self, db: Optional[Session] = None) -> Dict[str, Any]:
        async with self.lock:
            cancelled_player = self.current_player
            self.state = "IDLE"
            self.current_player = None
            self.current_bid = 0.0
            self.current_bidder = None
            self.bid_history = []
            if db and cancelled_player:
                cfg = db.query(AuctionConfig).order_by(AuctionConfig.id.desc()).first()
                if cfg:
                    entry = db.query(AuctionPoolEntry).filter(
                        AuctionPoolEntry.auction_config_id == cfg.id,
                        AuctionPoolEntry.player_id == cancelled_player["id"]
                    ).first()
                    if entry and entry.auction_status == "NOMINATED":
                        entry.auction_status = "PENDING"
                self._persist_live_pointer(db)
            result = {
                "event": "NOMINATION_CANCELLED",
                "state": self.state,
                "cancelled_player": cancelled_player,
                "message": "Auctioneer cancelled the active nomination."
            }
            await self.broadcast(result)
            return result

    async def set_timer(self, seconds: int):
        await self.broadcast({
            "event": "TIMER_UPDATED",
            "seconds_remaining": seconds,
            "seconds_left": seconds
        })


# Singleton manager
auction_manager = LiveAuctionManager()
