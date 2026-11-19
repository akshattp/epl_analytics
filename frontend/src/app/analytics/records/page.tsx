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
      <div className="py-20 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#07203F] border-t-transparent rounded-full mb-4"></div>
        <p className="font-serif text-lg text-[#07203F]">Loading Tournament Records &amp; Milestones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/analytics/batting"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#07203F]/70 hover:text-[#A65E46] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Analytics</span>
        </Link>
        <span className="text-xs font-mono text-[#D9AA90] bg-[#07203F] px-2.5 py-1 rounded">
          EPL v1.3 Verified Historical Hall of Fame
        </span>
      </div>

      {/* Hero Header */}
      <div className="bg-[#07203F] text-[#EBDED4] rounded-lg p-6 sm:p-8 border border-[#D9AA90]/20 shadow-md">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#A65E46] text-[#EBDED4] text-xs font-bold tracking-wide uppercase">
            <Trophy className="w-3.5 h-3.5" />
            <span>Tournament Milestones</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#EBDED4]">
            Tournament Records &amp; Milestones
          </h1>
          <p className="text-sm text-[#EBDED4]/80 leading-relaxed">
            Historical milestones across 27 verified CricHeroes matches (2023–2025). 
            Every figure is extracted directly from official regulation scorecards with strict 
            super over isolation and legal-ball auditing.
          </p>
        </div>
      </div>

      {/* Quick Summary Milestone Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-[#07203F]/15 shadow-sm space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#07203F]/60 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[#A65E46]" />
              <span>Highest Score</span>
            </span>
            <div className="font-serif text-2xl font-bold text-[#A65E46]">
              {data.highest_individual_scores[0]?.display_score}
            </div>
            <div className="text-xs font-medium text-[#07203F] truncate">
              {data.highest_individual_scores[0]?.player_name} ({data.highest_individual_scores[0]?.balls}b)
            </div>
            <div className="text-[10px] text-[#07203F]/50">
              Season {data.highest_individual_scores[0]?.season}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-[#07203F]/15 shadow-sm space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#07203F]/60 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#07203F]" />
              <span>Best Bowling</span>
            </span>
            <div className="font-serif text-2xl font-bold text-[#07203F]">
              {data.best_bowling_figures[0]?.display_figures}
            </div>
            <div className="text-xs font-medium text-[#07203F] truncate">
              {data.best_bowling_figures[0]?.player_name}
            </div>
            <div className="text-[10px] text-[#07203F]/50">
              Season {data.best_bowling_figures[0]?.season}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-[#07203F]/15 shadow-sm space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#07203F]/60 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#A65E46]" />
              <span>Top Partnership</span>
            </span>
            <div className="font-serif text-2xl font-bold text-[#A65E46]">
              {data.highest_partnerships[0]?.runs} runs
            </div>
            <div className="text-xs font-medium text-[#07203F] truncate">
              {data.highest_partnerships[0]?.batter1_name} &amp; {data.highest_partnerships[0]?.batter2_name}
            </div>
            <div className="text-[10px] text-[#07203F]/50">
              {data.highest_partnerships[0]?.batting_team} ({data.highest_partnerships[0]?.season})
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-[#07203F]/15 shadow-sm space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#07203F]/60 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#07203F]" />
              <span>Fastest 20+</span>
            </span>
            <div className="font-serif text-2xl font-bold text-[#07203F]">
              {data.fastest_twenties[0]?.balls} balls
            </div>
            <div className="text-xs font-medium text-[#07203F] truncate">
              {data.fastest_twenties[0]?.player_name} ({data.fastest_twenties[0]?.runs} runs)
            </div>
            <div className="text-[10px] text-[#07203F]/50">
              SR: {data.fastest_twenties[0]?.strike_rate?.toFixed(1)}
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="border-b border-[#07203F]/20 flex flex-wrap gap-4 text-xs font-semibold">
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
                  ? "border-[#A65E46] text-[#A65E46]"
                  : "border-transparent text-[#07203F]/60 hover:text-[#07203F]"
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
        <div className="bg-white/80 backdrop-blur rounded-lg border border-[#07203F]/15 shadow-sm overflow-hidden">
          {activeCategory === "batting" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#07203F] text-[#EBDED4] font-serif text-[11px] uppercase tracking-wider">
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
                <tbody className="divide-y divide-[#07203F]/10 font-sans">
                  {data.highest_individual_scores.map((r: any) => (
                    <tr key={r.rank} className="hover:bg-[#EBDED4]/30 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#A65E46]">{r.rank}</td>
                      <td className="py-3 px-4 font-semibold text-[#07203F]">
                        <Link href={`/players/${r.player_id}`} className="hover:underline hover:text-[#A65E46]">
                          {r.player_name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-base text-[#02000D]">{r.display_score}</td>
                      <td className="py-3 px-4 font-mono text-[#07203F]/70">{r.balls}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#A65E46]">{r.strike_rate?.toFixed(1)}</td>
                      <td className="py-3 px-4 font-mono text-[#07203F]/70">{r.fours} / {r.sixes}</td>
                      <td className="py-3 px-4">{r.season}</td>
                      <td className="py-3 px-4 text-[#07203F]/70">{r.stage}</td>
                      <td className="py-3 px-4 text-[#07203F]/70">{r.team}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeCategory === "bowling" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#07203F] text-[#EBDED4] font-serif text-[11px] uppercase tracking-wider">
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
                <tbody className="divide-y divide-[#07203F]/10 font-sans">
                  {data.best_bowling_figures.map((r: any) => (
                    <tr key={r.rank} className="hover:bg-[#EBDED4]/30 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#A65E46]">{r.rank}</td>
                      <td className="py-3 px-4 font-semibold text-[#07203F]">
                        <Link href={`/players/${r.player_id}`} className="hover:underline hover:text-[#A65E46]">
                          {r.player_name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-base text-[#07203F]">{r.display_figures}</td>
                      <td className="py-3 px-4 font-mono text-[#07203F]/70">{r.overs} ov</td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#A65E46]">{r.economy?.toFixed(2)}</td>
                      <td className="py-3 px-4 font-mono text-[#07203F]/70">{r.dot_balls} dots</td>
                      <td className="py-3 px-4">{r.season}</td>
                      <td className="py-3 px-4 text-[#07203F]/70">{r.stage}</td>
                      <td className="py-3 px-4 text-[#07203F]/70">{r.team}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeCategory === "partnerships" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#07203F] text-[#EBDED4] font-serif text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Partnership</th>
                    <th className="py-3 px-4">Runs</th>
                    <th className="py-3 px-4">Wicket</th>
                    <th className="py-3 px-4">Batting Team</th>
                    <th className="py-3 px-4">Season</th>
                    <th className="py-3 px-4">Overs Span</th>
                    <th className="py-3 px-4">Unbroken?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#07203F]/10 font-sans">
                  {data.highest_partnerships.map((r: any) => (
                    <tr key={r.rank} className="hover:bg-[#EBDED4]/30 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#A65E46]">{r.rank}</td>
                      <td className="py-3 px-4 font-semibold text-[#07203F]">
                        {r.batter1_name} &amp; {r.batter2_name}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-base text-[#A65E46]">{r.runs} runs</td>
                      <td className="py-3 px-4 font-mono text-[#07203F]/70">Wkt {r.wicket_number}</td>
                      <td className="py-3 px-4 text-[#07203F]/80">{r.batting_team}</td>
                      <td className="py-3 px-4">{r.season}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#07203F]/60">
                        {r.start_over} → {r.end_over}
                      </td>
                      <td className="py-3 px-4">
                        {r.is_unbroken ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                            Unbroken
                          </span>
                        ) : (
                          <span className="text-[#07203F]/50 text-[10px]">Broken</span>
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
              <table className="w-full text-left text-xs">
                <thead className="bg-[#07203F] text-[#EBDED4] font-serif text-[11px] uppercase tracking-wider">
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
                <tbody className="divide-y divide-[#07203F]/10 font-sans">
                  {data.fastest_twenties.map((r: any) => (
                    <tr key={r.rank} className="hover:bg-[#EBDED4]/30 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#A65E46]">{r.rank}</td>
                      <td className="py-3 px-4 font-semibold text-[#07203F]">
                        <Link href={`/players/${r.player_id}`} className="hover:underline hover:text-[#A65E46]">
                          {r.player_name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-base text-[#A65E46]">{r.balls} balls</td>
                      <td className="py-3 px-4 font-mono text-[#07203F] font-semibold">{r.runs} runs</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#07203F]">{r.strike_rate?.toFixed(1)}</td>
                      <td className="py-3 px-4 font-mono text-[#07203F]/70">{r.fours} / {r.sixes}</td>
                      <td className="py-3 px-4">{r.season}</td>
                      <td className="py-3 px-4 text-[#07203F]/70">{r.team}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeCategory === "economy" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#07203F] text-[#EBDED4] font-serif text-[11px] uppercase tracking-wider">
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
                <tbody className="divide-y divide-[#07203F]/10 font-sans">
                  {data.most_economical_spells.map((r: any) => (
                    <tr key={r.rank} className="hover:bg-[#EBDED4]/30 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#A65E46]">{r.rank}</td>
                      <td className="py-3 px-4 font-semibold text-[#07203F]">
                        <Link href={`/players/${r.player_id}`} className="hover:underline hover:text-[#A65E46]">
                          {r.player_name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-base text-[#07203F]">{r.economy?.toFixed(2)} RPO</td>
                      <td className="py-3 px-4 font-mono text-[#07203F]/70">{r.overs} ov</td>
                      <td className="py-3 px-4 font-mono text-[#07203F]/80">{r.runs_conceded} runs</td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#A65E46]">{r.wickets} wkts</td>
                      <td className="py-3 px-4 font-mono text-[#07203F]/70">{r.dot_balls} dots</td>
                      <td className="py-3 px-4">{r.season}</td>
                      <td className="py-3 px-4 text-[#07203F]/70">{r.team}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeCategory === "teams" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#07203F] text-[#EBDED4] font-serif text-[11px] uppercase tracking-wider">
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
                <tbody className="divide-y divide-[#07203F]/10 font-sans">
                  {data.highest_team_totals.map((r: any) => (
                    <tr key={r.rank} className="hover:bg-[#EBDED4]/30 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#A65E46]">{r.rank}</td>
                      <td className="py-3 px-4 font-semibold text-[#07203F]">{r.batting_team}</td>
                      <td className="py-3 px-4 font-mono font-bold text-base text-[#A65E46]">{r.total_runs}</td>
                      <td className="py-3 px-4 font-mono text-[#07203F]/70">{r.wickets} wkts</td>
                      <td className="py-3 px-4 font-mono text-[#07203F]/70">{r.overs} ov</td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#07203F]">{r.crr?.toFixed(2)}</td>
                      <td className="py-3 px-4 text-[#07203F]/70">{r.bowling_team}</td>
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
