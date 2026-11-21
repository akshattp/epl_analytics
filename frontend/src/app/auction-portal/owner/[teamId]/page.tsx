"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Users, TrendingUp, Trophy, Shield, Zap,
  Star, LogOut, ExternalLink, Bookmark,
  ChevronRight, DollarSign
} from "lucide-react";

interface User {
  id: number;
  username: string;
  role: string;
  team_id: number | null;
  display_name: string;
}

interface Team {
  team_id: number;
  team_name: string;
  purse_total: number;
  purse_remaining: number;
  purse_spent: number;
}

interface SquadMember {
  player_id: string;
  name: string;
  role: string;
  price_paid: number;
}

interface RankedPlayer {
  player_id: string;
  name: string;
  primary_role: string;
  matches: number;
  total_runs?: number;
  wickets?: number;
  bat_score?: number | null;
  bat_rank?: number | null;
  bat_confidence_level?: string;
  bowl_score?: number | null;
  bowl_rank?: number | null;
  ar_score?: number | null;
  ar_rank?: number | null;
  overall_score?: number | null;
  overall_rank?: number | null;
  overall_path?: string;
}

const TEAM_COLOURS: Record<number, { bg: string; accent: string; name: string }> = {
  1: { bg: "from-green-900/30 to-green-950/50", accent: "#10B981", name: "Victory Vipers" },
  2: { bg: "from-blue-900/30 to-blue-950/50", accent: "#3B82F6", name: "Exotica Warriors" },
  3: { bg: "from-purple-900/30 to-purple-950/50", accent: "#8B5CF6", name: "The Ultimates" },
  4: { bg: "from-orange-900/30 to-orange-950/50", accent: "#F97316", name: "Exotica Panthers" },
  5: { bg: "from-yellow-900/30 to-yellow-950/50", accent: "#EAB308", name: "Living Legenda" },
  6: { bg: "from-red-900/30 to-red-950/50", accent: "#EF4444", name: "Lions Pride" },
};

type ScoutTab = "overall" | "batting" | "bowling" | "allround";

function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [team, setTeam] = useState<Team | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("epl_auction_token");
    const role = localStorage.getItem("epl_auction_role");
    const userStr = localStorage.getItem("epl_auction_user");
    const teamStr = localStorage.getItem("epl_auction_team");

    if (!token || role !== "team_owner") {
      router.replace("/auction-portal/login");
      return;
    }
    if (userStr) setUser(JSON.parse(userStr));
    if (teamStr) setTeam(JSON.parse(teamStr));
  }, [router]);

  function logout() {
    localStorage.removeItem("epl_auction_token");
    localStorage.removeItem("epl_auction_role");
    localStorage.removeItem("epl_auction_user");
    localStorage.removeItem("epl_auction_team");
    localStorage.removeItem("epl_auction_team_id");
    router.replace("/auction-portal/login");
  }

  return { user, team, logout };
}

