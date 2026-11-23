"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Trophy, Shield, Zap, Star,
  TrendingUp, ChevronDown, ChevronUp,
  Info, AlertCircle, Award, Target
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RankedPlayer {
  player_id: string;
  name: string;
  primary_role: string;
  experience_level: string;
  matches: number;
  innings: number;
  total_runs: number;
  batting_average: number;
  average_display: string;
  strike_rate: number;
  highest_score_display: string;
  scores_15_plus: number;
  scores_20_plus: number;
  legal_balls: number;
  overs_display: string;
  wickets: number;
  economy: number;
  bowling_average: number | null;
  dot_ball_percentage: number;
  impact_all_rounder_matches: number;
  // BAT
  bat_rank: number | null;
  bat_rank_of: number;
  bat_score: number | null;
  bat_score_raw: number | null;
  bat_eligible: boolean;
  bat_eligibility_reason: string;
  bat_confidence_level: string;
  bat_confidence_score: number;
  bat_shrinkage_weight?: number;
  bat_components: Record<string, unknown>;
  // BOWL
  bowl_rank: number | null;
  bowl_rank_of: number;
  bowl_score: number | null;
  bowl_score_raw: number | null;
  bowl_eligible: boolean;
  bowl_eligibility_reason: string;
  bowl_confidence_level: string;
  bowl_confidence_score: number;
  bowl_components: Record<string, unknown>;
  // AR
  ar_rank: number | null;
  ar_rank_of: number;
  ar_score: number | null;
  ar_eligible: boolean;
  ar_eligibility_reason: string;
  ar_confidence_level: string;
  ar_components: Record<string, unknown>;
  // OVERALL
  overall_rank: number | null;
  overall_rank_of: number;
  overall_score: number | null;
  overall_score_raw?: number | null;
  overall_path: string;
  overall_confidence_level: string;
  overall_confidence_score: number;
  overall_components: Record<string, unknown>;
}

type Tab = "batting" | "bowling" | "allround" | "overall";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CONFIDENCE_COLOURS: Record<string, string> = {
  HIGH:     "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  MEDIUM:   "bg-amber-500/15 text-amber-500 border-amber-500/30",
  LOW:      "bg-orange-500/15 text-orange-500 border-orange-500/30",
  "VERY LOW": "bg-red-500/15 text-red-500 border-red-500/30",
  "N/A":    "bg-[#2A2E38]/40 text-[#A8A295] border-[#2A2E38]",
};

const PATH_COLOURS: Record<string, string> = {
  "All-Round":        "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "Batting":          "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Bowling":          "bg-green-500/15 text-green-400 border-green-500/30",
  "Dual-Discipline":  "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  "No Evidence":      "bg-[#2A2E38]/40 text-[#A8A295] border-[#2A2E38]",
};

function ConfidenceBadge({ level }: { level: string }) {
  const cls = CONFIDENCE_COLOURS[level] || CONFIDENCE_COLOURS["N/A"];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border ${cls}`}>
      {level}
    </span>
  );
}

function PathBadge({ path }: { path: string }) {
  const cls = PATH_COLOURS[path] || PATH_COLOURS["No Evidence"];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cls}`}>
      {path}
    </span>
  );
}

