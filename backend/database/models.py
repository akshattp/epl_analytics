import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, ForeignKey, DateTime, Index
)
from sqlalchemy.orm import relationship
from .db import Base

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    match_code = Column(String(50), unique=True, index=True)
    season = Column(Integer, nullable=False, index=True)
    stage = Column(String(50), nullable=False) # League, Semi Final, Final
    file_name = Column(String(255), nullable=False)
    ground = Column(String(255))
    match_date = Column(String(100))
    team1 = Column(String(100), nullable=False)
    team2 = Column(String(100), nullable=False)
    toss_winner = Column(String(100))
    toss_decision = Column(String(50))
    result = Column(String(255))
    winner = Column(String(100))
    win_margin_runs = Column(Integer, nullable=True)
    win_margin_wickets = Column(Integer, nullable=True)
    is_super_over = Column(Boolean, default=False)
    captains_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    innings = relationship("Innings", back_populates="match", cascade="all, delete-orphan")
    batting_scorecards = relationship("BattingScorecard", back_populates="match")
    bowling_scorecards = relationship("BowlingScorecard", back_populates="match")


class Innings(Base):
    __tablename__ = "innings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False, index=True)
    innings_number = Column(Integer, nullable=False) # 1, 2, 3, 4
    innings_type = Column(String(50), default="Regular") # Regular, Super Over
    batting_team = Column(String(100), nullable=False)
    bowling_team = Column(String(100), nullable=False)
    total_runs = Column(Integer, nullable=False)
    wickets = Column(Integer, nullable=False)
    overs = Column(Float, nullable=False)
    legal_balls = Column(Integer, nullable=False)
    crr = Column(Float, default=0.0)
    extras_runs = Column(Integer, default=0)
    extras_text = Column(String(255), default="")
    did_not_bat_json = Column(Text, default="[]")
    fall_of_wickets = Column(Text, default="")
    batting_runs_sum = Column(Integer, default=0)
    bowling_runs_sum = Column(Integer, default=0)
    uncredited_runs = Column(Integer, default=0)
    validation_status = Column(String(50), default="VALIDATED")
    confidence_score = Column(Float, default=1.0)

    match = relationship("Match", back_populates="innings")
    batting_scorecards = relationship("BattingScorecard", back_populates="innings", cascade="all, delete-orphan")
    bowling_scorecards = relationship("BowlingScorecard", back_populates="innings", cascade="all, delete-orphan")


class Player(Base):
    __tablename__ = "players"

    id = Column(String(50), primary_key=True, index=True) # EPL-P-001
    name = Column(String(100), unique=True, nullable=False, index=True)
    normalized_name = Column(String(100), nullable=False, index=True)
    batting_hand = Column(String(20), default="RHB")
    primary_role = Column(String(50), default="All-rounder")
    secondary_roles_json = Column(Text, default="[]")
    is_registered_auction = Column(Boolean, default=True)
    is_new_player = Column(Boolean, default=False)
    experience_notes = Column(Text, nullable=True)
    trial_rating = Column(Float, nullable=True)
    profile_photo_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    aliases = relationship("PlayerAlias", back_populates="player", cascade="all, delete-orphan")
    batting_scorecards = relationship("BattingScorecard", back_populates="player")
    bowling_scorecards = relationship("BowlingScorecard", back_populates="player")


class PlayerAlias(Base):
    __tablename__ = "player_aliases"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    raw_name = Column(String(100), unique=True, nullable=False, index=True)
    player_id = Column(String(50), ForeignKey("players.id"), nullable=False, index=True)
    status = Column(String(50), default="AUTO_RESOLVED") # AUTO_RESOLVED, MANUALLY_CONFIRMED, PENDING_REVIEW
    notes = Column(Text, nullable=True)

    player = relationship("Player", back_populates="aliases")


class BattingScorecard(Base):
    __tablename__ = "batting_scorecards"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False, index=True)
    innings_id = Column(Integer, ForeignKey("innings.id"), nullable=False, index=True)
    player_id = Column(String(50), ForeignKey("players.id"), nullable=False, index=True)
    raw_player_name = Column(String(100), nullable=False)
    season = Column(Integer, nullable=False, index=True)
    team = Column(String(100), nullable=False)
    batting_position = Column(Integer, nullable=False)
    runs = Column(Integer, nullable=False)
    balls = Column(Integer, nullable=False)
    minutes = Column(Integer, default=0)
    fours = Column(Integer, default=0)
    sixes = Column(Integer, default=0)
    strike_rate = Column(Float, default=0.0)
    dismissal = Column(String(255), nullable=False)
    is_not_out = Column(Boolean, default=False)
    is_captain = Column(Boolean, default=False)
    is_wicketkeeper = Column(Boolean, default=False)
    bowler_name = Column(String(100), nullable=True)
    fielder_name = Column(String(100), nullable=True)
    innings_type = Column(String(50), default="Regular")

    match = relationship("Match", back_populates="batting_scorecards")
    innings = relationship("Innings", back_populates="batting_scorecards")
    player = relationship("Player", back_populates="batting_scorecards")


