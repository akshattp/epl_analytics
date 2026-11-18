import os
import glob
import sqlite3
import pytest

DB_PATH = "data/database/epl_analytics.db"

@pytest.fixture(scope="module")
def db_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    yield conn
    conn.close()

def test_historical_pdf_count():
    pdfs_2023 = glob.glob("data/raw/EPL Data/2023/*.pdf")
    pdfs_2024 = glob.glob("data/raw/EPL Data/2024/*.pdf")
    pdfs_2025 = glob.glob("data/raw/EPL Data/2025/*.pdf")
    assert len(pdfs_2023) == 9
    assert len(pdfs_2024) == 9
    assert len(pdfs_2025) == 9
    assert len(pdfs_2023) + len(pdfs_2024) + len(pdfs_2025) == 27

def test_matches_database_integrity(db_conn):
    cur = db_conn.cursor()
    matches = cur.execute("SELECT * FROM matches ORDER BY season, id").fetchall()
    assert len(matches) == 27
    
    # 9 matches per season
    for season in [2023, 2024, 2025]:
        s_matches = [m for m in matches if m["season"] == season]
        assert len(s_matches) == 9
        # Exactly 1 final per season
        finals = [m for m in s_matches if m["stage"] == "Final"]
        assert len(finals) == 1
        # Exactly 2 semifinals per season
        semis = [m for m in s_matches if m["stage"] == "Semi Final"]
        assert len(semis) == 2

def test_super_over_separation(db_conn):
    cur = db_conn.cursor()
    # SemiFinal 1 2025 has super over
    so_match = cur.execute("SELECT * FROM matches WHERE is_super_over = 1").fetchone()
    assert so_match is not None
    assert so_match["season"] == 2025
    assert "SemiFinal1" in so_match["file_name"] or "SEMIFINAL1" in so_match["match_code"]

    inns = cur.execute("SELECT * FROM innings WHERE match_id = ?", (so_match["id"],)).fetchall()
    assert len(inns) == 4
    regular = [i for i in inns if i["innings_type"] == "Regular"]
    super_overs = [i for i in inns if i["innings_type"] == "Super Over"]
    assert len(regular) == 2
    assert len(super_overs) == 2

def test_player_identity_disambiguation(db_conn):
    cur = db_conn.cursor()
    # Sagar vs Sagar Kapadia
    sk = cur.execute("SELECT * FROM players WHERE name = 'Sagar Kapadia'").fetchone()
    s = cur.execute("SELECT * FROM players WHERE name = 'Sagar'").fetchone()
    assert sk is not None and s is not None
    assert sk["id"] != s["id"]
    assert sk["id"] == "EPL-P-001"
    assert s["id"] == "EPL-P-058"

    # Shashi vs Shashikant Sharma
    sh = cur.execute("SELECT * FROM players WHERE name = 'Shashi'").fetchone()
    ss = cur.execute("SELECT * FROM players WHERE name = 'Shashikant Sharma'").fetchone()
    assert sh is not None and ss is not None
    assert sh["id"] != ss["id"]
    assert sh["id"] == "EPL-P-003"
    assert ss["id"] == "EPL-P-046"

def test_all_players_have_scorecard_records(db_conn):
    cur = db_conn.cursor()
    players = cur.execute("SELECT id, name FROM players").fetchall()
    assert len(players) == 73

    for p in players:
        pid = p["id"]
        b_count = cur.execute("SELECT count(*) FROM batting_scorecards WHERE player_id = ?", (pid,)).fetchone()[0]
        bw_count = cur.execute("SELECT count(*) FROM bowling_scorecards WHERE player_id = ?", (pid,)).fetchone()[0]
        assert b_count + bw_count > 0, f"Player {p['name']} has 0 records!"

def test_uncredited_runs_audit_logging(db_conn):
    cur = db_conn.cursor()
    audits = cur.execute("SELECT * FROM data_quality_audits").fetchall()
    assert len(audits) >= 5
    messages = [a["message"] for a in audits]
    assert any("Uncredited adjustment" in m for m in messages)
