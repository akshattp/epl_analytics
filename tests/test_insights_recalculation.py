import sqlite3
import pytest

DB_PATH = "data/database/epl_analytics.db"

@pytest.fixture(scope="module")
def db_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    yield conn
    conn.close()

def test_insight_1_top_scorer(db_conn):
    cur = db_conn.cursor()
    row = cur.execute("""
        SELECT p.name, sum(b.runs) as total_runs
        FROM batting_scorecards b
        JOIN players p ON b.player_id = p.id
        GROUP BY p.id
        ORDER BY total_runs DESC
        LIMIT 1
    """).fetchone()
    assert row["name"] == "Sagar Kapadia"
    assert row["total_runs"] == 138

def test_insight_2_strike_rate_leader(db_conn):
    cur = db_conn.cursor()
    # Min 30 balls faced
    row = cur.execute("""
        SELECT p.name, sum(b.runs) as runs, sum(b.balls) as balls,
               round((sum(b.runs)*100.0)/sum(b.balls), 2) as sr
        FROM batting_scorecards b
        JOIN players p ON b.player_id = p.id
        GROUP BY p.id
        HAVING sum(b.balls) >= 30
        ORDER BY (sum(b.runs)*1.0 / sum(b.balls)) DESC
        LIMIT 1
    """).fetchone()
    assert row["name"] == "Shailesh Mali"
    assert row["sr"] == 150.0

def test_insight_3_highest_average_anchor(db_conn):
    cur = db_conn.cursor()
    # Min 5 innings
    row = cur.execute("""
        SELECT p.name, sum(b.runs) as runs, count(b.id) as inn,
               sum(case when b.is_not_out = 0 then 1 else 0 end) as dismissals
        FROM batting_scorecards b
        JOIN players p ON b.player_id = p.id
        GROUP BY p.id
        HAVING inn >= 5
        ORDER BY (sum(b.runs) / max(1, sum(case when b.is_not_out = 0 then 1 else 0 end))) DESC
        LIMIT 1
    """).fetchone()
    assert row["name"] == "Shashi"
    assert row["runs"] == 71
    assert row["dismissals"] == 2

def test_insight_4_knockout_king(db_conn):
    cur = db_conn.cursor()
    row = cur.execute("""
        SELECT p.name, sum(b.runs) as ko_runs
        FROM batting_scorecards b
        JOIN matches m ON b.match_id = m.id
        JOIN players p ON b.player_id = p.id
        WHERE m.stage IN ('Semi Final', 'Final')
        GROUP BY p.id
        ORDER BY ko_runs DESC
        LIMIT 1
    """).fetchone()
    assert row["name"] == "Sagar Kapadia"
    assert row["ko_runs"] == 81

def test_insight_5_all_time_wicket_king(db_conn):
    cur = db_conn.cursor()
    row = cur.execute("""
        SELECT p.name, sum(b.wickets) as total_wkts
        FROM bowling_scorecards b
        JOIN players p ON b.player_id = p.id
        GROUP BY p.id
        ORDER BY total_wkts DESC
        LIMIT 1
    """).fetchone()
    assert row["name"] == "Sagar Kapadia"
    assert row["total_wkts"] == 11

def test_insight_6_economical_bowler(db_conn):
    cur = db_conn.cursor()
    # Min 30 balls
    row = cur.execute("""
        SELECT p.name, sum(b.runs_conceded) as runs, sum(b.legal_balls) as balls,
               round((sum(b.runs_conceded)*6.0)/sum(b.legal_balls), 2) as econ
        FROM bowling_scorecards b
        JOIN players p ON b.player_id = p.id
        WHERE b.innings_type = 'Regular'
        GROUP BY p.id
        HAVING balls >= 30
        ORDER BY econ ASC
        LIMIT 1
    """).fetchone()
    assert row["name"] == "Smeet Shah"
    assert row["econ"] == 3.57

def test_insight_9_most_dominant_team(db_conn):
    cur = db_conn.cursor()
    row = cur.execute("""
        SELECT winner, count(*) as wins
        FROM matches
        WHERE winner IS NOT NULL
        GROUP BY winner
        ORDER BY wins DESC
        LIMIT 1
    """).fetchone()
    assert row["winner"] == "Exotica Warriors"
    assert row["wins"] == 4

def test_insight_10_highest_team_total(db_conn):
    cur = db_conn.cursor()
    row = cur.execute("""
        SELECT batting_team, total_runs, wickets, overs
        FROM innings
        ORDER BY total_runs DESC
        LIMIT 1
    """).fetchone()
    assert row["batting_team"] == "Exotica Warriors"
    assert row["total_runs"] == 62
    assert row["wickets"] == 2

def test_insight_11_lowest_defended_total(db_conn):
    cur = db_conn.cursor()
    matches = cur.execute("SELECT id, winner FROM matches").fetchall()
    defended = []
    for m in matches:
        inns = cur.execute("SELECT batting_team, total_runs FROM innings WHERE match_id = ? AND innings_type='Regular' ORDER BY innings_number", (m["id"],)).fetchall()
        if len(inns) == 2 and inns[0]["batting_team"] == m["winner"]:
            defended.append(inns[0]["total_runs"])
    
    assert min(defended) == 30

def test_insight_12_and_13_toss_and_chase_ratios(db_conn):
    cur = db_conn.cursor()
    matches = cur.execute("SELECT id, winner, toss_winner FROM matches").fetchall()
    toss_wins = sum(1 for m in matches if m["winner"] == m["toss_winner"])
    assert toss_wins == 13 # 13/27 = 48.1%

    chase_wins = 0
    for m in matches:
        inns = cur.execute("SELECT batting_team FROM innings WHERE match_id = ? AND innings_type='Regular' ORDER BY innings_number", (m["id"],)).fetchall()
        if len(inns) == 2 and inns[1]["batting_team"] == m["winner"]:
            chase_wins += 1
    assert chase_wins == 15 # 15/27 = 55.6%
