"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  GitCompare, Users, Plus, X, ArrowRight, 
  Flame, Shield, TrendingUp, Check 
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { RatingBadge } from "@/components/RatingBadge";
import { PlayerRatingRadarChart, SimpleComparisonBarChart, EPL_PALETTE } from "@/components/EplCharts";

export default function ComparisonPage() {
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(["EPL-P-001", "EPL-P-002"]);
  const [comparedData, setComparedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetchApi("/api/players?sort_by=rating");
        const list = res.players || [];
        setAllPlayers(list);
        if (list.length >= 2) {
          setSelectedIds([list[0].player_id, list[1].player_id]);
        }
      } catch (err) {
        console.error("Error loading players:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    async function loadCompared() {
      if (selectedIds.length === 0) {
        setComparedData([]);
        return;
      }
      try {
        const res = await fetchApi(`/api/analytics/comparison?ids=${selectedIds.join(",")}`);
        setComparedData(res.players || []);
      } catch (err) {
        console.error("Error comparing players:", err);
      }
    }
    loadCompared();
  }, [selectedIds]);

  const addPlayer = (id: string) => {
    if (!selectedIds.includes(id) && selectedIds.length < 4) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const removePlayer = (id: string) => {
    setSelectedIds(selectedIds.filter((p) => p !== id));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-[#07203F]/20 pb-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-semibold tracking-wider text-[#A65E46] mb-1">
              Multi-Player Head-to-Head Evaluation
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#02000D]">
              Player Comparison
            </h1>
            <p className="text-sm text-[#07203F]/80 mt-1 max-w-xl">
              Side-by-side performance audit across all batting, bowling, ratings, and auction valuation metrics.
            </p>
          </div>
          <div className="text-xs text-[#07203F]/70">
            Compare up to 4 players simultaneously
          </div>
        </div>
      </div>

      {/* Player Selector Bar */}
      <div className="bg-white/80 backdrop-blur rounded-lg p-4 border border-[#07203F]/15 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-[#07203F] mr-2">Selected:</span>
          {comparedData.map((p) => (
            <div 
              key={p.player_id}
              className="inline-flex items-center space-x-2 bg-[#07203F] text-[#EBDED4] px-3 py-1 rounded text-xs"
            >
              <span className="font-semibold">{p.name}</span>
              <button 
                onClick={() => removePlayer(p.player_id)}
                className="hover:text-[#A65E46] transition ml-1"
                aria-label={`Remove ${p.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {selectedIds.length < 4 && (
            <div className="relative">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addPlayer(e.target.value);
                    e.target.value = "";
                  }
                }}
                defaultValue=""
                aria-label="Add player to comparison"
                className="px-3 py-1 text-xs rounded border border-[#07203F]/30 bg-[#EBDED4]/40 text-[#07203F] focus:outline-none focus:border-[#A65E46]"
              >
                <option value="" disabled>+ Add Player to Compare...</option>
                {allPlayers
                  .filter((p) => !selectedIds.includes(p.player_id))
                  .map((p) => (
                    <option key={p.player_id} value={p.player_id}>
                      {p.name} ({p.primary_role} - Rating: {p.ratings.overall_rating})
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Visual Comparison Charts (Normalized Radar + Season Progression) */}
      {comparedData.length >= 2 && (() => {
        const seriesColors = [EPL_PALETTE.navy, EPL_PALETTE.terracotta, EPL_PALETTE.peach, EPL_PALETTE.midnight];
        const axes = [
          { axis: "Batting", get: (p: any) => p.ratings?.batting_rating || 0 },
          { axis: "Bowling", get: (p: any) => p.ratings?.bowling_rating || 0 },
          { axis: "All-Round", get: (p: any) => p.ratings?.all_rounder_rating || 0 },
          { axis: "Consistency", get: (p: any) => p.ratings?.consistency_rating ?? p.career_batting?.consistency_index ?? 50 },
          { axis: "Clutch / KO", get: (p: any) => p.ratings?.clutch_rating ?? 50 },
          { axis: "Overall", get: (p: any) => p.ratings?.overall_rating || 0 },
        ];
        const radarData = axes.map((ax) => {
          const row: Record<string, any> = { axis: ax.axis };
          comparedData.forEach((p) => {
            row[p.player_id] = Number(ax.get(p).toFixed(1));
          });
          return row;
        });

        const seasonKeys = ["2023", "2024", "2025"];
        const seasonBarData = seasonKeys.map((sk) => {
          const row: Record<string, any> = { season: `EPL ${sk}` };
          comparedData.forEach((p) => {
            row[p.player_id] = p.season_breakdown?.[sk]?.batting?.total_runs || 0;
          });
          return row;
        });

        const seriesMeta = comparedData.map((p, idx) => ({
          dataKey: p.player_id,
          name: p.name,
          color: seriesColors[idx % seriesColors.length],
        }));

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <PlayerRatingRadarChart
              title="Normalized Multi-Player Capability Radar (0–100)"
              definition="Overlaps all selected players across identical 0–100 normalized rating scales to remove unit distortion."
              data={radarData}
              series={seriesMeta}
            />
            <SimpleComparisonBarChart
              title="Season-Wise Batting Runs Trajectory (2023–2025)"
              definition="Compares regulation-innings runs scored by each selected player across all three EPL seasons."
              interpretation="Reveals year-over-year form, peak seasons, and cross-season durability."
              data={seasonBarData}
              xKey="season"
              bars={seriesMeta}
              height={280}
            />
          </div>
        );
      })()}

      {/* Comparison Grid Table */}
      {comparedData.length > 0 ? (
        <div
          tabIndex={0}
          role="region"
          aria-label="Player Comparison Metrics Matrix"
          className="table-wrapper bg-white/90 backdrop-blur rounded-lg border border-[#07203F]/15 shadow-sm"
        >
          <table className="w-full text-left table-editorial table-sticky-col">
            <thead className="bg-[#07203F] text-[#EBDED4]">
              <tr>
                <th scope="col" className="p-3.5 w-1/4">Metric</th>
                {comparedData.map((p) => (
                  <th key={p.player_id} scope="col" className="p-3.5 text-center border-l border-[#D9AA90]/20">
                    <div className="font-serif font-bold text-base text-[#EBDED4]">{p.name}</div>
                    <div className="text-[10px] text-[#D9AA90] uppercase">{p.primary_role}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#07203F]/10 text-xs">
              {/* Overall Ratings */}
              <tr className="bg-[#EBDED4]/50 font-semibold">
                <td colSpan={comparedData.length + 1} className="p-2.5 text-[#07203F] uppercase tracking-wider text-[11px]">
                  1. Ratings & Auction Valuation
                </td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#07203F]">Overall EPL Rating</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#07203F]/10">
                    <RatingBadge score={p.ratings.overall_rating} size="sm" />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#07203F]">Auction Category</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#07203F]/10 font-semibold text-[#A65E46]">
                    {p.valuation.category}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#07203F]">Estimated Auction Value</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#07203F]/10 font-mono font-bold text-sm text-[#02000D]">
                    {p.valuation.estimated_valuation.toFixed(1)} pts
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#07203F]">Batting / Bowling Rating</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#07203F]/10 font-mono text-[#07203F]">
                    {p.ratings.batting_rating.toFixed(1)} / {p.ratings.bowling_rating.toFixed(1)}
                  </td>
                ))}
              </tr>

              {/* Batting Metrics */}
              <tr className="bg-[#EBDED4]/50 font-semibold">
                <td colSpan={comparedData.length + 1} className="p-2.5 text-[#07203F] uppercase tracking-wider text-[11px]">
                  2. Batting Performance Metrics
                </td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#07203F]">Matches / Innings</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#07203F]/10 font-mono">
                    {p.matches_played} m / {p.career_batting.innings} inn
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#07203F]">Total Runs Scored</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#07203F]/10 font-mono font-bold text-sm text-[#02000D]">
                    {p.career_batting.total_runs}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#07203F]">Strike Rate</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#07203F]/10 font-mono font-semibold text-[#A65E46]">
                    {p.career_batting.strike_rate.toFixed(1)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#07203F]">Batting Average</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#07203F]/10 font-mono">
                    {p.career_batting.batting_average.toFixed(2)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#07203F]">Boundaries (4s / 6s)</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#07203F]/10 font-mono">
                    {p.career_batting.fours} 4s / {p.career_batting.sixes} 6s ({p.career_batting.boundary_percentage.toFixed(1)}%)
                  </td>
                ))}
              </tr>

              {/* Bowling Metrics */}
              <tr className="bg-[#EBDED4]/50 font-semibold">
                <td colSpan={comparedData.length + 1} className="p-2.5 text-[#07203F] uppercase tracking-wider text-[11px]">
                  3. Bowling Performance Metrics
                </td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#07203F]">Overs Bowled</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#07203F]/10 font-mono">
                    {p.career_bowling.overs} ov ({p.career_bowling.legal_balls} balls)
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#07203F]">Total Wickets</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#07203F]/10 font-mono font-bold text-sm text-[#A65E46]">
                    {p.career_bowling.wickets}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#07203F]">Economy Rate</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#07203F]/10 font-mono font-semibold text-[#07203F]">
                    {p.career_bowling.legal_balls > 0 ? p.career_bowling.economy.toFixed(2) : "-"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#07203F]">Dot Ball Percentage</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#07203F]/10 font-mono">
                    {p.career_bowling.dot_ball_percentage.toFixed(1)}% ({p.career_bowling.dot_balls} dots)
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#07203F]">Best Bowling Figures</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#07203F]/10 font-mono font-semibold">
                    {p.career_bowling.best_figures}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-[#07203F]/70">
          Select players above to generate side-by-side comparison.
        </div>
      )}
    </div>
  );
}
