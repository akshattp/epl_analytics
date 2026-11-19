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
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#A65E46] border-t-transparent rounded-full"></div>
        <p className="font-serif text-lg text-[#EBDED4]">Loading Tournament Records &amp; Milestones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/analytics/batting"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#D9AA90] hover:text-[#EBDED4] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Analytics</span>
        </Link>
        <span className="text-xs font-mono text-[#D9AA90] bg-[#07203F] border border-[#D9AA90]/30 px-3 py-1 rounded-full">
          EPL v1.3 Verified Historical Hall of Fame
        </span>
      </div>

      {/* Hero Header */}
      <div className="bg-[#07203F] text-[#EBDED4] rounded-xl p-6 sm:p-8 border border-[#D9AA90]/25 shadow-lg">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#A65E46] text-[#EBDED4] text-xs font-bold tracking-wide uppercase">
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
          <div className="bg-[#07203F] rounded-xl p-4 border border-[#D9AA90]/25 shadow-md space-y-1 text-[#EBDED4]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D9AA90] flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[#A65E46]" />
              <span>Highest Score</span>
            </span>
            <div className="font-serif text-2xl font-bold text-[#A65E46]">
              {data.highest_individual_scores[0]?.display_score}
            </div>
            <div className="text-xs font-medium text-[#EBDED4] truncate">
              {data.highest_individual_scores[0]?.player_name} ({data.highest_individual_scores[0]?.balls}b)
            </div>
            <div className="text-[10px] text-[#D9AA90]/70">
              Season {data.highest_individual_scores[0]?.season}
            </div>
          </div>

          <div className="bg-[#07203F] rounded-xl p-4 border border-[#D9AA90]/25 shadow-md space-y-1 text-[#EBDED4]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D9AA90] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#D9AA90]" />
              <span>Best Bowling</span>
            </span>
            <div className="font-serif text-2xl font-bold text-[#D9AA90]">
              {data.best_bowling_figures[0]?.display_figures}
            </div>
            <div className="text-xs font-medium text-[#EBDED4] truncate">
              {data.best_bowling_figures[0]?.player_name}
            </div>
            <div className="text-[10px] text-[#D9AA90]/70">
              Season {data.best_bowling_figures[0]?.season}
            </div>
          </div>

          <div className="bg-[#07203F] rounded-xl p-4 border border-[#D9AA90]/25 shadow-md space-y-1 text-[#EBDED4]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D9AA90] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#A65E46]" />
              <span>Top Partnership</span>
            </span>
            <div className="font-serif text-2xl font-bold text-[#A65E46]">
              {data.highest_partnerships[0]?.runs} runs
            </div>
            <div className="text-xs font-medium text-[#EBDED4] truncate">
              {data.highest_partnerships[0]?.batter1_name} &amp; {data.highest_partnerships[0]?.batter2_name}
            </div>
            <div className="text-[10px] text-[#D9AA90]/70">
              {data.highest_partnerships[0]?.batting_team} ({data.highest_partnerships[0]?.season})
            </div>
          </div>

          <div className="bg-[#07203F] rounded-xl p-4 border border-[#D9AA90]/25 shadow-md space-y-1 text-[#EBDED4]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D9AA90] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#D9AA90]" />
              <span>Fastest 20+</span>
            </span>
            <div className="font-serif text-2xl font-bold text-[#EBDED4]">
              {data.fastest_twenties[0]?.balls} balls
            </div>
            <div className="text-xs font-medium text-[#EBDED4] truncate">
              {data.fastest_twenties[0]?.player_name} ({data.fastest_twenties[0]?.runs} runs)
            </div>
            <div className="text-[10px] text-[#D9AA90]/70">
              SR: {data.fastest_twenties[0]?.strike_rate?.toFixed(1)}
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="border-b border-[#D9AA90]/20 flex flex-wrap gap-4 text-xs font-semibold">
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
                  ? "border-[#A65E46] text-[#EBDED4] font-bold"
                  : "border-transparent text-[#D9AA90]/70 hover:text-[#EBDED4]"
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
        <div className="bg-[#07203F] rounded-xl border border-[#D9AA90]/25 shadow-lg overflow-hidden text-[#EBDED4]">
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
                    <tr key={r.rank} className="hover:bg-[#A65E46]/20 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#A65E46]">{r.rank}</td>
                      <td className="py-3 px-4 font-semibold text-[#EBDED4]">
                        <Link href={`/players/${r.player_id}`} className="hover:underline hover:text-[#D9AA90]">
                          {r.player_name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-base text-[#D9AA90]">{r.display_score}</td>
                      <td className="py-3 px-4 font-mono text-[#EBDED4]/80">{r.balls}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#A65E46]">{r.strike_rate?.toFixed(1)}</td>
                      <td className="py-3 px-4 font-mono text-[#EBDED4]/80">{r.fours} / {r.sixes}</td>
                      <td className="py-3 px-4">{r.season}</td>
                      <td className="py-3 px-4 text-[#D9AA90]/70">{r.stage}</td>
                      <td className="py-3 px-4 text-[#D9AA90]/70">{r.team}</td>
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
                    <tr key={r.rank} className="hover:bg-[#A65E46]/20 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#A65E46]">{r.rank}</td>
                      <td className="py-3 px-4 font-semibold text-[#EBDED4]">
                        <Link href={`/players/${r.player_id}`} className="hover:underline hover:text-[#D9AA90]">
                          {r.player_name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-base text-[#D9AA90]">{r.display_figures}</td>
                      <td className="py-3 px-4 font-mono text-[#EBDED4]/80">{r.overs} ov</td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#A65E46]">{r.economy?.toFixed(2)}</td>
                      <td className="py-3 px-4 font-mono text-[#EBDED4]/80">{r.dot_balls} dots</td>
                      <td className="py-3 px-4">{r.season}</td>
                      <td className="py-3 px-4 text-[#D9AA90]/70">{r.stage}</td>
                      <td className="py-3 px-4 text-[#D9AA90]/70">{r.team}</td>
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
                    <tr key={r.rank} className="hover:bg-[#A65E46]/20 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#A65E46]">{r.rank}</td>
                      <td className="py-3 px-4 font-semibold text-[#EBDED4]">
                        {r.batter1_name} &amp; {r.batter2_name}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-base text-[#A65E46]">{r.runs} runs</td>
                      <td className="py-3 px-4 font-mono text-[#D9AA90]/80">Wkt {r.wicket_number}</td>
                      <td className="py-3 px-4 text-[#EBDED4]/90">{r.batting_team}</td>
                      <td className="py-3 px-4">{r.season}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#D9AA90]/80">
                        {r.start_over} → {r.end_over}
                      </td>
                      <td className="py-3 px-4">
                        {r.is_unbroken ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#02000D] border border-[#D9AA90]/40 text-[#D9AA90] text-[10px] font-semibold">
                            Unbroken
                          </span>
                        ) : (
                          <span className="text-[#EBDED4]/40 text-[10px]">Broken</span>
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
                    <tr key={r.rank} className="hover:bg-[#A65E46]/20 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#A65E46]">{r.rank}</td>
                      <td className="py-3 px-4 font-semibold text-[#EBDED4]">
                        <Link href={`/players/${r.player_id}`} className="hover:underline hover:text-[#D9AA90]">
                          {r.player_name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-base text-[#A65E46]">{r.balls} balls</td>
                      <td className="py-3 px-4 font-mono text-[#D9AA90] font-semibold">{r.runs} runs</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#EBDED4]">{r.strike_rate?.toFixed(1)}</td>
                      <td className="py-3 px-4 font-mono text-[#EBDED4]/80">{r.fours} / {r.sixes}</td>
                      <td className="py-3 px-4">{r.season}</td>
                      <td className="py-3 px-4 text-[#D9AA90]/70">{r.team}</td>
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
                    <tr key={r.rank} className="hover:bg-[#A65E46]/20 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#A65E46]">{r.rank}</td>
                      <td className="py-3 px-4 font-semibold text-[#EBDED4]">
                        <Link href={`/players/${r.player_id}`} className="hover:underline hover:text-[#D9AA90]">
                          {r.player_name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-base text-[#D9AA90]">{r.economy?.toFixed(2)} RPO</td>
                      <td className="py-3 px-4 font-mono text-[#EBDED4]/80">{r.overs} ov</td>
                      <td className="py-3 px-4 font-mono text-[#EBDED4]/80">{r.runs_conceded} runs</td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#A65E46]">{r.wickets} wkts</td>
                      <td className="py-3 px-4 font-mono text-[#EBDED4]/80">{r.dot_balls} dots</td>
                      <td className="py-3 px-4">{r.season}</td>
                      <td className="py-3 px-4 text-[#D9AA90]/70">{r.team}</td>
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
                    <tr key={r.rank} className="hover:bg-[#A65E46]/20 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#A65E46]">{r.rank}</td>
                      <td className="py-3 px-4 font-semibold text-[#EBDED4]">{r.batting_team}</td>
                      <td className="py-3 px-4 font-mono font-bold text-base text-[#A65E46]">{r.total_runs}</td>
                      <td className="py-3 px-4 font-mono text-[#EBDED4]/80">{r.wickets} wkts</td>
                      <td className="py-3 px-4 font-mono text-[#EBDED4]/80">{r.overs} ov</td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#D9AA90]">{r.crr?.toFixed(2)}</td>
                      <td className="py-3 px-4 text-[#D9AA90]/70">{r.bowling_team}</td>
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
