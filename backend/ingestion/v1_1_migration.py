"""
Additive Version 1.1 Migration & Data Enrichment Script for EPL Analytics.
- Preserves all existing tables and historical records.
- Safely adds v1.1 columns to auction_teams and creates 4 new tables:
  partnerships, fielding_events, auction_configs, auction_pool_entries.
- Recovers complete multi-line Fall of Wickets from untouched source PDFs.
- Reconstructs exact wicket-by-wicket partnerships from FOW + batting order.
- Extracts canonical fielding events (catches, c&b, run-outs, joint assists, stumpings).
- Seeds editable AuctionConfig and AuctionPoolEntry rows for all canonical players.
"""
import os
import re
import glob
import json
import sqlite3
from typing import Dict, List, Optional, Tuple
import pymupdf

from backend.database.db import engine, SessionLocal, Base, DB_PATH
from backend.database.models import (
    Match, Innings, Player, PlayerAlias, BattingScorecard,
    AuctionTeam, Partnership, FieldingEvent, AuctionConfig, AuctionPoolEntry
)
from backend.services.player_service import get_all_players_summary


def safe_add_columns():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    existing_cols = {r[1] for r in cur.execute("PRAGMA table_info('auction_teams')").fetchall()}
    additions = [
        ("min_squad_size", "INTEGER DEFAULT 6"),
        ("logo_text", "VARCHAR(20) DEFAULT 'EPL'"),
        ("role_requirements_json", "TEXT DEFAULT '{\"min_batsmen\": 2, \"min_bowlers\": 2, \"min_all_rounders\": 2}'")
    ]
    for col, ddl in additions:
        if col not in existing_cols:
            cur.execute(f"ALTER TABLE auction_teams ADD COLUMN {col} {ddl}")
            print(f"[Migration] Added column auction_teams.{col}")

    # Set clean monograms for existing 6 teams
    monograms = {
        "Victory Vipers": "VV",
        "Exotica Warriors": "EW",
        "The Ultimates": "TU",
        "Exotica Panthers": "EP",
        "Exotica Living Legenda": "ELL",
        "Exotica Living Legends": "ELL",
        "Exotica Lions Pride": "ELP",
    }
    for tname, mono in monograms.items():
        cur.execute("UPDATE auction_teams SET logo_text = ? WHERE team_name = ? AND (logo_text IS NULL OR logo_text = 'EPL')", (mono, tname))

    conn.commit()
    conn.close()


def extract_full_fow_blocks_from_pdf(pdf_path: str) -> List[str]:
    """Extracts complete Fall of Wickets strings (even when wrapped across lines) from a CricHeroes PDF."""
    doc = pymupdf.open(pdf_path)
    full_text = "\n".join(page.get_text("text") for page in doc)
    doc.close()

    blocks: List[str] = []
    lines = [ln.strip() for ln in full_text.splitlines()]
    i = 0
    while i < len(lines):
        if lines[i].lower() == "fall of wickets":
            j = i + 1
            fow_parts: List[str] = []
            while j < len(lines):
                ln = lines[j]
                if not ln:
                    j += 1
                    continue
                low = ln.lower()
                # Stop at bowling table header or footer markers
                if low in ("no", "bowler", "to bat") or low.startswith("epl mens") or low.startswith("cricheroes.com") or re.match(r"^\d+\s+of\s+\d+$", low):
                    break
                if re.match(r"^\d+/\d+/\d+,", low):
                    break
                fow_parts.append(ln)
                j += 1
            joined = " ".join(fow_parts).strip()
            blocks.append(joined)
            i = j
        else:
            i += 1
    return blocks


def recover_complete_fow(db):
    """Repairs truncated fall_of_wickets strings in innings by reading untouched raw PDFs."""
    pdfs = glob.glob("data/raw/**/*.pdf", recursive=True)
    pdf_by_name = {os.path.basename(p): p for p in pdfs}
    updated = 0

    matches = db.query(Match).all()
    for m in matches:
        pdf_path = pdf_by_name.get(m.file_name)
        if not pdf_path:
            continue
        fow_blocks = extract_full_fow_blocks_from_pdf(pdf_path)
        innings_list = db.query(Innings).filter(Innings.match_id == m.id).order_by(Innings.innings_number).all()
        for idx, inn in enumerate(innings_list):
            if idx < len(fow_blocks):
                new_fow = fow_blocks[idx]
                old_fow = (inn.fall_of_wickets or "").strip()
                if new_fow and len(new_fow) > len(old_fow):
                    inn.fall_of_wickets = new_fow
                    updated += 1
    db.commit()
    print(f"[Migration] Recovered complete multi-line Fall of Wickets for {updated} innings.")