class BowlingScorecard(Base):
    __tablename__ = "bowling_scorecards"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False, index=True)
    innings_id = Column(Integer, ForeignKey("innings.id"), nullable=False, index=True)
    player_id = Column(String(50), ForeignKey("players.id"), nullable=False, index=True)
    raw_player_name = Column(String(100), nullable=False)
    season = Column(Integer, nullable=False, index=True)
    team = Column(String(100), nullable=False)
    bowling_order = Column(Integer, nullable=False)
    overs = Column(Float, nullable=False)
    legal_balls = Column(Integer, nullable=False)
    maidens = Column(Integer, default=0)
    runs_conceded = Column(Integer, nullable=False)
    wickets = Column(Integer, nullable=False)
    dot_balls = Column(Integer, default=0)
    fours_conceded = Column(Integer, default=0)
    sixes_conceded = Column(Integer, default=0)
    wides = Column(Integer, default=0)
    no_balls = Column(Integer, default=0)
    economy = Column(Float, default=0.0)
    is_captain = Column(Boolean, default=False)
    innings_type = Column(String(50), default="Regular")

    match = relationship("Match", back_populates="bowling_scorecards")
    innings = relationship("Innings", back_populates="bowling_scorecards")
    player = relationship("Player", back_populates="bowling_scorecards")


class DataQualityAudit(Base):
    __tablename__ = "data_quality_audits"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    file_name = Column(String(255), nullable=False)
    season = Column(Integer, nullable=True)
    category = Column(String(50), nullable=False) # PARSING, VALIDATION, IDENTITY_RESOLUTION, ANOMALY
    severity = Column(String(20), default="INFO") # INFO, WARNING, ERROR
    message = Column(Text, nullable=False)
    details_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class AuctionTeam(Base):
    __tablename__ = "auction_teams"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    team_name = Column(String(100), nullable=False, unique=True)
    owner_name = Column(String(100), nullable=False)
    season = Column(Integer, default=2025)
    purse_total = Column(Float, default=100.0)
    purse_spent = Column(Float, default=0.0)
    max_squad_size = Column(Integer, default=8)
    min_squad_size = Column(Integer, default=6)
    logo_text = Column(String(20), default="EPL")
    role_requirements_json = Column(Text, default='{"min_batsmen": 2, "min_bowlers": 2, "min_all_rounders": 2}')

    shortlists = relationship("AuctionShortlist", back_populates="team", cascade="all, delete-orphan")
    squad_members = relationship("AuctionSquadMember", back_populates="team", cascade="all, delete-orphan")


class AuctionShortlist(Base):
    __tablename__ = "auction_shortlists"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    team_id = Column(Integer, ForeignKey("auction_teams.id"), nullable=False, index=True)
    player_id = Column(String(50), ForeignKey("players.id"), nullable=False, index=True)
    priority = Column(String(20), default="Medium") # High, Medium, Low
    max_target_bid = Column(Float, default=15.0)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    team = relationship("AuctionTeam", back_populates="shortlists")
    player = relationship("Player")


class AuctionSquadMember(Base):
    __tablename__ = "auction_squad_members"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    team_id = Column(Integer, ForeignKey("auction_teams.id"), nullable=False, index=True)
    player_id = Column(String(50), ForeignKey("players.id"), nullable=False, index=True)
    purchase_price = Column(Float, nullable=False)
    acquired_at = Column(DateTime, default=datetime.datetime.utcnow)

    team = relationship("AuctionTeam", back_populates="squad_members")
    player = relationship("Player")


class AuctionBidAudit(Base):
    __tablename__ = "auction_bid_audits"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    player_id = Column(String(50), ForeignKey("players.id"), nullable=False, index=True)
    team_id = Column(Integer, ForeignKey("auction_teams.id"), nullable=False, index=True)
    bid_amount = Column(Float, nullable=False)
    status = Column(String(50), default="ACCEPTED") # ACCEPTED, OUTBID, SOLD, UNSOLD
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False) # 'auctioneer' or 'team_owner'
    team_id = Column(Integer, ForeignKey("auction_teams.id"), nullable=True) # None for auctioneer
    display_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    team = relationship("AuctionTeam")


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    token = Column(String(128), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)

    user = relationship("User")


