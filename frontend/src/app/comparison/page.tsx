"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  GitCompare, Users, Plus, X, ArrowRight, 
  Flame, Shield, TrendingUp, Check, Award, Zap
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

  // Helper to determine metric leader (without modifying underlying calculations)
  const isLeader = (val: number, allVals: number[], direction: "high" | "low" = "high") => {
    if (allVals.length <= 1) return false;
    const valid = allVals.filter((v) => typeof v === "number" && !isNaN(v) && v > 0);
    if (valid.length <= 1) return false;
    const target = direction === "high" ? Math.max(...valid) : Math.min(...valid);
    return val === target;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-[#DDD5C3] dark:border-[#2A2E38] pb-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-semibold tracking-wider text-[#FF4B35] mb-1 font-mono">
              Multi-Player Head-to-Head Evaluation
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111318] dark:text-[#F1EBDD]">
              Player Comparison
            </h1>
            <p className="text-sm text-[#5C584E] dark:text-[#A8A296] mt-1 max-w-xl leading-relaxed">
              Side-by-side performance audit across all batting, bowling, ratings, and auction valuation metrics. Category leaders highlighted.
            </p>
          </div>
          <div className="text-xs text-[#FF4B35] bg-[#FF4B35]/10 px-3 py-1.5 rounded-lg border border-[#FF4B35]/20 font-semibold font-mono">
            Comparing {comparedData.length} of max 4 players
          </div>
        </div>
      </div>

      {/* Player Selector Bar */}
      <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-xl p-4 border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-semibold uppercase text-[#5C584E] dark:text-[#A8A296] mr-1 font-mono">Selected:</span>
          {comparedData.map((p) => (
            <div 
              key={p.player_id}
              className="inline-flex items-center space-x-2 bg-[#F1EBDD] dark:bg-[#111318] text-[#111318] dark:text-[#F1EBDD] border border-[#DDD5C3] dark:border-[#2A2E38] px-3 py-1.5 rounded-lg text-xs"
            >
              <span className="font-bold">{p.name}</span>
              <button 
                onClick={() => removePlayer(p.player_id)}
                className="text-[#5C584E] dark:text-[#A8A296] hover:text-[#FF4B35] transition ml-1"
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
                className="px-3 py-1.5 text-xs rounded-lg border border-[#DDD5C3] dark:border-[#2A2E38] bg-[#FAF7F0] dark:bg-[#111318] text-[#111318] dark:text-[#F1EBDD] focus:outline-none focus:border-[#FF4B35]"
              >
                <option value="" disabled>+ Add Player to Compare...</option>
                {allPlayers
                  .filter((p) => !selectedIds.includes(p.player_id))
                  .map((p) => (
                    <option key={p.player_id} value={p.player_id}>
                      {p.name} ({p.primary_role} - Rating: {p.ratings?.overall_rating || 0})
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Visual Comparison Charts */}
      {comparedData.length >= 2 && (() => {
        const seriesColors = [EPL_PALETTE.blue, EPL_PALETTE.cyan, "#8B5CF6", "#10B981"];
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
          className="table-wrapper bg-[#FAF7F0] dark:bg-[#181A20] rounded-xl border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm overflow-x-auto text-[#111318] dark:text-[#F1EBDD]"
        >
          <table className="w-full text-left table-editorial table-sticky-col">
            <thead>
              <tr>
                <th scope="col" className="p-3.5 w-1/4">Metric</th>
                {comparedData.map((p) => (
                  <th key={p.player_id} scope="col" className="p-3.5 text-center border-l border-[#DDD5C3] dark:border-[#2A2E38]">
                    <div className="font-display font-bold text-base text-[#111318] dark:text-[#F1EBDD]">{p.name}</div>
                    <div className="text-[10px] text-[#FF4B35] uppercase tracking-wider font-mono">{p.primary_role}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-xs">
              {/* Category 1: Ratings & PIS */}
              <tr className="bg-[#F1EBDD] dark:bg-[#111318] font-semibold">
                <td colSpan={comparedData.length + 1} className="p-2.5 text-[#FF4B35] uppercase tracking-wider text-[11px] border-b border-[#DDD5C3] dark:border-[#2A2E38] font-mono">
                  1. Ratings &amp; Player Intelligence (PIS)
                </td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#101828] dark:text-[#F8FAFC]">Player Intelligence Score (PIS)</td>
                {comparedData.map((p) => {
                  const val = p.player_intelligence?.overall_player_intelligence_score || p.ratings?.overall_rating || 0;
                  const allVals = comparedData.map((x) => x.player_intelligence?.overall_player_intelligence_score || x.ratings?.overall_rating || 0);
                  const isTop = isLeader(val, allVals, "high");
                  return (
                    <td key={p.player_id} className={`p-3 text-center border-l border-[#DDD5C3] dark:border-[#2A2E38] font-display font-bold text-base ${isTop ? "text-[#FF4B35]" : "text-[#111318] dark:text-[#F1EBDD]"}`}>
                      {val.toFixed(1)} / 100 {isTop && <span className="text-[10px] ml-1 text-emerald-600 dark:text-emerald-400 font-sans">★ Leader</span>}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#111318] dark:text-[#F1EBDD]">Experience Level</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#DDD5C3] dark:border-[#2A2E38] font-semibold text-[#111318] dark:text-[#F1EBDD]">
                    {p.experience_label || p.player_intelligence?.experience_label || `${p.matches_played || p.matches || 0} Matches`}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#111318] dark:text-[#F1EBDD]">Role Classification</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#DDD5C3] dark:border-[#2A2E38] font-semibold text-[#5C584E] dark:text-[#A8A296]">
                    {p.role_classification || p.all_rounder_metrics?.role_classification || p.primary_role}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#111318] dark:text-[#F1EBDD]">Confidence Level</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#DDD5C3] dark:border-[#2A2E38] font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded-full bg-[#FF4B35]/10 border border-[#FF4B35]/20 text-[#FF4B35] font-semibold">
                      {p.confidence_level || p.player_intelligence?.confidence_level || "MEDIUM"}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#111318] dark:text-[#F1EBDD]">Performance Tags</td>
                {comparedData.map((p) => {
                  const tags = p.performance_tags || p.player_intelligence?.performance_tags || p.secondary_roles || [];
                  return (
                    <td key={p.player_id} className="p-3 text-center border-l border-[#DDD5C3] dark:border-[#2A2E38]">
                      <div className="flex flex-wrap justify-center gap-1">
                        {tags.length > 0 ? (
                          tags.map((t: string, idx: number) => (
                            <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-[#E8E1D1]/60 dark:bg-[#22252D] text-[#111318] dark:text-[#F1EBDD] border border-[#DDD5C3] dark:border-[#2A2E38]">
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-[#5C584E] dark:text-[#A8A296] italic">—</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#101828] dark:text-[#F8FAFC]">Auction Valuation Tier</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#E2E8F0] dark:border-[#334155] font-semibold text-[#101828] dark:text-[#F8FAFC]">
                    {p.valuation?.category}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#111318] dark:text-[#F1EBDD]">Estimated Auction Value</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#DDD5C3] dark:border-[#2A2E38] font-mono font-bold text-sm text-[#FF4B35]">
                    ₹{p.valuation?.estimated_valuation?.toFixed(1)}L
                  </td>
                ))}
              </tr>

              {/* Category 2: Batting Metrics */}
              <tr className="bg-[#F1EBDD] dark:bg-[#111318] font-semibold">
                <td colSpan={comparedData.length + 1} className="p-2.5 text-[#FF4B35] uppercase tracking-wider text-[11px] border-b border-[#DDD5C3] dark:border-[#2A2E38] font-mono">
                  2. Batting Performance Metrics
                </td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#111318] dark:text-[#F1EBDD]">Matches / Innings</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#DDD5C3] dark:border-[#2A2E38] font-mono text-[#111318] dark:text-[#F1EBDD]">
                    {p.matches_played || p.matches} m / {p.career_batting?.innings || 0} inn
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#111318] dark:text-[#F1EBDD]">Total Runs Scored</td>
                {comparedData.map((p) => {
                  const val = p.career_batting?.total_runs || 0;
                  const allVals = comparedData.map((x) => x.career_batting?.total_runs || 0);
                  const isTop = isLeader(val, allVals, "high");
                  return (
                    <td key={p.player_id} className={`p-3 text-center border-l border-[#DDD5C3] dark:border-[#2A2E38] font-mono font-bold text-sm ${isTop ? "text-[#FF4B35]" : "text-[#111318] dark:text-[#F1EBDD]"}`}>
                      {val} {isTop && <span className="text-[10px] ml-1 text-emerald-600 dark:text-emerald-400">★</span>}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#111318] dark:text-[#F1EBDD]">Strike Rate</td>
                {comparedData.map((p) => {
                  const val = p.career_batting?.strike_rate || 0;
                  const allVals = comparedData.map((x) => x.career_batting?.strike_rate || 0);
                  const isTop = isLeader(val, allVals, "high");
                  return (
                    <td key={p.player_id} className={`p-3 text-center border-l border-[#DDD5C3] dark:border-[#2A2E38] font-mono font-bold ${isTop ? "text-[#FF4B35]" : "text-[#111318] dark:text-[#F1EBDD]"}`}>
                      {val.toFixed(1)} {isTop && <span className="text-[10px] ml-1 text-emerald-600 dark:text-emerald-400">★</span>}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#111318] dark:text-[#F1EBDD]">Batting Average</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#DDD5C3] dark:border-[#2A2E38] font-mono text-[#111318] dark:text-[#F1EBDD]">
                    {p.career_batting?.average_display || p.career_batting?.batting_average?.toFixed(2) || "0.00"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#111318] dark:text-[#F1EBDD]">Boundaries (4s / 6s)</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#DDD5C3] dark:border-[#2A2E38] font-mono text-[#111318] dark:text-[#F1EBDD]">
                    {p.career_batting?.fours || 0}x4 / {p.career_batting?.sixes || 0}x6 ({p.career_batting?.boundary_percentage?.toFixed(1) || 0}%)
                  </td>
                ))}
              </tr>

              {/* Category 3: Bowling Metrics */}
              <tr className="bg-[#F1EBDD] dark:bg-[#111318] font-semibold">
                <td colSpan={comparedData.length + 1} className="p-2.5 text-[#FF4B35] uppercase tracking-wider text-[11px] border-b border-[#DDD5C3] dark:border-[#2A2E38] font-mono">
                  3. Bowling Performance Metrics
                </td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#101828] dark:text-[#F8FAFC]">Overs Bowled</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#E2E8F0] dark:border-[#334155] font-mono text-[#101828] dark:text-[#F8FAFC]">
                    {p.career_bowling?.overs_display || p.career_bowling?.overs} ov ({p.career_bowling?.legal_balls} balls)
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#101828] dark:text-[#F8FAFC]">Total Wickets</td>
                {comparedData.map((p) => {
                  const val = p.career_bowling?.wickets || 0;
                  const allVals = comparedData.map((x) => x.career_bowling?.wickets || 0);
                  const isTop = isLeader(val, allVals, "high");
                  return (
                    <td key={p.player_id} className={`p-3 text-center border-l border-[#DDD5C3] dark:border-[#2A2E38] font-mono font-bold text-sm ${isTop ? "text-[#FF4B35]" : "text-[#111318] dark:text-[#F1EBDD]"}`}>
                      {val} {isTop && <span className="text-[10px] ml-1 text-emerald-600 dark:text-emerald-400">★</span>}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#111318] dark:text-[#F1EBDD]">Economy Rate (Legal Balls)</td>
                {comparedData.map((p) => {
                  const val = p.career_bowling?.legal_balls > 0 ? p.career_bowling.economy : 99;
                  const allVals = comparedData.map((x) => (x.career_bowling?.legal_balls > 0 ? x.career_bowling.economy : 99));
                  const isTop = isLeader(val, allVals, "low") && val < 90;
                  return (
                    <td key={p.player_id} className={`p-3 text-center border-l border-[#DDD5C3] dark:border-[#2A2E38] font-mono font-bold ${isTop ? "text-[#FF4B35]" : "text-[#111318] dark:text-[#F1EBDD]"}`}>
                      {p.career_bowling?.legal_balls > 0 ? `${p.career_bowling.economy.toFixed(2)}` : "—"}
                      {isTop && <span className="text-[10px] ml-1 text-emerald-600 dark:text-emerald-400">★</span>}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#111318] dark:text-[#F1EBDD]">Dot Ball Percentage</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#DDD5C3] dark:border-[#2A2E38] font-mono text-[#111318] dark:text-[#F1EBDD]">
                    {p.career_bowling?.dot_ball_percentage?.toFixed(1) || 0}% ({p.career_bowling?.dot_balls || 0} dots)
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#111318] dark:text-[#F1EBDD]">Best Bowling Figures</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#DDD5C3] dark:border-[#2A2E38] font-mono font-bold text-[#111318] dark:text-[#F1EBDD]">
                    {p.career_bowling?.best_figures || "—"}
                  </td>
                ))}
              </tr>

              {/* Category 4: Situational Splits & 6-Over Milestones */}
              <tr className="bg-[#F1EBDD] dark:bg-[#111318] font-semibold">
                <td colSpan={comparedData.length + 1} className="p-2.5 text-[#FF4B35] uppercase tracking-wider text-[11px] border-b border-[#DDD5C3] dark:border-[#2A2E38] font-mono">
                  4. Situational Splits &amp; 6-Over Milestones
                </td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#111318] dark:text-[#F1EBDD]">Setting (1st) vs Chasing Runs</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#DDD5C3] dark:border-[#2A2E38] font-mono text-[#111318] dark:text-[#F1EBDD]">
                    {p.situational_splits?.batting_first?.total_runs || 0} runs (1st) / {p.situational_splits?.chasing?.total_runs || 0} runs (Chase)
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#111318] dark:text-[#F1EBDD]">Bowling 1st vs Defending Economy</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#DDD5C3] dark:border-[#2A2E38] font-mono text-[#111318] dark:text-[#F1EBDD]">
                    {p.situational_splits?.bowling_first?.economy ? `${p.situational_splits.bowling_first.economy.toFixed(2)}` : "—"} / {p.situational_splits?.defending?.economy ? `${p.situational_splits.defending.economy.toFixed(2)}` : "—"} RPO
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#111318] dark:text-[#F1EBDD]">10+ / 15+ / 20+ Innings</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#DDD5C3] dark:border-[#2A2E38] font-mono font-semibold text-[#FF4B35]">
                    {p.career_batting?.scores_10_plus || 0} / {p.career_batting?.scores_15_plus || 0} / {p.career_batting?.scores_20_plus || 0}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-[#111318] dark:text-[#F1EBDD]">Multi-Wicket Spells (2+ Wkts)</td>
                {comparedData.map((p) => (
                  <td key={p.player_id} className="p-3 text-center border-l border-[#DDD5C3] dark:border-[#2A2E38] font-mono font-semibold text-[#5C584E] dark:text-[#A8A296]">
                    {p.career_bowling?.two_plus_wickets || 0} spells ({p.career_bowling?.multi_wicket_frequency || 0}%)
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-16 text-center text-xs text-[#5C584E] dark:text-[#A8A296] bg-[#FAF7F0] dark:bg-[#181A20] rounded-xl border border-[#DDD5C3] dark:border-[#2A2E38]">
          Select players above to generate side-by-side comparison.
        </div>
      )}
    </div>
  );
}