export default function OwnerDashboard() {
  const params = useParams();
  const teamId = params?.teamId as string;
  const { user, team, logout } = useAuth();
  const [squad, setSquad] = useState<SquadMember[]>([]);
  const [scoutTab, setScoutTab] = useState<ScoutTab>("overall");
  const [scoutData, setScoutData] = useState<RankedPlayer[]>([]);
  const [scoutLoading, setScoutLoading] = useState(false);
  const [shortlistIds, setShortlistIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!teamId) return;
    // Load squad
    fetch(`/api/auction/squad/${teamId}`)
      .then(r => r.json())
      .then(d => setSquad(d.squad || []))
      .catch(() => setSquad([]));
    // Load shortlist
    fetch(`/api/auction/shortlists/${teamId}`)
      .then(r => r.json())
      .then(d => {
        const ids = new Set<string>((d.shortlisted || []).map((p: { player_id: string }) => p.player_id));
        setShortlistIds(ids);
      })
      .catch(() => {});
  }, [teamId]);

  const fetchScout = useCallback(async (tab: ScoutTab) => {
    setScoutLoading(true);
    try {
      const endpoint =
        tab === "batting" ? "/api/rankings/batting?limit=50" :
        tab === "bowling" ? "/api/rankings/bowling?limit=50" :
        tab === "allround" ? "/api/rankings/allround?limit=30" :
        "/api/rankings/overall?limit=50";
      const res = await fetch(endpoint);
      const json = await res.json();
      setScoutData(json.players || []);
    } finally {
      setScoutLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScout("overall");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScoutTab(tab: ScoutTab) {
    setScoutTab(tab);
    fetchScout(tab);
  }

  async function toggleShortlist(playerId: string) {
    const token = localStorage.getItem("epl_auction_token");
    const isShortlisted = shortlistIds.has(playerId);
    const method = isShortlisted ? "DELETE" : "POST";
    try {
      await fetch(`/api/auction/shortlists/${teamId}/${playerId}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      setShortlistIds(prev => {
        const next = new Set(prev);
        if (isShortlisted) next.delete(playerId);
        else next.add(playerId);
        return next;
      });
    } catch {
      // silent fail
    }
  }

  const teamColor = TEAM_COLOURS[parseInt(teamId)] || TEAM_COLOURS[1];
  const purseUsedPct = team ? ((team.purse_spent || 0) / (team.purse_total || 1)) * 100 : 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#111318] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF4B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const scoreKey: Record<ScoutTab, string> = {
    overall: "overall_score", batting: "bat_score", bowling: "bowl_score", allround: "ar_score",
  };
  const rankKey: Record<ScoutTab, string> = {
    overall: "overall_rank", batting: "bat_rank", bowling: "bowl_rank", allround: "ar_rank",
  };

  return (
    <div className="min-h-screen bg-[#111318] text-[#F1EBDD]">
      {/* Header */}
      <div className={`bg-gradient-to-r ${teamColor.bg} border-b border-[#2A2E38]`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <div
                className="text-[11px] font-mono uppercase tracking-widest mb-1"
                style={{ color: teamColor.accent }}
              >
                Franchise Owner · Team #{teamId}
              </div>
              <h1 className="text-3xl font-bold font-['Space_Grotesk'] text-[#F1EBDD]">
                {team?.team_name || teamColor.name}
              </h1>
              <p className="text-sm text-[#A8A295] mt-1">{user.display_name}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/auction-portal/live"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ backgroundColor: `${teamColor.accent}20`, color: teamColor.accent, border: `1px solid ${teamColor.accent}30` }}
              >
                <Zap className="w-4 h-4" />
                Live Auction
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#181A20] border border-[#2A2E38] text-sm text-[#A8A295] hover:text-[#F1EBDD] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column: Purse + Squad */}
          <div className="space-y-6">
            {/* Purse card */}
            <div className="bg-[#0D1017] border border-[#2A2E38] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4" style={{ color: teamColor.accent }} />
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#F1EBDD]">Purse</h2>
              </div>
              <div className="font-mono text-3xl font-bold" style={{ color: teamColor.accent }}>
                ₹{((team?.purse_remaining || 0) / 100000).toFixed(1)}L
              </div>
              <div className="text-xs text-[#A8A295] mt-0.5">remaining of ₹{((team?.purse_total || 0) / 100000).toFixed(0)}L</div>
              <div className="mt-3 h-2 rounded-full bg-[#2A2E38] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${purseUsedPct}%`, backgroundColor: teamColor.accent }}
                />
              </div>
              <div className="text-[11px] text-[#4A5068] mt-1.5">{purseUsedPct.toFixed(1)}% spent</div>
            </div>

            {/* Current Squad */}
            <div className="bg-[#0D1017] border border-[#2A2E38] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4" style={{ color: teamColor.accent }} />
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#F1EBDD]">
                  Squad ({squad.length})
                </h2>
              </div>
              {squad.length === 0 ? (
                <p className="text-xs text-[#4A5068] italic">No players acquired yet.</p>
              ) : (
                <div className="space-y-2">
                  {squad.map((p) => (
                    <div key={p.player_id} className="flex items-center justify-between py-2 border-b border-[#2A2E38]/40">
                      <div>
                        <Link href={`/players/${p.player_id}`} className="text-sm font-medium text-[#F1EBDD] hover:text-[#FF4B35] transition-colors">
                          {p.name}
                        </Link>
                        <div className="text-[11px] text-[#A8A295]">{p.role}</div>
                      </div>
                      <div className="text-xs font-mono" style={{ color: teamColor.accent }}>
                        ₹{(p.price_paid / 100000).toFixed(1)}L
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Player Scouting */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#0D1017] border border-[#2A2E38] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4" style={{ color: teamColor.accent }} />
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#F1EBDD]">Player Intelligence</h2>
                <span className="text-[10px] text-[#4A5068] ml-auto">Click ★ to shortlist</span>
              </div>

              {/* Scouting tabs */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {(["overall", "batting", "bowling", "allround"] as ScoutTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => handleScoutTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                      scoutTab === tab
                        ? "text-white shadow-sm"
                        : "bg-[#181A20] border border-[#2A2E38] text-[#A8A295] hover:text-[#F1EBDD]"
                    }`}
                    style={scoutTab === tab ? { backgroundColor: teamColor.accent } : {}}
                  >
                    {tab === "allround" ? "All-Round" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {scoutLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[#FF4B35] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-1 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin scrollbar-track-[#111318] scrollbar-thumb-[#2A2E38]">
                  {scoutData.map((p) => {
                    const score = p[scoreKey[scoutTab] as keyof RankedPlayer] as number | null;
                    const rank = p[rankKey[scoutTab] as keyof RankedPlayer] as number | null;
                    const isShortlisted = shortlistIds.has(p.player_id);
                    return (
                      <div
                        key={p.player_id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#181A20] transition-colors group"
                      >
                        <div className="text-xs font-mono text-[#4A5068] w-6 text-right flex-shrink-0">
                          #{rank ?? "—"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link href={`/players/${p.player_id}`} className="text-sm font-semibold text-[#F1EBDD] hover:text-[#FF4B35] transition-colors truncate">
                              {p.name}
                            </Link>
                            <ExternalLink className="w-3 h-3 text-[#4A5068] opacity-0 group-hover:opacity-100 flex-shrink-0" />
                          </div>
                          <div className="text-[11px] text-[#A8A295]">
                            {p.primary_role} · {p.matches}M
                            {scoutTab === "batting" && p.total_runs != null && ` · ${p.total_runs}R`}
                            {scoutTab === "bowling" && p.wickets != null && ` · ${p.wickets}W`}
                          </div>
                        </div>
                        <div className="font-mono font-bold text-sm text-[#FF4B35] flex-shrink-0">
                          {score != null ? score.toFixed(1) : "—"}
                        </div>
                        <button
                          onClick={() => toggleShortlist(p.player_id)}
                          className="flex-shrink-0 transition-colors"
                          title={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
                        >
                          <Bookmark
                            className="w-4 h-4"
                            style={{ color: isShortlisted ? teamColor.accent : "#4A5068", fill: isShortlisted ? teamColor.accent : "none" }}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/rankings"
                className="flex items-center gap-3 p-4 rounded-xl bg-[#0D1017] border border-[#2A2E38] hover:border-[#FF4B35]/30 transition-colors group"
              >
                <Trophy className="w-5 h-5 text-[#FF4B35]" />
                <div>
                  <div className="text-sm font-semibold text-[#F1EBDD] group-hover:text-[#FF4B35] transition-colors">Full Rankings</div>
                  <div className="text-xs text-[#4A5068]">All 4 leaderboards</div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#4A5068] ml-auto" />
              </Link>
              <Link
                href="/auction-portal/live"
                className="flex items-center gap-3 p-4 rounded-xl border transition-colors group"
                style={{
                  background: `${teamColor.accent}10`,
                  borderColor: `${teamColor.accent}30`,
                }}
              >
                <Zap className="w-5 h-5" style={{ color: teamColor.accent }} />
                <div>
                  <div className="text-sm font-semibold text-[#F1EBDD]">Live Auction</div>
                  <div className="text-xs" style={{ color: `${teamColor.accent}80` }}>Enter bidding terminal</div>
                </div>
                <ChevronRight className="w-4 h-4 ml-auto" style={{ color: `${teamColor.accent}60` }} />
              </Link>
              <Link
                href={`/shortlists`}
                className="flex items-center gap-3 p-4 rounded-xl bg-[#0D1017] border border-[#2A2E38] hover:border-[#FF4B35]/30 transition-colors group"
              >
                <Bookmark className="w-5 h-5 text-[#FF4B35]" />
                <div>
                  <div className="text-sm font-semibold text-[#F1EBDD] group-hover:text-[#FF4B35] transition-colors">Shortlists</div>
                  <div className="text-xs text-[#4A5068]">{shortlistIds.size} players saved</div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#4A5068] ml-auto" />
              </Link>
              <Link
                href="/players"
                className="flex items-center gap-3 p-4 rounded-xl bg-[#0D1017] border border-[#2A2E38] hover:border-[#FF4B35]/30 transition-colors group"
              >
                <Shield className="w-5 h-5 text-[#FF4B35]" />
                <div>
                  <div className="text-sm font-semibold text-[#F1EBDD] group-hover:text-[#FF4B35] transition-colors">All Players</div>
                  <div className="text-xs text-[#4A5068]">Full player dossiers</div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#4A5068] ml-auto" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Make this a dynamic route
export const dynamic = "force-dynamic";
