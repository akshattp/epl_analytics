"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity, Users, Shield, Flame, Zap, Database, Info, PlusCircle, CheckCircle2
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import {
  SimpleComparisonBarChart,
  OutcomesSplitChart,
  EPL_PALETTE,
} from "@/components/EplCharts";

export default function AdvancedAnalyticsPage() {
  const [tab, setTab] = useState<"partnerships" | "fielding" | "batting" | "bowling" | "impact" | "availability">("partnerships");
  const [seasonFilter, setSeasonFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  const [partnerships, setPartnerships] = useState<any>(null);
  const [fielding, setFielding] = useState<any>(null);
  const [advBat, setAdvBat] = useState<any>(null);
  const [advBowl, setAdvBowl] = useState<any>(null);
  const [impact, setImpact] = useState<any>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [playersList, setPlayersList] = useState<any[]>([]);

  // Manual Fielding Entry State (for future seasons)
  const [manualPlayerId, setManualPlayerId] = useState("EPL-P-001");
  const [manualSeason, setManualSeason] = useState(2026);
  const [manualTeam, setManualTeam] = useState("Exotica Warriors");
  const [manualType, setManualType] = useState("catch");
  const [manualNotes, setManualNotes] = useState("");
  const [manualMsg, setManualMsg] = useState<string | null>(null);

  const loadAll = async (seasonVal: string) => {
    setLoading(true);
    const qs = seasonVal !== "ALL" ? `?season=${seasonVal}` : "";
    try {
      const [pRes, fRes, bRes, bwRes, iRes, avRes, plRes] = await Promise.all([
        fetchApi(`/api/advanced/partnerships${qs}`),
        fetchApi(`/api/advanced/fielding${qs}`),
        fetchApi(`/api/advanced/batting${qs}`),
        fetchApi(`/api/advanced/bowling${qs}`),
        fetchApi("/api/advanced/impact"),
        fetchApi("/api/advanced/data-availability"),
        fetchApi("/api/players?sort_by=rating"),
      ]);
      setPartnerships(pRes);
      setFielding(fRes);
      setAdvBat(bRes);
      setAdvBowl(bwRes);
      setImpact(iRes);
      setAvailability(avRes.matrix || []);
      setPlayersList(plRes.players || []);
    } catch (err) {
      console.error("Failed loading advanced analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll(seasonFilter);
  }, [seasonFilter]);

  const handleManualFieldingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualMsg(null);
    try {
      const res = await fetchApi("/api/advanced/fielding/manual", {
        method: "POST",
        body: JSON.stringify({
          player_id: manualPlayerId,
          season: Number(manualSeason),
          fielding_team: manualTeam,
          dismissal_type: manualType,
          notes: manualNotes,
        }),
      });
      setManualMsg(`Recorded ${res.dismissal_type} for ${res.fielder_name} (ID #${res.id}).`);
      setManualNotes("");
      loadAll(seasonFilter);
    } catch (err: any) {
      setManualMsg(`Error: ${err.message}`);
    }
  };

  const partnershipCols: DataTableColumn<any>[] = [
    { key: "pair_label", header: "Batting Pair", minWidth: "180px", render: (r) => <span className="font-bold text-[#EBDED4]">{r.pair_label}</span> },
    { key: "runs", header: "Stand", align: "right", minWidth: "72px", sortAccessor: (r) => r.runs, render: (r) => <span className="font-mono font-bold text-sm text-[#A65E46]">{r.runs_display}</span> },
    { key: "wicket_label", header: "Wicket", minWidth: "82px", sortAccessor: (r) => r.wicket_number },
    { key: "contribution_pct", header: "Team %", tooltip: "Percentage of team innings total", align: "right", minWidth: "78px", render: (r) => <span className="font-mono text-[#D9AA90] font-semibold">{r.contribution_pct}%</span> },
    { key: "batting_team", header: "Team", minWidth: "125px" },
    { key: "opponent", header: "Opponent", minWidth: "125px" },
    { key: "season", header: "Season", align: "center", minWidth: "70px" },
    { key: "over_span", header: "Over Span", minWidth: "95px" },
    {
      key: "is_winning_match",
      header: "Outcome",
      align: "center",
      minWidth: "82px",
      render: (r) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.is_winning_match ? "bg-[#A65E46] text-[#EBDED4]" : "bg-[#02000D] text-[#EBDED4]/70 border border-[#D9AA90]/20"}`}>
          {r.is_winning_match ? "WIN" : "LOSS"}
        </span>
      ),
    },
  ];

  const pairCols: DataTableColumn<any>[] = [
    { key: "pair_label", header: "Batting Combination", minWidth: "180px", render: (r) => <span className="font-bold text-[#EBDED4]">{r.pair_label}</span> },
    { key: "stands", header: "Stands", align: "right", minWidth: "70px" },
    { key: "total_runs", header: "Total Runs", align: "right", minWidth: "86px", render: (r) => <span className="font-mono font-bold text-[#A65E46]">{r.total_runs}</span> },
    { key: "avg_runs", header: "Avg Stand", align: "right", minWidth: "86px", render: (r) => <span className="font-mono text-[#EBDED4]">{r.avg_runs}</span> },
    { key: "highest_stand", header: "Best", align: "right", minWidth: "68px", render: (r) => <span className="font-mono font-semibold text-[#D9AA90]">{r.highest_stand}</span> },
    { key: "avg_contribution_pct", header: "Avg Team %", align: "right", minWidth: "90px", render: (r) => <span className="font-mono text-[#D9AA90] font-semibold">{r.avg_contribution_pct}%</span> },
    { key: "stands_in_wins", header: "In Wins", align: "right", minWidth: "74px" },
  ];

  const fieldingCols: DataTableColumn<any>[] = [
    {
      key: "fielder_name",
      header: "Fielder",
      minWidth: "165px",
      render: (r) =>
        r.fielder_id ? (
          <Link href={`/players/${r.fielder_id}`} className="font-bold text-[#EBDED4] hover:text-[#D9AA90] transition">
            {r.fielder_name}
          </Link>
        ) : (
          <span className="font-semibold text-[#EBDED4]/80">{r.fielder_name} (WK)</span>
        ),
    },
    { key: "matches", header: "Mat", align: "right", minWidth: "60px" },
    { key: "total_dismissals", header: "Total Dis.", tooltip: "Total Fielding Dismissals Assisted", align: "right", minWidth: "84px", render: (r) => <span className="font-mono font-bold text-sm text-[#A65E46]">{r.total_dismissals}</span> },
    { key: "catches", header: "Catches", tooltip: "Includes Caught & Bowled", align: "right", minWidth: "78px" },
    { key: "run_outs_direct", header: "Direct RO", tooltip: "Solo Direct Run-Outs", align: "right", minWidth: "82px" },
    { key: "run_out_assists", header: "Joint RO", tooltip: "Shared Run-Out Assists (A / B)", align: "right", minWidth: "80px" },
    { key: "stumpings", header: "Stumpings", align: "right", minWidth: "84px" },
    { key: "dismissals_per_match", header: "Dis / Mat", align: "right", minWidth: "80px", render: (r) => <span className="font-mono text-[#D9AA90] font-semibold">{r.dismissals_per_match}</span> },
  ];

  const advBatCols: DataTableColumn<any>[] = [
    { key: "name", header: "Player", minWidth: "160px", render: (r) => <Link href={`/players/${r.player_id}`} className="font-bold text-[#EBDED4] hover:text-[#D9AA90] transition">{r.name}</Link> },
    { key: "innings", header: "Inns", align: "right", minWidth: "60px" },
    { key: "runs", header: "Runs", align: "right", minWidth: "68px", render: (r) => <span className="font-mono font-bold text-[#EBDED4]">{r.runs}</span> },
    { key: "runs_per_innings", header: "Runs/Inn", align: "right", minWidth: "80px" },
    { key: "boundary_runs_pct", header: "Bnd Run %", tooltip: "Share of runs scored via 4s & 6s", align: "right", minWidth: "88px", render: (r) => <span className="font-mono text-[#D9AA90]">{r.boundary_runs_pct}%</span> },
    { key: "team_run_share_pct", header: "Team Share %", tooltip: "Player runs as % of team innings total", align: "right", minWidth: "96px", render: (r) => <span className="font-mono font-bold text-[#A65E46]">{r.team_run_share_pct}%</span> },
    { key: "not_out_frequency_pct", header: "Not-Out %", align: "right", minWidth: "84px", render: (r) => <span className="font-mono">{r.not_out_frequency_pct}%</span> },
    { key: "high_impact_innings", header: "Impact Inns", tooltip: "Innings >=20 runs or >=35% of team total", align: "right", minWidth: "88px" },
    { key: "avg_in_wins", header: "Avg (Wins)", align: "right", minWidth: "86px" },
    { key: "avg_in_losses", header: "Avg (Loss)", align: "right", minWidth: "86px" },
    { key: "consistency_index", header: "Consist.", align: "right", minWidth: "78px", render: (r) => <span className="font-mono text-[#D9AA90]">{r.consistency_index ?? "n<3"}</span> },
  ];

  const advBowlCols: DataTableColumn<any>[] = [
    { key: "name", header: "Bowler", minWidth: "160px", render: (r) => <Link href={`/players/${r.player_id}`} className="font-bold text-[#EBDED4] hover:text-[#D9AA90] transition">{r.name}</Link> },
    { key: "matches_bowled", header: "Spells", align: "right", minWidth: "66px" },
    { key: "overs", header: "Overs", align: "right", minWidth: "68px" },
    { key: "wickets", header: "Wkts", align: "right", minWidth: "64px", render: (r) => <span className="font-mono font-bold text-[#A65E46]">{r.wickets}</span> },
    { key: "wickets_per_match", header: "Wkts/Sp", align: "right", minWidth: "76px" },
    { key: "economy", header: "Econ", align: "right", minWidth: "70px" },
    { key: "dot_ball_pct", header: "Dot Ball %", tooltip: "Verified directly from scorecard 0s column", align: "right", minWidth: "86px", render: (r) => <span className="font-mono font-bold text-[#D9AA90]">{r.dot_ball_pct}%</span> },
    { key: "bowling_contribution_pct", header: "Team Wkt %", align: "right", minWidth: "90px", render: (r) => <span className="font-mono">{r.bowling_contribution_pct}%</span> },
    { key: "wickets_in_wins", header: "Win Wkts", align: "right", minWidth: "80px" },
    { key: "best_spell", header: "Best", align: "center", minWidth: "72px", render: (r) => <span className="font-mono font-semibold text-[#D9AA90]">{r.best_spell}</span> },
    { key: "economy_std_dev", header: "Econ SD", tooltip: "Lower = more consistent spell economy", align: "right", minWidth: "76px" },
  ];

  const impactCols: DataTableColumn<any>[] = [
    { key: "name", header: "Player", minWidth: "165px", render: (r) => <Link href={`/players/${r.player_id}`} className="font-bold text-[#EBDED4] hover:text-[#D9AA90] transition">{r.name}</Link> },
    { key: "primary_role", header: "Role", minWidth: "120px" },
    { key: "matches", header: "Mat", align: "right", minWidth: "58px" },
    { key: "composite_impact_index", header: "Impact Idx", align: "right", minWidth: "88px", render: (r) => <span className="font-mono font-bold text-sm text-[#A65E46]">{r.composite_impact_index}</span> },
    { key: "winning_contribution_score", header: "Win Contrib", align: "right", minWidth: "90px" },
    { key: "knockout_impact_score", header: "KO Impact", align: "right", minWidth: "86px" },
    { key: "two_way_balance_score", header: "Two-Way", align: "right", minWidth: "82px" },
    { key: "fielding_dismissals", header: "Fielding", align: "right", minWidth: "76px" },
    {
      key: "archetype_tags",
      header: "Impact Archetypes",
      sortable: false,
      minWidth: "200px",
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {(r.archetype_tags || []).map((t: string) => (
            <span key={t} className="px-1.5 py-0.5 rounded bg-[#02000D] text-[#D9AA90] border border-[#D9AA90]/25 text-[10px] font-semibold">
              {t}
            </span>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="bg-[#07203F] text-[#EBDED4] rounded-xl p-6 sm:p-8 border border-[#D9AA90]/25 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-[#D9AA90] font-semibold mb-1.5">
              <Activity className="w-4 h-4 text-[#A65E46]" />
              <span>EPL Version 1.3 • Cricket Intelligence Expansion</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#EBDED4]">
              Advanced Cricket Analytics
            </h1>
            <p className="text-sm text-[#EBDED4]/80 mt-1.5 max-w-2xl">
              Exact wicket-by-wicket partnerships reconstructed from Fall of Wickets, canonical fielding dismissals, dot-ball containment metrics, wins-vs-losses splits, and transparent data-availability governance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-[#D9AA90] font-semibold">Season:</label>
            <select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#02000D] text-[#EBDED4] border border-[#D9AA90]/35 text-xs font-mono focus:outline-none focus:border-[#D9AA90]"
            >
              <option value="ALL">All Seasons (2023–2025)</option>
              <option value="2025">EPL 2025</option>
              <option value="2024">EPL 2024</option>
              <option value="2023">EPL 2023</option>
            </select>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-[#D9AA90]/20 text-xs">
          {[
            { id: "partnerships", label: "Partnerships", icon: Users },
            { id: "fielding", label: "Fielding Analytics", icon: Shield },
            { id: "batting", label: "Advanced Batting", icon: Flame },
            { id: "bowling", label: "Advanced Bowling (Dot-Ball %)", icon: Zap },
            { id: "impact", label: "Player Impact Model", icon: Activity },
            { id: "availability", label: "Data Availability Matrix", icon: Database },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`px-3 py-1.5 rounded font-semibold transition inline-flex items-center gap-1.5 ${
                  tab === t.id
                    ? "bg-[#A65E46] text-[#EBDED4] shadow-sm"
                    : "bg-[#02000D]/60 text-[#EBDED4]/80 hover:bg-[#02000D] border border-[#D9AA90]/15"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-[#A65E46] border-t-transparent rounded-full mb-3"></div>
          <p className="font-serif text-lg text-[#D9AA90]">Computing Advanced Scorecard Metrics...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: PARTNERSHIPS */}
          {tab === "partnerships" && partnerships && (
            <div className="space-y-6">
              <div className="bg-[#07203F] border-l-4 border-[#A65E46] p-4 rounded-r-xl text-xs text-[#EBDED4] border-t border-r border-b border-[#D9AA90]/20">
                <strong className="uppercase text-[10px] tracking-wider text-[#D9AA90] block mb-0.5">
                  Data Availability: {partnerships.availability}
                </strong>
                <span className="text-[#EBDED4]/90">{partnerships.method_note}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#07203F] text-[#EBDED4] p-4 rounded-xl border border-[#D9AA90]/25 shadow-sm">
                  <span className="text-[10px] uppercase text-[#D9AA90] block">Highest Partnership</span>
                  <span className="font-mono text-2xl font-bold text-[#EBDED4]">{partnerships.summary?.highest_runs}* runs</span>
                  <span className="text-[11px] text-[#EBDED4]/75 block truncate">{partnerships.summary?.highest_pair}</span>
                </div>
                <div className="bg-[#07203F] text-[#EBDED4] p-4 rounded-xl border border-[#D9AA90]/25 shadow-sm">
                  <span className="text-[10px] uppercase text-[#D9AA90] block">Average Partnership</span>
                  <span className="font-mono text-2xl font-bold text-[#EBDED4]">{partnerships.summary?.average_partnership} runs</span>
                  <span className="text-[11px] text-[#D9AA90] block">In wins: {partnerships.summary?.average_in_wins} runs</span>
                </div>
                <div className="bg-[#07203F] text-[#EBDED4] p-4 rounded-xl border border-[#D9AA90]/25 shadow-sm">
                  <span className="text-[10px] uppercase text-[#D9AA90] block">20+ / 30+ Stands</span>
                  <span className="font-mono text-2xl font-bold text-[#EBDED4]">{partnerships.summary?.twenty_plus_stands} / {partnerships.summary?.thirty_plus_stands}</span>
                  <span className="text-[11px] text-[#EBDED4]/75 block">Across {partnerships.total_partnerships} total stands</span>
                </div>
                <div className="bg-[#07203F] text-[#EBDED4] p-4 rounded-xl border border-[#D9AA90]/25 shadow-sm">
                  <span className="text-[10px] uppercase text-[#D9AA90] block">Unbroken Stands</span>
                  <span className="font-mono text-2xl font-bold text-[#EBDED4]">{partnerships.summary?.unbroken_stands}</span>
                  <span className="text-[11px] text-[#EBDED4]/75 block">Finished innings unbeaten</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <SimpleComparisonBarChart
                  title="Average & Highest Partnership by Wicket"
                  definition="Mean stand size and peak partnership recorded for each batting wicket position."
                  interpretation="Top-order stands (1st–3rd wicket) generate the overwhelming share of 30+ match-defining partnerships in 6-over cricket."
                  data={partnerships.by_wicket || []}
                  xKey="wicket_label"
                  bars={[
                    { dataKey: "avg_runs", name: "Avg Runs", color: EPL_PALETTE.peach },
                    { dataKey: "highest_runs", name: "Highest Stand", color: EPL_PALETTE.terracotta },
                  ]}
                />
                <SimpleComparisonBarChart
                  title="Season-Wise Partnership Evolution"
                  definition="Average overall stand vs average opening stand across EPL 2023–2025."
                  interpretation="Opening stands and overall partnership stability rose alongside the 2025 boundary surge."
                  data={(partnerships.by_season || []).map((s: any) => ({ ...s, season: String(s.season) }))}
                  xKey="season"
                  bars={[
                    { dataKey: "avg_partnership", name: "Avg Partnership", color: EPL_PALETTE.terracotta },
                    { dataKey: "avg_opening_stand", name: "Avg Opening Stand", color: EPL_PALETTE.peach },
                  ]}
                />
              </div>

              <DataTable
                data={partnerships.highest_partnerships || []}
                columns={partnershipCols}
                rowKey={(r) => r.id}
                title="Highest Individual Partnerships in EPL History"
                subtitle="Exact stands reconstructed from complete Fall of Wickets"
                searchable
                defaultSortKey="runs"
                highlightRow={(r) => r.runs >= 35}
              />

              <DataTable
                data={partnerships.best_opening_partnerships || []}
                columns={partnershipCols}
                rowKey={(r) => `open-${r.id}`}
                title="Best Opening Partnerships (1st Wicket)"
                defaultSortKey="runs"
              />

              <DataTable
                data={partnerships.top_pairs || []}
                columns={pairCols}
                rowKey={(r) => r.pair_label}
                title="Most Successful Cumulative Batting Pairs"
                searchable
                defaultSortKey="total_runs"
              />
            </div>
          )}

          {/* TAB 2: FIELDING ANALYTICS */}
          {tab === "fielding" && fielding && (
            <div className="space-y-6">
              <div className="bg-[#07203F] border-l-4 border-[#A65E46] p-4 rounded-r-xl text-xs text-[#EBDED4] border-t border-r border-b border-[#D9AA90]/20">
                <strong className="uppercase text-[10px] tracking-wider text-[#D9AA90] block mb-0.5">
                  Data Availability: {fielding.availability} ({fielding.total_fielding_events} Canonical Events)
                </strong>
                <span className="text-[#EBDED4]/90">{fielding.method_note}</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <OutcomesSplitChart
                  title="Bowler-Credited vs Fielder-Assisted Dismissals"
                  definition="Distinguishes wickets credited to bowlers (bowled, caught, c&b, stumped, hit wkt) from fielder-only run-outs."
                  interpretation={`Run-outs account for ${fielding.bowler_vs_fielder_attribution?.run_out_share_pct}% of all EPL dismissals—making agile fielding a decisive factor in underarm cricket.`}
                  data={[
                    { label: "Bowled / Hit Wkt (Bowler Only)", count: (fielding.bowler_vs_fielder_attribution?.breakdown?.bowled_bowler_only || 0) + (fielding.bowler_vs_fielder_attribution?.breakdown?.hit_wicket_bowler_only || 0) },
                    { label: "Caught / Stumped (Bowler + Fielder)", count: (fielding.bowler_vs_fielder_attribution?.breakdown?.caught_bowler_plus_fielder || 0) + (fielding.bowler_vs_fielder_attribution?.breakdown?.caught_and_bowled || 0) + (fielding.bowler_vs_fielder_attribution?.breakdown?.stumped_bowler_plus_keeper || 0) },
                    { label: "Run-Outs (Fielder Only)", count: fielding.bowler_vs_fielder_attribution?.breakdown?.run_out_fielder_only || 0 },
                  ]}
                />
                <SimpleComparisonBarChart
                  title="Season-Wise Fielding Dismissals"
                  definition="Catches, run-outs (direct + assists), and stumpings recorded each season."
                  interpretation="Run-outs consistently dominate dismissal volume in 6-over underarm contests across every season."
                  data={(fielding.by_season || []).map((s: any) => ({ ...s, season: String(s.season) }))}
                  xKey="season"
                  bars={[
                    { dataKey: "run_outs", name: "Run-Outs", color: EPL_PALETTE.terracotta },
                    { dataKey: "catches", name: "Catches", color: EPL_PALETTE.peach },
                    { dataKey: "stumpings", name: "Stumpings", color: EPL_PALETTE.beige },
                  ]}
                />
              </div>

              <DataTable
                data={fielding.leaderboard || []}
                columns={fieldingCols}
                rowKey={(r, i) => `${r.fielder_id || r.fielder_name}-${i}`}
                title="Canonical EPL Fielding Leaderboard"
                subtitle="Catches, direct run-outs, shared run-out assists, and wicketkeeper stumpings"
                searchable
                defaultSortKey="total_dismissals"
                highlightRow={(r) => r.total_dismissals >= 8}
              />

              {/* Future-Season Manual Fielding Data Entry */}
              <div className="bg-[#07203F] rounded-xl border border-[#D9AA90]/25 p-5 space-y-4">
                <div className="flex items-center space-x-2 border-b border-[#D9AA90]/20 pb-2">
                  <PlusCircle className="w-4 h-4 text-[#A65E46]" />
                  <h3 className="font-serif text-base font-bold text-[#EBDED4]">
                    Future-Season Manual Fielding Entry (Admin Utility)
                  </h3>
                </div>
                {manualMsg && (
                  <div className="p-2.5 rounded bg-[#02000D] border border-[#D9AA90]/30 text-[#D9AA90] text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#A65E46]" />
                    <span>{manualMsg}</span>
                  </div>
                )}
                <form onSubmit={handleManualFieldingSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#D9AA90] mb-1">Player</label>
                    <select value={manualPlayerId} onChange={(e) => setManualPlayerId(e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-[#D9AA90]/30 bg-[#02000D] text-[#EBDED4] focus:outline-none focus:border-[#D9AA90]">
                      {playersList.map((p) => (
                        <option key={p.player_id} value={p.player_id}>{p.name} ({p.player_id})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#D9AA90] mb-1">Dismissal Type</label>
                    <select value={manualType} onChange={(e) => setManualType(e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-[#D9AA90]/30 bg-[#02000D] text-[#EBDED4] focus:outline-none focus:border-[#D9AA90]">
                      <option value="catch">Catch</option>
                      <option value="run_out">Direct Run-Out</option>
                      <option value="run_out_assist">Joint Run-Out Assist</option>
                      <option value="stumping">Stumping</option>
                      <option value="caught_and_bowled">Caught &amp; Bowled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#D9AA90] mb-1">Season</label>
                    <input type="number" value={manualSeason} onChange={(e) => setManualSeason(Number(e.target.value))} className="w-full px-2.5 py-1.5 rounded-lg border border-[#D9AA90]/30 bg-[#02000D] text-[#EBDED4] font-mono focus:outline-none focus:border-[#D9AA90]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#D9AA90] mb-1">Team</label>
                    <input type="text" value={manualTeam} onChange={(e) => setManualTeam(e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-[#D9AA90]/30 bg-[#02000D] text-[#EBDED4] focus:outline-none focus:border-[#D9AA90]" />
                  </div>
                  <button type="submit" className="px-4 py-1.5 rounded-lg bg-[#A65E46] text-[#EBDED4] hover:bg-[#A65E46]/90 font-semibold transition">
                    Record Dismissal
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: ADVANCED BATTING */}
          {tab === "batting" && advBat && (
            <div className="space-y-6">
              <div className="bg-[#07203F] border-l-4 border-[#A65E46] p-4 rounded-r-xl text-xs text-[#EBDED4] flex items-start gap-2.5 border-t border-r border-b border-[#D9AA90]/20">
                <Info className="w-4 h-4 text-[#A65E46] shrink-0 mt-0.5" />
                <div>
                  <strong className="uppercase text-[10px] tracking-wider text-[#D9AA90] block">Batting Dot-Ball % Status</strong>
                  <span className="text-[#EBDED4]/90">{advBat.dot_ball_status}</span>
                </div>
              </div>
              <DataTable
                data={advBat.players || []}
                columns={advBatCols}
                rowKey={(r) => r.player_id}
                title="Advanced Batting Analytics"
                subtitle="Boundary %, team run share, not-out frequency, high-impact innings, and win/loss splits"
                searchable
                defaultSortKey="runs"
                highlightRow={(r) => r.high_impact_innings >= 2}
              />
            </div>
          )}

          {/* TAB 4: ADVANCED BOWLING */}
          {tab === "bowling" && advBowl && (
            <div className="space-y-6">
              <div className="bg-[#07203F] border-l-4 border-[#A65E46] p-4 rounded-r-xl text-xs text-[#EBDED4] border-t border-r border-b border-[#D9AA90]/20">
                <strong className="uppercase text-[10px] tracking-wider text-[#D9AA90] block">Bowling Dot-Ball % Status</strong>
                <span className="text-[#EBDED4]/90">{advBowl.dot_ball_status}</span>
              </div>
              <DataTable
                data={advBowl.players || []}
                columns={advBowlCols}
                rowKey={(r) => r.player_id}
                title="Advanced Bowling Analytics"
                subtitle="Verified dot-ball percentage, team wicket share, winning-match wickets, best spells, and economy consistency"
                searchable
                defaultSortKey="wickets"
                highlightRow={(r) => r.dot_ball_pct >= 50 && r.legal_balls >= 24}
              />
            </div>
          )}

          {/* TAB 5: PLAYER IMPACT MODEL */}
          {tab === "impact" && impact && (
            <div className="space-y-6">
              <div className="bg-[#02000D] text-[#EBDED4] p-4 rounded-xl border border-[#D9AA90]/30 text-xs">
                <strong className="uppercase text-[10px] tracking-widest text-[#D9AA90] block mb-1">
                  Correlation vs Causation Guardrail
                </strong>
                <span className="text-[#EBDED4]/90">{impact.methodology_disclaimer}</span>
              </div>

              <SimpleComparisonBarChart
                title="Top 10 Players – Composite Impact Breakdown"
                definition="Winning-match contribution, knockout impact, and two-way balance components for top EPL performers."
                interpretation="Highlights players whose statistical output aligns across regular victories, high-pressure knockouts, and dual disciplines."
                data={(impact.players || []).slice(0, 10)}
                xKey="name"
                bars={[
                  { dataKey: "winning_contribution_score", name: "Win Contrib", color: EPL_PALETTE.peach },
                  { dataKey: "knockout_impact_score", name: "Knockout Impact", color: EPL_PALETTE.terracotta },
                  { dataKey: "two_way_balance_score", name: "Two-Way Balance", color: EPL_PALETTE.beige },
                ]}
                height={290}
              />

              <DataTable
                data={impact.players || []}
                columns={impactCols}
                rowKey={(r) => r.player_id}
                title="EPL Player Impact Model Leaderboard"
                subtitle="Minimum 2 matches played • Composite score across overall rating, win contribution, knockouts & two-way balance"
                searchable
                defaultSortKey="composite_impact_index"
                highlightRow={(r) => r.composite_impact_index >= 60}
              />
            </div>
          )}

          {/* TAB 6: DATA AVAILABILITY MATRIX */}
          {tab === "availability" && (
            <DataTable
              data={availability}
              columns={[
                { key: "module", header: "Module", minWidth: "130px", render: (r) => <span className="font-bold text-[#EBDED4]">{r.module}</span> },
                { key: "metric", header: "Analytical Metric", minWidth: "220px" },
                {
                  key: "status",
                  header: "Availability Classification",
                  minWidth: "180px",
                  render: (r) => (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      r.status === "DIRECTLY AVAILABLE"
                        ? "bg-[#07203F] text-[#D9AA90] border border-[#D9AA90]/30"
                        : r.status === "DERIVABLE FROM EXISTING DATA"
                        ? "bg-[#A65E46] text-[#EBDED4]"
                        : "bg-[#02000D] text-[#EBDED4]/70 border border-[#D9AA90]/20"
                    }`}>
                      {r.status}
                    </span>
                  ),
                },
                { key: "source", header: "Evidence & Technical Explanation", minWidth: "320px", sortable: false },
              ]}
              rowKey={(r, i) => `${r.module}-${i}`}
              title="EPL Historical Data Availability Matrix"
              subtitle="Audited directly against all 27 source CricHeroes PDFs and the SQLite schema"
              stickyFirstColumn={false}
            />
          )}
        </>
      )}
    </div>
  );
}