class Partnership(Base):
    """Exact wicket-by-wicket batting partnerships reconstructed from Fall of Wickets & batting order."""
    __tablename__ = "partnerships"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False, index=True)
    innings_id = Column(Integer, ForeignKey("innings.id"), nullable=False, index=True)
    season = Column(Integer, nullable=False, index=True)
    innings_type = Column(String(50), default="Regular")
    batting_team = Column(String(100), nullable=False)
    wicket_number = Column(Integer, nullable=False) # 1 = opening stand, 2 = 2nd wicket, etc.
    batter1_id = Column(String(50), ForeignKey("players.id"), nullable=True, index=True)
    batter1_name = Column(String(100), nullable=False)
    batter2_id = Column(String(50), ForeignKey("players.id"), nullable=True, index=True)
    batter2_name = Column(String(100), nullable=False)
    runs = Column(Integer, nullable=False)
    is_unbroken = Column(Boolean, default=False)
    start_score = Column(Integer, default=0)
    end_score = Column(Integer, default=0)
    start_over = Column(String(20), default="0.0")
    end_over = Column(String(20), default="")
    contribution_pct = Column(Float, default=0.0)
    is_winning_match = Column(Boolean, default=False)
    confidence = Column(String(30), default="EXACT_FOW") # EXACT_FOW, PARTIAL_FOW, MANUAL


class FieldingEvent(Base):
    """Canonical fielding dismissals extracted from scorecard dismissal text or future manual entry."""
    __tablename__ = "fielding_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False, index=True)
    innings_id = Column(Integer, ForeignKey("innings.id"), nullable=False, index=True)
    batting_scorecard_id = Column(Integer, ForeignKey("batting_scorecards.id"), nullable=True, index=True)
    season = Column(Integer, nullable=False, index=True)
    innings_type = Column(String(50), default="Regular")
    fielding_team = Column(String(100), nullable=False)
    fielder_id = Column(String(50), ForeignKey("players.id"), nullable=True, index=True)
    fielder_name = Column(String(100), nullable=False)
    dismissal_type = Column(String(30), nullable=False) # catch, caught_and_bowled, run_out, run_out_assist, stumping
    bowler_name = Column(String(100), nullable=True)
    batter_id = Column(String(50), ForeignKey("players.id"), nullable=True)
    dismissal_raw = Column(String(255), default="")
    is_manual_entry = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class AuctionConfig(Base):
    """Persisted configuration & lifecycle state for an EPL Auction session."""
    __tablename__ = "auction_configs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    auction_name = Column(String(150), default="EPL 2026 Official Player Auction")
    season_year = Column(Integer, default=2026)
    auction_date = Column(String(50), default="2026-12-01")
    num_teams = Column(Integer, default=6)
    initial_purse = Column(Float, default=100.0)
    min_base_price = Column(Float, default=2.0)
    min_bid_increment = Column(Float, default=0.5)
    min_squad_size = Column(Integer, default=6)
    max_squad_size = Column(Integer, default=8)
    timer_duration = Column(Integer, default=15)
    categories_json = Column(Text, default='["Marquee / Elite", "Tier 1 (High Impact)", "Tier 2 (Solid Core)", "Role Specialist", "Uncapped / New"]')
    unsold_rule = Column(String(100), default="Accelerated Round at 50% Base Price")
    retention_rule = Column(String(100), default="No Retentions (Full Fresh Auction)")
    auction_format = Column(String(50), default="Live Ascending English Auction")
    nomination_order = Column(String(50), default="Category Tier (Marquee First)")
    status = Column(String(30), default="DRAFT") # DRAFT, CONFIGURED, LIVE, PAUSED, COMPLETED
    locked = Column(Boolean, default=False)
    current_player_id = Column(String(50), nullable=True)
    current_bid = Column(Float, default=0.0)
    current_bidder_team_id = Column(Integer, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)


class AuctionPoolEntry(Base):
    """Configurable player pool for an auction session linked to canonical players."""
    __tablename__ = "auction_pool_entries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    auction_config_id = Column(Integer, ForeignKey("auction_configs.id"), nullable=False, index=True)
    player_id = Column(String(50), ForeignKey("players.id"), nullable=False, index=True)
    category = Column(String(60), default="Tier 2 (Solid Core)")
    base_price = Column(Float, default=2.0)
    is_available = Column(Boolean, default=True)
    is_returning = Column(Boolean, default=True)
    nomination_rank = Column(Integer, default=100)
    auction_status = Column(String(30), default="PENDING") # PENDING, NOMINATED, SOLD, UNSOLD
    sold_to_team_id = Column(Integer, ForeignKey("auction_teams.id"), nullable=True)
    sold_price = Column(Float, nullable=True)
    notes = Column(Text, default="")

    player = relationship("Player")
    auction_config = relationship("AuctionConfig")


