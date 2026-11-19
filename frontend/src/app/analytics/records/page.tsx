"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy, Medal, Flame, Shield, ArrowLeft,
  Zap, Award, TrendingUp, Users, Clock
} from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function TournamentRecordsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<
    "batting" | "bowling" | "partnerships" | "fastest" | "economy" | "teams"
  >("batting");

  useEffect(() => {
    async function loadRecords() {
      try {
        const res = await fetchApi("/api/analytics/records");
        setData(res);
      } catch (err) {
        console.error("Failed to load records:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRecords();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full"></div>
        <p className="font-display text-lg text-[#101828] dark:text-[#F8FAFC]">Loading Tournament Records &amp; Milestones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/analytics/batting"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Analytics</span>
        </Link>
        <span className="text-xs font-mono text-[#2563EB] dark:text-[#3B82F6] bg-blue-50 dark:bg-[#151F32] border border-blue-200 dark:border-[#334155] px-3 py-1 rounded-full font-semibold">
          EPL v1.3 Verified Historical Hall of Fame
        </span>
      </div>

      {/* Hero Header */}
      <div className="bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] rounded-xl p-6 sm:p-8 border border-[#E2E8F0] dark:border-[#334155] shadow-sm">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2563EB] text-white text-xs font-bold tracking-wide uppercase">
            <Trophy className="w-3.5 h-3.5" />
            <span>Tournament Milestones</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#101828] dark:text-[#F8FAFC]">
            Tournament Records &amp; Milestones
          </h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
            Historical milestones across 27 verified CricHeroes matches (2023–2025). 
            Every figure is extracted directly from official regulation scorecards with strict 
            super over isolation and legal-ball auditing.
          </p>
        </div>
      </div>

      {/* Quick Summary Milestone Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#151F32] rounded-xl p-4 border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-1 text-[#101828] dark:text-[#F8FAFC]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
              <span>Highest Score</span>
            </span>
            <div className="font-display text-2xl font-bold text-[#2563EB] dark:text-[#3B82F6]">
              {data.highest_individual_scores[0]?.display_score}
            </div>
            <div className="text-xs font-medium text-[#101828] dark:text-[#F8FAFC] truncate">
              {data.highest_individual_scores[0]?.player_name} ({data.highest_individual_scores[0]?.balls}b)
            </div>
            <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
              Season {data.highest_individual_scores[0]?.season}
            </div>
          </div>

          <div className="bg-white dark:bg-[#151F32] rounded-xl p-4 border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-1 text-[#101828] dark:text-[#F8FAFC]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#0891B2] dark:text-[#22D3EE]" />
              <span>Best Bowling</span>
            </span>
            <div className="font-display text-2xl font-bold text-[#0891B2] dark:text-[#22D3EE]">
              {data.best_bowling_figures[0]?.display_figures}
            </div>
            <div className="text-xs font-medium text-[#101828] dark:text-[#F8FAFC] truncate">
              {data.best_bowling_figures[0]?.player_name}
            </div>
            <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
              Season {data.best_bowling_figures[0]?.season}
            </div>
          </div>

          <div className="bg-white dark:bg-[#151F32] rounded-xl p-4 border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-1 text-[#101828] dark:text-[#F8FAFC]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
              <span>Top Partnership</span>
            </span>
            <div className="font-display text-2xl font-bold text-[#2563EB] dark:text-[#3B82F6]">
              {data.highest_partnerships[0]?.runs} runs
            </div>
            <div className="text-xs font-medium text-[#101828] dark:text-[#F8FAFC] truncate">
              {data.highest_partnerships[0]?.batter1_name} &amp; {data.highest_partnerships[0]?.batter2_name}
            </div>
            <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
              {data.highest_partnerships[0]?.batting_team} ({data.highest_partnerships[0]?.season})
            </div>
          </div>

          <div className="bg-white dark:bg-[#151F32] rounded-xl p-4 border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-1 text-[#101828] dark:text-[#F8FAFC]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#0891B2] dark:text-[#22D3EE]" />
              <span>Fastest 20+</span>
            </span>
            <div className="font-display text-2xl font-bold text-[#101828] dark:text-[#F8FAFC]">
              {data.fastest_twenties[0]?.balls} balls
            </div>
            <div className="text-xs font-medium text-[#101828] dark:text-[#F8FAFC] truncate">
              {data.fastest_twenties[0]?.player_name} ({data.fastest_twenties[0]?.runs} runs)
            </div>
            <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
              SR: {data.fastest_twenties[0]?.strike_rate?.toFixed(1)}
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="border-b border-[#E2E8F0] dark:border-[#334155] flex flex-wrap gap-4 text-xs font-semibold">
        {[
          { id: "batting", label: "Highest Scores", icon: Flame },
          { id: "bowling", label: "Best Bowling Figures", icon: Shield },
          { id: "partnerships", label: "Top Partnerships", icon: Users },
          { id: "fastest", label: "Fastest 20+ Innings", icon: Zap },
          { id: "economy", label: "Most Economical Spells", icon: Clock },
          { id: "teams", label: "Highest Team Totals", icon: Trophy },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`pb-3 inline-flex items-center gap-1.5 transition border-b-2 ${
                activeCategory === tab.id
                  ? "border-[#2563EB] dark:border-[#3B82F6] text-[#2563EB] dark:text-[#3B82F6] font-bold"
                  : "border-transparent text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {data && (
        <div className="table-wrapper bg-white dark:bg-[#151F32] rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm overflow-hidden text-[#101828] dark:text-[#F8FAFC]">
          {activeCategory === "batting" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs table-editorial">
                <thead>
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-4">Runs</th>
                    <th className="py-3 px-4">Balls</th>
                    <th className="py-3 px-4">Strike Rate</th>
                    <th className="py-3 px-4">4s / 6s</th>
                    <th className="py-3 px-4">Season</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4">Team</th>
                  </tr>
                </thead>
                <tbody>
                  {data.highest_individual_scores.map((r: any) => (
                    <tr key={r.rank} className="hover:bg-blue-50/60 dark:hover:bg-[#1E293B]/60 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#2563EB] dark:text-[#3B82F6]">{r.rank}</td>
                      <td className="py-3 px-4 font-semibold text-[#101828] dark:text-[#F8FAFC]">
                        <Link href={`/players/${r.player_id}`} className="hover:underline hover:text-[#2563EB] dark:hover:text-[#3B82F6]">
                          {r.player_name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-base text-[#2563EB] dark:text-[#3B82F6]">{r.display_score}</td>
                      <td className="py-3 px-4 font-mono text-[#64748B] dark:text-[#94A3B8]">{r.balls}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#0891B2] dark:text-[#22D3EE]">{r.strike_rate?.toFixed(1)}</td>
                      <td className="py-3 px-4 font-mono text-[#64748B] dark:text-[#94A3B8]">{r.fours} / {r.sixes}</td>
                      <td className="py-3 px-4">{r.season}</td>
                      <td className="py-3 px-4 text-[#64748B] dark:text-[#94A3B8]">{r.stage}</td>
                      <td className="py-3 px-4 text-[#64748B] dark:text-[#94A3B8]">{r.team}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeCategory === "bowling" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs table-editorial">
                <thead>
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Bowler</th>
                    <th className="py-3 px-4">Figures</th>
                    <th className="py-3 px-4">Overs</th>
                    <th className="py-3 px-4">Economy</th>
                    <th className="py-3 px-4">Dot Balls</th>
                    <th className="py-3 px-4">Season</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4">Team</th>
                  </tr>
                </thead>
                <tbody>
                  {data.best_bowling_figures.map((r: any) => (
                    <tr key={r.rank} className="hover:bg-blue-50/60 dark:hover:bg-[#1E293B]/60 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#2563EB] dark:text-[#3B82F6]">{r.rank}</td>
                      <td className="py-3 px-4 font-semibold text-[#101828] dark:text-[#F8FAFC]">
                        <Link href={`/players/${r.player_id}`} className="hover:underline hover:text-[#2563EB] dark:hover:text-[#3B82F6]">
                          {r.player_name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-base text-[#0891B2] dark:text-[#22D3EE]">{r.display_figures}</td>
                      <td className="py-3 px-4 font-mono text-[#64748B] dark:text-[#94A3B8]">{r.overs} ov</td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#2563EB] dark:text-[#3B82F6]">{r.economy?.toFixed(2)}</td>
                      <td className="py-3 px-4 font-mono text-[#64748B] dark:text-[#94A3B8]">{r.dot_balls} dots</td>
                      <td className="py-3 px-4">{r.season}</td>
                      <td className="py-3 px-4 text-[#64748B] dark:text-[#94A3B8]">{r.stage}</td>
                      <td className="py-3 px-4 text-[#64748B] dark:text-[#94A3B8]">{r.team}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeCategory === "partnerships" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs table-editorial">
                <thead>
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Partnership</th>
                    <th className="py-3 px-4">Runs</th>
                    <th className="py-3 px-4">Wicket</th>
                    <th className="py-3 px-4">Batting Team</th>
                    <th className="py-3 px-4">Season</th>
                    <th className="py-3 px-4">Overs Span</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.highest_partnerships.map((r: any) => (
                    <tr key={r.rank} className="hover:bg-blue-50/60 dark:hover:bg-[#1E293B]/60 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#2563EB] dark:text-[#3B82F6]">{r.rank}</td>
                      <td className="py-3 px-4 font-semibold text-[#101828] dark:text-[#F8FAFC]">
                        {r.batter1_name} &amp; {r.batter2_name}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-base text-[#2563EB] dark:text-[#3B82F6]">{r.runs} runs</td>
                      <td className="py-3 px-4 font-mono text-[#64748B] dark:text-[#94A3B8]">Wkt {r.wicket_number}</td>
                      <td className="py-3 px-4 text-[#101828] dark:text-[#F8FAFC]">{r.batting_team}</td>
                      <td className="py-3 px-4">{r.season}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        {r.start_over} → {r.end_over}
                      </td>
                      <td className="py-3 px-4">
                        {r.is_unbroken ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-[#0B1120] border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                            Unbroken
                          </span>
                        ) : (
                          <span className="text-[#64748B] dark:text-[#94A3B8] text-[10px]">Broken</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeCategory === "fastest" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs table-editorial">
                <thead>
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Batter</th>
                    <th className="py-3 px-4">Balls Faced</th>
                    <th className="py-3 px-4">Runs Scored</th>
                    <th className="py-3 px-4">Strike Rate</th>
                    <th className="py-3 px-4">4s / 6s</th>
                    <th className="py-3 px-4">Season</th>
                    <th className="py-3 px-4">Team</th>
                  </tr>
                </thead>
                <tbody>
                  {data.fastest_twenties.map((r: any) => (
                    <tr key={r.rank} className="hover:bg-blue-50/60 dark:hover:bg-[#1E293B]/60 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#2563EB] dark:text-[#3B82F6]">{r.rank}</td>
                      <td className="py-3 px-4 font-semibold text-[#101828] dark:text-[#F8FAFC]">
                        <Link href={`/players/${r.player_id}`} className="hover:underline hover:text-[#2563EB] dark:hover:text-[#3B82F6]">
                          {r.player_name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-base text-[#2563EB] dark:text-[#3B82F6]">{r.balls} balls</td>
                      <td className="py-3 px-4 font-mono text-[#0891B2] dark:text-[#22D3EE] font-semibold">{r.runs} runs</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{r.strike_rate?.toFixed(1)}</td>
                      <td className="py-3 px-4 font-mono text-[#64748B] dark:text-[#94A3B8]">{r.fours} / {r.sixes}</td>
                      <td className="py-3 px-4">{r.season}</td>
                      <td className="py-3 px-4 text-[#64748B] dark:text-[#94A3B8]">{r.team}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeCategory === "economy" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs table-editorial">
                <thead>
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Bowler</th>
                    <th className="py-3 px-4">Economy</th>
                    <th className="py-3 px-4">Overs</th>
                    <th className="py-3 px-4">Runs Conceded</th>
                    <th className="py-3 px-4">Wickets</th>
                    <th className="py-3 px-4">Dot Balls</th>
                    <th className="py-3 px-4">Season</th>
                    <th className="py-3 px-4">Team</th>
                  </tr>
                </thead>
                <tbody>
                  {data.most_economical_spells.map((r: any) => (
                    <tr key={r.rank} className="hover:bg-blue-50/60 dark:hover:bg-[#1E293B]/60 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#2563EB] dark:text-[#3B82F6]">{r.rank}</td>
                      <td className="py-3 px-4 font-semibold text-[#101828] dark:text-[#F8FAFC]">
                        <Link href={`/players/${r.player_id}`} className="hover:underline hover:text-[#2563EB] dark:hover:text-[#3B82F6]">
                          {r.player_name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-base text-[#0891B2] dark:text-[#22D3EE]">{r.economy?.toFixed(2)} RPO</td>
                      <td className="py-3 px-4 font-mono text-[#64748B] dark:text-[#94A3B8]">{r.overs} ov</td>
                      <td className="py-3 px-4 font-mono text-[#64748B] dark:text-[#94A3B8]">{r.runs_conceded} runs</td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#2563EB] dark:text-[#3B82F6]">{r.wickets} wkts</td>
                      <td className="py-3 px-4 font-mono text-[#64748B] dark:text-[#94A3B8]">{r.dot_balls} dots</td>
                      <td className="py-3 px-4">{r.season}</td>
                      <td className="py-3 px-4 text-[#64748B] dark:text-[#94A3B8]">{r.team}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeCategory === "teams" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs table-editorial">
                <thead>
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Batting Team</th>
                    <th className="py-3 px-4">Total Runs</th>
                    <th className="py-3 px-4">Wickets</th>
                    <th className="py-3 px-4">Overs</th>
                    <th className="py-3 px-4">Run Rate (CRR)</th>
                    <th className="py-3 px-4">Bowling Team</th>
                    <th className="py-3 px-4">Season</th>
                  </tr>
                </thead>
                <tbody>
                  {data.highest_team_totals.map((r: any) => (
                    <tr key={r.rank} className="hover:bg-blue-50/60 dark:hover:bg-[#1E293B]/60 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#2563EB] dark:text-[#3B82F6]">{r.rank}</td>
                      <td className="py-3 px-4 font-semibold text-[#101828] dark:text-[#F8FAFC]">{r.batting_team}</td>
                      <td className="py-3 px-4 font-mono font-bold text-base text-[#2563EB] dark:text-[#3B82F6]">{r.total_runs}</td>
                      <td className="py-3 px-4 font-mono text-[#64748B] dark:text-[#94A3B8]">{r.wickets} wkts</td>
                      <td className="py-3 px-4 font-mono text-[#64748B] dark:text-[#94A3B8]">{r.overs} ov</td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#0891B2] dark:text-[#22D3EE]">{r.crr?.toFixed(2)}</td>
                      <td className="py-3 px-4 text-[#64748B] dark:text-[#94A3B8]">{r.bowling_team}</td>
                      <td className="py-3 px-4">{r.season}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