function ScoreBar({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.min(100, (score / max) * 100);
  const color =
    pct >= 70 ? "bg-[#FF4B35]" :
    pct >= 50 ? "bg-amber-500" :
    pct >= 30 ? "bg-blue-500" : "bg-[#4A5068]";
  return (
    <div className="w-full h-1.5 rounded-sm bg-[#2A2E38] overflow-hidden">
      <div className={`h-full rounded-sm transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function fmt(n: number | null | undefined, dec = 1) {
  if (n == null) return "—";
  return n.toFixed(dec);
}

// ─── Row component (expandable) ──────────────────────────────────────────────

function PlayerRow({
  player,
  tab,
  rank,
}: {
  player: RankedPlayer;
  tab: Tab;
  rank: number | null;
}) {
  const [expanded, setExpanded] = useState(false);

  const score =
    tab === "batting" ? player.bat_score :
    tab === "bowling" ? player.bowl_score :
    tab === "allround" ? player.ar_score :
    player.overall_score;

  const confLevel =
    tab === "batting" ? player.bat_confidence_level :
    tab === "bowling" ? player.bowl_confidence_level :
    tab === "allround" ? player.ar_confidence_level :
    player.overall_confidence_level;

  const isIneligible = score === null;

  return (
    <>
      <tr
        className={`border-b border-[#2A2E38]/40 cursor-pointer transition-colors ${
          isIneligible
            ? "opacity-50 hover:bg-[#181A20]/30"
            : "hover:bg-[#181A20]/60"
        }`}
        onClick={() => !isIneligible && setExpanded(!expanded)}
      >
        {/* Rank */}
        <td className="py-3 px-4 text-center">
          {rank ? (
            <span className={`font-mono font-bold text-sm ${rank <= 3 ? "text-[#FF4B35]" : "text-[#A8A295]"}`}>
              #{rank}
            </span>
          ) : (
            <span className="text-[#4A5068] text-xs">—</span>
          )}
        </td>

        {/* Player */}
        <td className="py-3 px-4">
          <Link
            href={`/players/${player.player_id}`}
            className="font-semibold text-sm text-[#F1EBDD] hover:text-[#FF4B35] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {player.name}
          </Link>
          <div className="text-[11px] text-[#A8A295] mt-0.5">
            {player.primary_role} · {player.matches}M
          </div>
        </td>

        {/* Score */}
        <td className="py-3 px-4">
          {score !== null ? (
            <div>
              <div className="font-mono font-bold text-lg text-[#FF4B35]">{fmt(score)}</div>
              <ScoreBar score={score} />
            </div>
          ) : (
            <div className="text-[11px] text-[#A8A295] italic">
              {tab === "batting" ? player.bat_eligibility_reason :
               tab === "bowling" ? player.bowl_eligibility_reason :
               tab === "allround" ? player.ar_eligibility_reason :
               "No data"}
            </div>
          )}
        </td>

        {/* Confidence */}
        <td className="py-3 px-4 hidden sm:table-cell">
          <ConfidenceBadge level={confLevel || "N/A"} />
        </td>

        {/* Discipline-specific stats */}
        {tab === "batting" && (
          <>
            <td className="py-3 px-4 hidden md:table-cell font-mono text-sm text-[#F1EBDD]">{player.total_runs}</td>
            <td className="py-3 px-4 hidden md:table-cell font-mono text-sm text-[#F1EBDD]">{fmt(player.batting_average)}</td>
            <td className="py-3 px-4 hidden lg:table-cell font-mono text-sm text-[#F1EBDD]">{fmt(player.strike_rate)}</td>
            <td className="py-3 px-4 hidden lg:table-cell font-mono text-sm text-[#F1EBDD]">{player.highest_score_display}</td>
          </>
        )}

        {tab === "bowling" && (
          <>
            <td className="py-3 px-4 hidden md:table-cell font-mono text-sm text-[#F1EBDD]">{player.wickets}</td>
            <td className="py-3 px-4 hidden md:table-cell font-mono text-sm text-[#F1EBDD]">{fmt(player.economy)}</td>
            <td className="py-3 px-4 hidden lg:table-cell font-mono text-sm text-[#F1EBDD]">{player.overs_display}</td>
            <td className="py-3 px-4 hidden lg:table-cell font-mono text-sm text-[#F1EBDD]">{fmt(player.dot_ball_percentage)}%</td>
          </>
        )}

        {tab === "allround" && (
          <>
            <td className="py-3 px-4 hidden md:table-cell font-mono text-sm text-[#F1EBDD]">{player.total_runs}</td>
            <td className="py-3 px-4 hidden md:table-cell font-mono text-sm text-[#F1EBDD]">{player.wickets}</td>
            <td className="py-3 px-4 hidden lg:table-cell font-mono text-sm text-[#F1EBDD]">{player.impact_all_rounder_matches}</td>
          </>
        )}

        {tab === "overall" && (
          <>
            <td className="py-3 px-4 hidden md:table-cell">
              <PathBadge path={player.overall_path || "No Evidence"} />
            </td>
            <td className="py-3 px-4 hidden lg:table-cell font-mono text-sm text-[#F1EBDD]">{player.total_runs}</td>
            <td className="py-3 px-4 hidden lg:table-cell font-mono text-sm text-[#F1EBDD]">{player.wickets}</td>
          </>
        )}

        {/* Expand toggle */}
        <td className="py-3 px-4 hidden sm:table-cell text-[#4A5068]">
          {!isIneligible && (
            expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
          )}
        </td>
      </tr>

      {/* Expanded component breakdown */}
      {expanded && !isIneligible && (
        <tr className="bg-[#0D1017] border-b border-[#2A2E38]/40">
          <td colSpan={10} className="px-6 py-4">
            <ComponentBreakdown player={player} tab={tab} />
          </td>
        </tr>
      )}
    </>
  );
}

function ComponentBreakdown({ player, tab }: { player: RankedPlayer; tab: Tab }) {
  if (tab === "batting") {
    const c = player.bat_components as Record<string, number>;
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Volume", key: "volume", max: 25 },
          { label: "Velocity (SR)", key: "velocity", max: 30 },
          { label: "Reliability (Avg)", key: "reliability", max: 25 },
          { label: "Boundary%", key: "boundary", max: 10 },
          { label: "Milestones", key: "milestone", max: 10 },
        ].map(({ label, key, max }) => (
          <div key={key} className="bg-[#181A20] rounded-xl p-3 border border-[#2A2E38]">
            <div className="text-[10px] text-[#A8A295] uppercase tracking-wide mb-1">{label}</div>
            <div className="font-mono text-lg font-bold text-[#FF4B35]">{fmt(c[key])}</div>
            <div className="text-[10px] text-[#4A5068]">/ {max}</div>
            <ScoreBar score={c[key] || 0} max={max} />
          </div>
        ))}
        <div className="col-span-2 md:col-span-5 mt-1 text-[10px] text-[#4A5068] font-mono">
          Shrinkage weight: {fmt(player.bat_shrinkage_weight as unknown as number, 3)} · Raw score: {fmt(player.bat_score_raw)}
        </div>
      </div>
    );
  }

  if (tab === "bowling") {
    const c = player.bowl_components as Record<string, number>;
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Wicket Threat", key: "wicket_taking", max: 35 },
          { label: "Economy", key: "economy", max: 30 },
          { label: "Dot Balls", key: "dot_balls", max: 20 },
          { label: "Consistency", key: "consistency", max: 15 },
        ].map(({ label, key, max }) => (
          <div key={key} className="bg-[#181A20] rounded-xl p-3 border border-[#2A2E38]">
            <div className="text-[10px] text-[#A8A295] uppercase tracking-wide mb-1">{label}</div>
            <div className="font-mono text-lg font-bold text-[#FF4B35]">{fmt(c[key])}</div>
            <div className="text-[10px] text-[#4A5068]">/ {max}</div>
            <ScoreBar score={c[key] || 0} max={max} />
          </div>
        ))}
        <div className="col-span-2 md:col-span-4 mt-1 text-[10px] text-[#4A5068] font-mono">
          Raw score: {fmt(player.bowl_score_raw)}
        </div>
      </div>
    );
  }

  if (tab === "allround") {
    const c = player.ar_components as Record<string, number>;
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#181A20] rounded-xl p-3 border border-[#2A2E38]">
          <div className="text-[10px] text-[#A8A295] uppercase tracking-wide mb-1">BAT Input</div>
          <div className="font-mono text-lg font-bold text-blue-400">{fmt(c.bat_score_input)}</div>
          <div className="text-[10px] text-[#4A5068]">weight: {fmt(c.bat_weight, 3)}</div>
        </div>
        <div className="bg-[#181A20] rounded-xl p-3 border border-[#2A2E38]">
          <div className="text-[10px] text-[#A8A295] uppercase tracking-wide mb-1">BOWL Input</div>
          <div className="font-mono text-lg font-bold text-green-400">{fmt(c.bowl_score_input)}</div>
          <div className="text-[10px] text-[#4A5068]">weight: {fmt(c.bowl_weight, 3)}</div>
        </div>
        <div className="bg-[#181A20] rounded-xl p-3 border border-[#2A2E38]">
          <div className="text-[10px] text-[#A8A295] uppercase tracking-wide mb-1">Balance Bonus</div>
          <div className="font-mono text-lg font-bold text-purple-400">+{fmt(c.balance_bonus)}</div>
          <div className="text-[10px] text-[#4A5068]">ratio: {fmt(c.balance_ratio, 3)}</div>
        </div>
        <div className="bg-[#181A20] rounded-xl p-3 border border-[#2A2E38]">
          <div className="text-[10px] text-[#A8A295] uppercase tracking-wide mb-1">Same-Match Bonus</div>
          <div className="font-mono text-lg font-bold text-[#FF4B35]">+{fmt(c.dual_bonus)}</div>
          <div className="text-[10px] text-[#4A5068]">{c.dual_impact_matches} dual-impact matches ({fmt(c.dual_pct, 1)}%)</div>
        </div>
      </div>
    );
  }

  // Overall
  const c = player.overall_components as Record<string, unknown>;
  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <div className="bg-[#181A20] rounded-xl p-3 border border-[#2A2E38] min-w-[180px]">
        <div className="text-[10px] text-[#A8A295] uppercase tracking-wide mb-1">Role Path</div>
        <PathBadge path={player.overall_path} />
      </div>
      <div className="bg-[#181A20] rounded-xl p-3 border border-[#2A2E38]">
        <div className="text-[10px] text-[#A8A295] uppercase tracking-wide mb-1">Confidence Applied</div>
        <div className="font-mono text-lg font-bold text-[#FF4B35]">{fmt((c.confidence_applied as number) * 100)}%</div>
      </div>
      <div className="bg-[#181A20] rounded-xl p-3 border border-[#2A2E38]">
        <div className="text-[10px] text-[#A8A295] uppercase tracking-wide mb-1">Raw Score</div>
        <div className="font-mono text-lg font-bold text-[#F1EBDD]">{fmt(player.overall_score_raw as unknown as number)}</div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RankingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overall");
  const [data, setData] = useState<Record<Tab, { players: RankedPlayer[]; ineligible?: RankedPlayer[]; meta: Record<string, unknown> } | null>>({
    batting: null, bowling: null, allround: null, overall: null,
  });
  const [loading, setLoading] = useState(false);

  const fetchTab = useCallback(async (tab: Tab) => {
    if (data[tab]) return;
    setLoading(true);
    try {
      const endpoint =
        tab === "batting"  ? "/api/rankings/batting?limit=100" :
        tab === "bowling"  ? "/api/rankings/bowling?limit=100" :
        tab === "allround" ? "/api/rankings/allround?limit=50" :
        "/api/rankings/overall?limit=100";
      const res = await fetch(endpoint);
      const json = await res.json();
      setData(prev => ({ ...prev, [tab]: { players: json.players, ineligible: json.ineligible_players || json.unranked_players, meta: json } }));
    } finally {
      setLoading(false);
    }
  }, [data]);

  useEffect(() => {
    fetchTab("overall");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    fetchTab(tab);
  };

  const TABS: { key: Tab; label: string; icon: React.ReactNode; desc: string }[] = [
    { key: "overall",  label: "Overall",    icon: <Star className="w-4 h-4" />,     desc: "All 73 players — cross-role ranking" },
    { key: "batting",  label: "Batting",    icon: <Trophy className="w-4 h-4" />,   desc: "Pure batting score. Zero bowling influence." },
    { key: "bowling",  label: "Bowling",    icon: <Shield className="w-4 h-4" />,   desc: "Pure bowling score. Zero batting influence." },
    { key: "allround", label: "All-Round",  icon: <Zap className="w-4 h-4" />,      desc: "Genuine all-rounders only. Dual-discipline eligibility required." },
  ];

  const currentData = data[activeTab];
  const eligible = currentData?.players || [];
  const ineligible = currentData?.ineligible || [];

  const TABLE_HEADERS: Record<Tab, React.ReactNode> = {
    batting: (
      <>
        <th className="py-3 px-4 hidden md:table-cell text-left text-[11px] uppercase tracking-widest text-[#A8A295]">Runs</th>
        <th className="py-3 px-4 hidden md:table-cell text-left text-[11px] uppercase tracking-widest text-[#A8A295]">Avg</th>
        <th className="py-3 px-4 hidden lg:table-cell text-left text-[11px] uppercase tracking-widest text-[#A8A295]">SR</th>
        <th className="py-3 px-4 hidden lg:table-cell text-left text-[11px] uppercase tracking-widest text-[#A8A295]">HS</th>
      </>
    ),
    bowling: (
      <>
        <th className="py-3 px-4 hidden md:table-cell text-left text-[11px] uppercase tracking-widest text-[#A8A295]">Wkts</th>
        <th className="py-3 px-4 hidden md:table-cell text-left text-[11px] uppercase tracking-widest text-[#A8A295]">Eco</th>
        <th className="py-3 px-4 hidden lg:table-cell text-left text-[11px] uppercase tracking-widest text-[#A8A295]">Overs</th>
        <th className="py-3 px-4 hidden lg:table-cell text-left text-[11px] uppercase tracking-widest text-[#A8A295]">Dot%</th>
      </>
    ),
    allround: (
      <>
        <th className="py-3 px-4 hidden md:table-cell text-left text-[11px] uppercase tracking-widest text-[#A8A295]">Runs</th>
        <th className="py-3 px-4 hidden md:table-cell text-left text-[11px] uppercase tracking-widest text-[#A8A295]">Wkts</th>
        <th className="py-3 px-4 hidden lg:table-cell text-left text-[11px] uppercase tracking-widest text-[#A8A295]">Impact M</th>
      </>
    ),
    overall: (
      <>
        <th className="py-3 px-4 hidden md:table-cell text-left text-[11px] uppercase tracking-widest text-[#A8A295]">Path</th>
        <th className="py-3 px-4 hidden lg:table-cell text-left text-[11px] uppercase tracking-widest text-[#A8A295]">Runs</th>
        <th className="py-3 px-4 hidden lg:table-cell text-left text-[11px] uppercase tracking-widest text-[#A8A295]">Wkts</th>
      </>
    ),
  };

  return (
    <div className="min-h-screen bg-[#111318] text-[#F1EBDD]">
      {/* Header */}
      <div className="border-b border-[#2A2E38] bg-[#0D1017]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF4B35]/10 border border-[#FF4B35]/30 flex items-center justify-center">
                  <Award className="w-5 h-5 text-[#FF4B35]" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#FF4B35] uppercase tracking-widest">EPL Analytics · v2.1-dev</span>
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-[#F1EBDD] font-['Space_Grotesk']">
                Player Rankings
              </h1>
              <p className="mt-2 text-[#A8A295] max-w-xl">
                Four independent ranking systems — Batting, Bowling, All-Round, and Overall.
                Each discipline ranked on its own merits. Confidence is always separate from performance.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-[11px] text-[#A8A295]">
              <Info className="w-4 h-4" />
              <span>Click any row to expand score breakdown</span>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-2 mt-8 overflow-x-auto pb-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-[#FF4B35] text-white shadow-lg shadow-[#FF4B35]/20"
                    : "bg-[#181A20] text-[#A8A295] border border-[#2A2E38] hover:border-[#FF4B35]/40 hover:text-[#F1EBDD]"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab description + methodology note */}
        <div className="flex items-start gap-3 mb-6 p-4 rounded-xl bg-[#181A20] border border-[#2A2E38]">
          <Target className="w-4 h-4 text-[#FF4B35] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-[#F1EBDD] font-medium">
              {TABS.find(t => t.key === activeTab)?.desc}
            </p>
            {activeTab === "allround" && (
              <p className="text-xs text-[#A8A295] mt-1">
                Eligibility: ≥20 runs · ≥18 balls faced · ≥3 wickets · ≥18 legal balls · ≥3 matches
              </p>
            )}
            {activeTab === "overall" && (
              <p className="text-xs text-[#A8A295] mt-1">
                Scores are confidence-damped: a player with great stats but only 1 match won&apos;t outrank proven performers.
              </p>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#FF4B35] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Table */}
        {!loading && eligible.length > 0 && (
          <div className="rounded-2xl border border-[#2A2E38] overflow-hidden mb-8">
            <table className="w-full">
              <thead className="bg-[#0D1017] border-b border-[#2A2E38]">
                <tr>
                  <th className="py-3 px-4 text-center text-[11px] uppercase tracking-widest text-[#A8A295] w-16">Rank</th>
                  <th className="py-3 px-4 text-left text-[11px] uppercase tracking-widest text-[#A8A295]">Player</th>
                  <th className="py-3 px-4 text-left text-[11px] uppercase tracking-widest text-[#A8A295]">Score</th>
                  <th className="py-3 px-4 hidden sm:table-cell text-left text-[11px] uppercase tracking-widest text-[#A8A295]">Confidence</th>
                  {TABLE_HEADERS[activeTab]}
                  <th className="py-3 px-4 hidden sm:table-cell w-8" />
                </tr>
              </thead>
              <tbody>
                {eligible.map((player) => {
                  const rank =
                    activeTab === "batting"  ? player.bat_rank :
                    activeTab === "bowling"  ? player.bowl_rank :
                    activeTab === "allround" ? player.ar_rank :
                    player.overall_rank;
                  return (
                    <PlayerRow key={player.player_id} player={player} tab={activeTab} rank={rank} />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Ineligible section */}
        {!loading && ineligible.length > 0 && (
          <details className="mb-8">
            <summary className="cursor-pointer flex items-center gap-2 text-sm text-[#A8A295] hover:text-[#F1EBDD] transition-colors py-2">
              <AlertCircle className="w-4 h-4 text-[#4A5068]" />
              <span>{ineligible.length} players ineligible for this ranking</span>
            </summary>
            <div className="mt-3 rounded-xl border border-[#2A2E38] overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#0D1017] border-b border-[#2A2E38]">
                  <tr>
                    <th className="py-2 px-4 text-left text-[10px] uppercase tracking-widest text-[#4A5068]">Player</th>
                    <th className="py-2 px-4 text-left text-[10px] uppercase tracking-widest text-[#4A5068]">Reason</th>
                    <th className="py-2 px-4 hidden md:table-cell text-left text-[10px] uppercase tracking-widest text-[#4A5068]">Matches</th>
                  </tr>
                </thead>
                <tbody className="opacity-60">
                  {ineligible.map((p) => {
                    const reason =
                      activeTab === "batting"  ? p.bat_eligibility_reason :
                      activeTab === "bowling"  ? p.bowl_eligibility_reason :
                      activeTab === "allround" ? p.ar_eligibility_reason :
                      "No data";
                    return (
                      <tr key={p.player_id} className="border-b border-[#2A2E38]/40">
                        <td className="py-2 px-4">
                          <Link href={`/players/${p.player_id}`} className="text-sm font-medium text-[#A8A295] hover:text-[#FF4B35]">
                            {p.name}
                          </Link>
                        </td>
                        <td className="py-2 px-4 text-xs text-[#4A5068]">{reason}</td>
                        <td className="py-2 px-4 hidden md:table-cell text-xs font-mono text-[#4A5068]">{p.matches}M</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        )}

        {/* Methodology card */}
        <div className="p-5 rounded-2xl bg-[#0D1017] border border-[#2A2E38]">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[#FF4B35]" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#F1EBDD]">Ranking Methodology</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-[#A8A295]">
            <div>
              <div className="font-bold text-[#F1EBDD] mb-1">BAT Score</div>
              <div>Volume[25] + Velocity-SR[30] + Reliability-Avg[25] + Boundary%[10] + Milestones[10]. Bayesian shrinkage towards league median.</div>
            </div>
            <div>
              <div className="font-bold text-[#F1EBDD] mb-1">BOWL Score</div>
              <div>Wicket Threat[35] + Economy[30] + Dot Balls[20] + Consistency[15]. Bayesian shrinkage. Minimum 1 over bowled.</div>
            </div>
            <div>
              <div className="font-bold text-[#F1EBDD] mb-1">AR Score</div>
              <div>Discipline-weighted BAT+BOWL + Balance Bonus[max 10] + Same-Match Dual Impact[max 8]. Eligibility: ≥20R, ≥3W, ≥3M.</div>
            </div>
            <div>
              <div className="font-bold text-[#F1EBDD] mb-1">OVERALL Score</div>
              <div>Role-normalized (All-Round/Batting/Bowling/Dual paths). Confidence-damped: low-sample players shrink towards league floor.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