def build_name_resolver(db) -> Tuple[Dict[str, Tuple[str, str]], Dict[str, str]]:
    """Returns lookup map lowercase_name -> (player_id, canonical_name) and id -> canonical_name."""
    players = db.query(Player).all()
    id_to_name = {p.id: p.name for p in players}
    lookup: Dict[str, Tuple[str, str]] = {}

    for p in players:
        lookup[p.name.strip().lower()] = (p.id, p.name)
        lookup[p.normalized_name.strip().lower()] = (p.id, p.name)

    for al in db.query(PlayerAlias).all():
        cname = id_to_name.get(al.player_id, al.raw_name)
        lookup[al.raw_name.strip().lower()] = (al.player_id, cname)
        cleaned = re.sub(r"[†*]", "", al.raw_name).replace("(c)", "").replace("(wk)", "").strip().lower()
        if cleaned:
            lookup[cleaned] = (al.player_id, cname)

    return lookup, id_to_name


def resolve_name(raw: str, lookup: Dict[str, Tuple[str, str]]) -> Tuple[Optional[str], str]:
    if not raw:
        return None, ""
    cleaned = re.sub(r"[†*]", "", raw)
    cleaned = re.sub(r"\((c|wk|vc)\)", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    key = cleaned.lower()
    if key in lookup:
        return lookup[key]
    # Try removing trailing punctuation
    key2 = key.strip(" .,-")
    if key2 in lookup:
        return lookup[key2]
    # Substring fallback only for exact unique token match
    for k, val in lookup.items():
        if k == key2:
            return val
    return None, cleaned


def parse_fow_entries(fow_text: str) -> List[Dict]:
    """
    Parses CricHeroes Fall of Wickets entries like:
    '3-1 (Sunil Kakani, 1.5 ov), 4-2 (Sagar Kapadia, 2.2 ov)'
    """
    if not fow_text or fow_text.strip() in ("-", ""):
        return []
    pattern = re.compile(r"(\d+)-(\d+)\s*\(([^,()]+?)(?:,\s*([0-9.]+\s*ov))?\)")
    entries = []
    for m in pattern.finditer(fow_text):
        entries.append({
            "score": int(m.group(1)),
            "wicket": int(m.group(2)),
            "batter_raw": m.group(3).strip(),
            "over": (m.group(4) or "").replace("ov", "").strip()
        })
    entries.sort(key=lambda x: x["wicket"])
    return entries


def reconstruct_partnerships(db, lookup: Dict[str, Tuple[str, str]], id_to_name: Dict[str, str]):
    """Reconstructs exact wicket-by-wicket partnerships across all innings from FOW + batting order."""
    db.query(Partnership).delete()
    db.commit()

    matches_by_id = {m.id: m for m in db.query(Match).all()}
    innings_list = db.query(Innings).order_by(Innings.id).all()
    created = 0
    exact_count = 0

    for inn in innings_list:
        match = matches_by_id.get(inn.match_id)
        if not match:
            continue
        is_win = (match.winner or "").strip().lower() == (inn.batting_team or "").strip().lower()

        batters = (
            db.query(BattingScorecard)
            .filter(BattingScorecard.innings_id == inn.id)
            .order_by(BattingScorecard.batting_position)
            .all()
        )
        if len(batters) < 2:
            continue

        fow_entries = parse_fow_entries(inn.fall_of_wickets or "")
        # Opening pair
        b1 = (batters[0].player_id, id_to_name.get(batters[0].player_id, batters[0].raw_player_name))
        b2 = (batters[1].player_id, id_to_name.get(batters[1].player_id, batters[1].raw_player_name))
        active = [b1, b2]
        next_idx = 2
        prev_score = 0
        prev_over = "0.0"

        for fow in fow_entries:
            out_pid, out_name = resolve_name(fow["batter_raw"], lookup)
            p_runs = max(0, fow["score"] - prev_score)
            contrib = round((p_runs / inn.total_runs) * 100.0, 1) if inn.total_runs > 0 else 0.0

            p1, p2 = active[0], active[1]
            db.add(Partnership(
                match_id=inn.match_id,
                innings_id=inn.id,
                season=match.season,
                innings_type=inn.innings_type,
                batting_team=inn.batting_team,
                wicket_number=fow["wicket"],
                batter1_id=p1[0],
                batter1_name=p1[1],
                batter2_id=p2[0],
                batter2_name=p2[1],
                runs=p_runs,
                is_unbroken=False,
                start_score=prev_score,
                end_score=fow["score"],
                start_over=prev_over,
                end_over=fow["over"],
                contribution_pct=contrib,
                is_winning_match=is_win,
                confidence="EXACT_FOW"
            ))
            created += 1
            exact_count += 1

            # Replace dismissed batter with next batter in order
            if next_idx < len(batters):
                nb = (batters[next_idx].player_id, id_to_name.get(batters[next_idx].player_id, batters[next_idx].raw_player_name))
                next_idx += 1
                if out_pid and active[0][0] == out_pid:
                    active[0] = nb
                elif out_pid and active[1][0] == out_pid:
                    active[1] = nb
                elif out_name and out_name.lower() in active[0][1].lower():
                    active[0] = nb
                else:
                    active[1] = nb
            prev_score = fow["score"]
            prev_over = fow["over"]

        # Unbroken partnership after last wicket (or 0-wicket unbroken innings)
        remaining_runs = inn.total_runs - prev_score
        if (len(fow_entries) == 0 and inn.total_runs >= 0) or (remaining_runs > 0 and len(active) == 2 and inn.wickets < len(batters)):
            # Only add unbroken stand if at least 2 batters remained (not all out)
            not_out_batters = [b for b in batters if b.is_not_out]
            if len(not_out_batters) >= 2:
                u1 = (not_out_batters[0].player_id, id_to_name.get(not_out_batters[0].player_id, not_out_batters[0].raw_player_name))
                u2 = (not_out_batters[1].player_id, id_to_name.get(not_out_batters[1].player_id, not_out_batters[1].raw_player_name))
                p_runs = max(0, inn.total_runs - prev_score)
                contrib = round((p_runs / inn.total_runs) * 100.0, 1) if inn.total_runs > 0 else 0.0
                db.add(Partnership(
                    match_id=inn.match_id,
                    innings_id=inn.id,
                    season=match.season,
                    innings_type=inn.innings_type,
                    batting_team=inn.batting_team,
                    wicket_number=len(fow_entries) + 1,
                    batter1_id=u1[0],
                    batter1_name=u1[1],
                    batter2_id=u2[0],
                    batter2_name=u2[1],
                    runs=p_runs,
                    is_unbroken=True,
                    start_score=prev_score,
                    end_score=inn.total_runs,
                    start_over=prev_over,
                    end_over=str(inn.overs),
                    contribution_pct=contrib,
                    is_winning_match=is_win,
                    confidence="EXACT_FOW"
                ))
                created += 1
                exact_count += 1

    db.commit()
    print(f"[Migration] Reconstructed {created} exact wicket-by-wicket partnerships across {len(innings_list)} innings.")


def extract_fielding_events(db, lookup: Dict[str, Tuple[str, str]]):
    """Extracts canonical catches, c&b, stumpings, and run-outs (including joint assists) from batting_scorecards."""
    # Preserve manual entries; rebuild auto-extracted rows
    db.query(FieldingEvent).filter(FieldingEvent.is_manual_entry == False).delete()
    db.commit()

    innings_by_id = {i.id: i for i in db.query(Innings).all()}
    rows = db.query(BattingScorecard).all()
    created = 0
    resolved = 0

    for sc in rows:
        d = (sc.dismissal or "").strip()
        dl = d.lower()
        inn = innings_by_id.get(sc.innings_id)
        fielding_team = inn.bowling_team if inn else ""

        if dl in ("not out", "", "retired hurt", "hit the ball twice") or dl.startswith("b ") or dl.startswith("hit wkt"):
            continue

        # 1. Caught & Bowled
        if dl.startswith("c & b") or dl.startswith("c&b"):
            raw_name = sc.bowler_name or re.sub(r"^c\s*&\s*b\s*", "", d, flags=re.IGNORECASE).strip()
            fid, fname = resolve_name(raw_name, lookup)
            db.add(FieldingEvent(
                match_id=sc.match_id, innings_id=sc.innings_id, batting_scorecard_id=sc.id,
                season=sc.season, innings_type=sc.innings_type, fielding_team=fielding_team,
                fielder_id=fid, fielder_name=fname or raw_name, dismissal_type="caught_and_bowled",
                bowler_name=sc.bowler_name, batter_id=sc.player_id, dismissal_raw=d, is_manual_entry=False
            ))
            created += 1
            if fid: resolved += 1
            continue

        # 2. Stumped
        if dl.startswith("st "):
            raw_f = sc.fielder_name or re.sub(r"^st\s+", "", d, flags=re.IGNORECASE).split(" b ")[0].strip()
            fid, fname = resolve_name(raw_f, lookup)
            db.add(FieldingEvent(
                match_id=sc.match_id, innings_id=sc.innings_id, batting_scorecard_id=sc.id,
                season=sc.season, innings_type=sc.innings_type, fielding_team=fielding_team,
                fielder_id=fid, fielder_name=fname or raw_f, dismissal_type="stumping",
                bowler_name=sc.bowler_name, batter_id=sc.player_id, dismissal_raw=d, is_manual_entry=False
            ))
            created += 1
            if fid: resolved += 1
            continue

        # 3. Caught
        if dl.startswith("c "):
            raw_f = sc.fielder_name or re.sub(r"^c\s+", "", d, flags=re.IGNORECASE).split(" b ")[0].strip()
            fid, fname = resolve_name(raw_f, lookup)
            db.add(FieldingEvent(
                match_id=sc.match_id, innings_id=sc.innings_id, batting_scorecard_id=sc.id,
                season=sc.season, innings_type=sc.innings_type, fielding_team=fielding_team,
                fielder_id=fid, fielder_name=fname or raw_f, dismissal_type="catch",
                bowler_name=sc.bowler_name, batter_id=sc.player_id, dismissal_raw=d, is_manual_entry=False
            ))
            created += 1
            if fid: resolved += 1
            continue

        # 4. Run Out (direct or joint 'A / B')
        if "run out" in dl:
            raw_f = sc.fielder_name or re.sub(r"^run\s*out\s*", "", d, flags=re.IGNORECASE).strip(" ()")
            parts = [p.strip() for p in raw_f.split("/") if p.strip()]
            if not parts:
                continue
            for idx_p, part in enumerate(parts):
                fid, fname = resolve_name(part, lookup)
                dtype = "run_out" if len(parts) == 1 else "run_out_assist"
                db.add(FieldingEvent(
                    match_id=sc.match_id, innings_id=sc.innings_id, batting_scorecard_id=sc.id,
                    season=sc.season, innings_type=sc.innings_type, fielding_team=fielding_team,
                    fielder_id=fid, fielder_name=fname or part, dismissal_type=dtype,
                    bowler_name=None, batter_id=sc.player_id, dismissal_raw=d, is_manual_entry=False
                ))
                created += 1
                if fid: resolved += 1

    db.commit()
    print(f"[Migration] Extracted {created} fielding events ({resolved}/{created} canonical player IDs resolved).")


def seed_default_auction_config_and_pool(db):
    """Creates default editable AuctionConfig & AuctionPoolEntry records if absent."""
    cfg = db.query(AuctionConfig).order_by(AuctionConfig.id.desc()).first()
    if not cfg:
        cfg = AuctionConfig(
            auction_name="EPL 2026 Official Player Auction",
            season_year=2026,
            auction_date="2026-12-15",
            num_teams=6,
            initial_purse=100.0,
            min_base_price=2.0,
            min_bid_increment=0.5,
            min_squad_size=6,
            max_squad_size=8,
            timer_duration=15,
            status="DRAFT",
            locked=False
        )
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
        print(f"[Migration] Created default AuctionConfig id={cfg.id} ({cfg.auction_name}).")

    existing_pool_pids = {
        r[0] for r in db.query(AuctionPoolEntry.player_id).filter(AuctionPoolEntry.auction_config_id == cfg.id).all()
    }
    summaries = get_all_players_summary(db)
    summaries.sort(key=lambda x: -x["valuation"]["estimated_valuation"])

    added = 0
    for rank, p in enumerate(summaries, start=1):
        if p["player_id"] not in existing_pool_pids:
            db.add(AuctionPoolEntry(
                auction_config_id=cfg.id,
                player_id=p["player_id"],
                category=p["valuation"]["category"],
                base_price=p["valuation"]["base_price"],
                is_available=True,
                is_returning=not p["is_new_player"],
                nomination_rank=rank,
                auction_status="PENDING"
            ))
            added += 1
    db.commit()
    print(f"[Migration] Seeded {added} AuctionPoolEntry records (total pool: {len(existing_pool_pids) + added}).")


def run_migration():
    safe_add_columns()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        recover_complete_fow(db)
        lookup, id_to_name = build_name_resolver(db)
        reconstruct_partnerships(db, lookup, id_to_name)
        extract_fielding_events(db, lookup)
        seed_default_auction_config_and_pool(db)
        print("[Migration] EPL v1.1 additive migration completed cleanly.")
    finally:
        db.close()


if __name__ == "__main__":
    run_migration()
