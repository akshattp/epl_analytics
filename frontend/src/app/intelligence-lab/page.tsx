"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FlaskConical, Users, Trophy, AlertTriangle, Sparkles, Shield } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { SimpleComparisonBarChart, EPL_PALETTE } from "@/components/EplCharts";

export default function IntelligenceLabPage() {
  const [comboSize, setComboSize] = useState<2 | 3>(2);
  const [minMatches, setMinMatches] = useState<number>(3);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [players, setPlayers] = useState<any[]>([]);
  const [comboData, setComboData] = useState<any>(null);
  const [discoveries, setDiscoveries] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comboLoading, setComboLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchApi("/api/players?sort_by=rating"),
      fetchApi("/api/intelligence-lab/discoveries"),
      fetchApi("/api/intelligence-lab/combinations?size=2&min_matches=3&limit=40"),
    ])
      .then(([pRes, dRes, cRes]) => {
        setPlayers(pRes.players || []);
        setDiscoveries(dRes);
        setComboData(cRes);
      })
      .catch((err) => console.error("Error loading Intelligence Lab:", err))
      .finally(() => setLoading(false));
  }, []);

  const refreshCombinations = async (size: 2 | 3, minM: number, pid: string) => {
    setComboLoading(true);
    try {
      const params = new URLSearchParams({
        size: String(size),
        min_matches: String(minM),
        limit: "40",
      });
      if (pid) params.append("player_id", pid);
      const res = await fetchApi(`/api/intelligence-lab/combinations?${params.toString()}`);
      setComboData(res);
    } catch (err) {
      console.error("Failed refreshing combinations:", err);
    } finally {
      setComboLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      refreshCombinations(comboSize, minMatches, selectedPlayerId);
    }
  }, [comboSize, minMatches, selectedPlayerId]);

  const comboColumns: DataTableColumn<any>[] = [
    {
      key: "combination_label",
      header: `${comboSize}-Player Combination`,
      minWidth: "230px",
      render: (r) => (
        <div>
          <span className="font-bold text-[#EBDED4]">{r.combination_label}</span>
          <span className="block text-[10px] text-[#D9AA90]/70 font-mono">
            {(r.teams || []).join(", ")} • {(r.seasons || []).join(", ")}
          </span>
        </div>
      ),
    },
    {
      key: "matches_together",
      header: "Matches (n)",
      tooltip: "Shared matches played on the same franchise",
      align: "right",
      minWidth: "84px",
      render: (r) => <span className="font-mono font-bold text-[#EBDED4]">{r.matches_together}</span>,
    },
    {
      key: "wins_together",
      header: "Wins",
      align: "right",
      minWidth: "64px",
      render: (r) => <span className="font-mono font-bold text-[#A65E46]">{r.wins_together}</span>,
    },
    {
      key: "win_pct_with",
      header: "Win % With",
      tooltip: "Franchise win percentage when this combination played together",
      align: "right",
      minWidth: "88px",
      render: (r) => <span className="font-mono font-bold text-[#D9AA90]">{r.win_pct_with}%</span>,
    },
    {
      key: "win_pct_without",
      header: "Win % Without",
      tooltip: "Same franchise(s) win % in matches without this full combination",
      align: "right",
      minWidth: "96px",
      render: (r) => (
        <span className="font-mono text-[#EBDED4]/70">
          {r.win_pct_without !== null && r.win_pct_without !== undefined ? `${r.win_pct_without}%` : "N/A"}
        </span>
      ),
    },
    { key: "semifinals_reached", header: "SFs", align: "right", minWidth: "56px" },
    { key: "finals_reached", header: "Finals", align: "right", minWidth: "62px" },
    {
      key: "championships_won",
      header: "Titles",
      align: "right",
      minWidth: "60px",
      render: (r) => (
        <span className={`font-mono font-bold ${r.championships_won > 0 ? "text-[#A65E46]" : "text-[#EBDED4]/40"}`}>
          {r.championships_won}
        </span>
      ),
    },
    { key: "combined_runs", header: "Comb Runs", align: "right", minWidth: "84px" },
    { key: "combined_wickets", header: "Comb Wkts", align: "right", minWidth: "84px" },
    {
      key: "confidence_level",
      header: "Reliability",
      tooltip: "Sample-size reliability guardrail",
      minWidth: "160px",
      render: (r) => (
        <div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            r.confidence_level === "Moderate Exploratory"
              ? "bg-[#07203F] text-[#D9AA90] border border-[#D9AA90]/40"
              : r.confidence_level === "Low Exploratory"
              ? "bg-[#02000D] text-[#EBDED4]/80 border border-[#D9AA90]/20"
              : "bg-[#A65E46]/20 text-[#A65E46] border border-[#A65E46]/40"
          }`}>
            {r.confidence_level}
          </span>
          {r.matches_together < 4 && (
            <span className="block text-[9px] text-[#A65E46] mt-0.5 leading-tight font-mono">
              Insufficient evidence (n&lt;4)
            </span>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#A65E46] border-t-transparent rounded-full mb-3"></div>
        <p className="font-serif text-lg text-[#D9AA90]">Mining Historical Team Combinations &amp; Patterns...</p>
      </div>
    );
  }

  const topChartCombos = (comboData?.combinations || []).slice(0, 8).map((c: any) => ({
    name: c.player_names.map((n: string) => n.split(" ")[0]).join(" + "),
    win_pct: c.win_pct_with,
    runs: c.combined_runs,
    matches: c.matches_together,
  }));

  return (
    <div className="space-y-8">
      {/* Editorial Hero */}
      <div className="bg-[#02000D] text-[#EBDED4] rounded-xl p-6 sm:p-8 border border-[#D9AA90]/30 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-[#D9AA90] font-semibold mb-2">
              <FlaskConical className="w-4 h-4 text-[#A65E46]" />
              <span>EPL Intelligence Lab • Exploratory Pattern Discovery</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#EBDED4]">
              Team Combinations &amp; Winning Patterns
            </h1>
            <p className="text-sm text-[#EBDED4]/80 mt-2 max-w-2xl">
              Uncovers two-player and three-player franchise synergies, recurring semifinal cores, multi-season finalists, and structural hypotheses hidden beneath ordinary leaderboards.
            </p>
          </div>
          <div className="bg-[#07203F] border border-[#D9AA90]/30 rounded-xl px-4 py-3 text-xs max-w-xs shadow-sm">
            <div className="font-bold text-[#D9AA90] flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-[#A65E46]" />
              <span>Statistical Reliability Guardrail</span>
            </div>
            <p className="text-[11px] text-[#EBDED4]/80 leading-relaxed">
              Dataset spans 27 historical matches. Every discovery displays sample size (n) and confidence level; exploratory patterns never imply guaranteed outcomes.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION A: INTERACTIVE COMBINATION EXPLORER */}
      <div className="space-y-5">
        <div className="bg-[#07203F] text-[#EBDED4] rounded-xl border border-[#D9AA90]/25 p-5 shadow-md flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#D9AA90] mb-1">
                Combination Size
              </label>
              <div className="inline-flex rounded-lg border border-[#D9AA90]/30 overflow-hidden text-xs">
                <button
                  onClick={() => setComboSize(2)}
                  className={`px-3.5 py-1.5 font-semibold transition ${
                    comboSize === 2 ? "bg-[#A65E46] text-[#EBDED4]" : "bg-[#02000D] text-[#EBDED4]/70 hover:text-[#EBDED4]"
                  }`}
                >
                  2-Player Pairs
                </button>
                <button
                  onClick={() => setComboSize(3)}
                  className={`px-3.5 py-1.5 font-semibold transition ${
                    comboSize === 3 ? "bg-[#A65E46] text-[#EBDED4]" : "bg-[#02000D] text-[#EBDED4]/70 hover:text-[#EBDED4]"
                  }`}
                >
                  3-Player Trios
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#D9AA90] mb-1">
                Minimum Shared Matches (n)
              </label>
              <select
                value={minMatches}
                onChange={(e) => setMinMatches(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg border border-[#D9AA90]/30 bg-[#02000D] text-xs font-mono font-semibold text-[#EBDED4] focus:outline-none focus:border-[#D9AA90]"
              >
                <option value={2}>n ≥ 2 matches (Exploratory)</option>
                <option value={3}>n ≥ 3 matches (Standard)</option>
                <option value={4}>n ≥ 4 matches (Stricter)</option>
                <option value={5}>n ≥ 5 matches (Core Pairs)</option>
              </select>
            </div>

            <div className="min-w-[220px]">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#D9AA90] mb-1">
                Anchor Player Filter (&ldquo;With Player X...&rdquo;)
              </label>
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-[#D9AA90]/30 bg-[#02000D] text-xs text-[#EBDED4] focus:outline-none focus:border-[#D9AA90]"
              >
                <option value="">All EPL Players (League-Wide)</option>
                {players.map((p) => (
                  <option key={p.player_id} value={p.player_id}>
                    {p.name} ({p.matches} mat)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="font-mono font-bold text-2xl text-[#A65E46] block">
              {comboData?.total_qualifying_combinations || 0}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[#D9AA90]">
              Qualifying Combinations
            </span>
          </div>
        </div>

        {/* Visual Combination Chart */}
        {topChartCombos.length > 0 && (
          <SimpleComparisonBarChart
            title={`Top ${comboSize}-Player Franchise Combinations – Win Percentage & Combined Runs`}
            definition={`Compares franchise win % when playing together and cumulative batting output (min n ≥ ${minMatches} shared matches).`}
            interpretation="Combinations with high shared-match win percentages highlight complementary historical squad cores; always inspect sample size (n) before drawing auction conclusions."
            data={topChartCombos}
            xKey="name"
            bars={[
              { dataKey: "win_pct", name: "Win % Together", color: EPL_PALETTE.peach },
              { dataKey: "runs", name: "Combined Runs", color: EPL_PALETTE.terracotta },
            ]}
            height={270}
          />
        )}

        <DataTable
          data={comboData?.combinations || []}
          columns={comboColumns}
          rowKey={(r) => r.player_ids.join("-")}
          title={`${comboSize}-Player Franchise Combination Matrix${comboLoading ? " (Updating...)" : ""}`}
          subtitle={comboData?.statistical_guardrail}
          searchable
          defaultSortKey="wins_together"
          highlightRow={(r) => r.win_pct_with >= 75 && r.matches_together >= 4}
        />
      </div>

      {/* SECTION C: STATISTICAL PATTERN DISCOVERY */}
      {discoveries && (
        <div className="space-y-4">
          <div className="border-b border-[#07203F] pb-2">
            <h2 className="font-serif text-2xl font-bold text-[#EBDED4] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#A65E46]" />
              <span>Empirical Tournament Hypothesis Testing</span>
            </h2>
            <p className="text-xs text-[#EBDED4]/70 mt-0.5">
              {discoveries.disclaimer}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(discoveries.statistical_discoveries || []).map((d: any) => (
              <div
                key={d.id}
                className="bg-[#07203F] text-[#EBDED4] rounded-xl border border-[#D9AA90]/25 shadow-md p-5 flex flex-col justify-between space-y-4 hover:border-[#D9AA90]/50 transition"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-[#02000D] border border-[#D9AA90]/30 text-[#D9AA90] font-bold">{d.id}</span>
                    <span className="text-[#A65E46] font-semibold">n = {d.sample_size} {d.sample_unit}</span>
                  </div>
                  <h3 className="font-serif text-base font-bold text-[#EBDED4] leading-snug">
                    {d.question}
                  </h3>
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="p-2.5 rounded-lg bg-[#02000D]/70 border-l-3 border-[#D9AA90]">
                      <span className="text-[10px] uppercase font-bold text-[#D9AA90] block">{d.metric_a_label}</span>
                      <span className="font-mono font-bold text-[#EBDED4]">{d.metric_a_value}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#02000D]/70 border-l-3 border-[#A65E46]">
                      <span className="text-[10px] uppercase font-bold text-[#D9AA90] block">{d.metric_b_label}</span>
                      <span className="font-mono font-bold text-[#A65E46]">{d.metric_b_value}</span>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-[#D9AA90]/15 space-y-1">
                  <span className="inline-block px-2 py-0.5 rounded bg-[#02000D] text-[#D9AA90] border border-[#D9AA90]/25 text-[10px] font-bold font-mono">
                    Confidence: {d.confidence}
                  </span>
                  <p className="text-[11px] text-[#EBDED4]/80 leading-relaxed">{d.interpretation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION B: CONSISTENT FINALISTS & RECURRING SEMIFINAL CORES */}
      {discoveries && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DataTable
            data={discoveries.consistent_finalists_and_champions || []}
            columns={[
              {
                key: "name",
                header: "Player",
                minWidth: "150px",
                render: (r) => (
                  <Link href={`/players/${r.player_id}`} className="font-bold text-[#EBDED4] hover:text-[#D9AA90] transition">
                    {r.name}
                  </Link>
                ),
              },
              { key: "titles_count", header: "Titles", align: "right", minWidth: "60px", render: (r) => <span className="font-mono font-bold text-[#A65E46]">{r.titles_count}</span> },
              { key: "finals_count", header: "Finals", align: "right", minWidth: "64px" },
              { key: "win_pct", header: "Career Win %", align: "right", minWidth: "90px", render: (r) => <span className="font-mono text-[#D9AA90] font-semibold">{r.win_pct}%</span> },
              {
                key: "final_seasons",
                header: "Final Seasons",
                sortable: false,
                minWidth: "110px",
                render: (r) => <span className="font-mono text-[11px] text-[#EBDED4]/80">{(r.final_seasons || []).join(", ")}</span>,
              },
            ]}
            rowKey={(r) => r.player_id}
            title="Multi-Season Finalists &amp; Championship Veterans"
            subtitle="Players appearing in 2+ EPL Finals or multiple title squads"
            defaultSortKey="titles_count"
          />

          <DataTable
            data={discoveries.recurring_semifinal_combinations || []}
            columns={[
              { key: "combination_label", header: "Semifinal Duo", minWidth: "180px", render: (r) => <span className="font-bold text-[#EBDED4]">{r.combination_label}</span> },
              { key: "semifinals_together", header: "SFs Together", align: "right", minWidth: "86px", render: (r) => <span className="font-mono font-bold text-[#A65E46]">{r.semifinals_together}</span> },
              { key: "semifinal_wins", header: "SF Wins", align: "right", minWidth: "74px" },
              {
                key: "seasons",
                header: "Seasons",
                sortable: false,
                minWidth: "96px",
                render: (r) => <span className="font-mono text-[11px] text-[#EBDED4]/80">{(r.seasons || []).join(", ")}</span>,
              },
              {
                key: "confidence_level",
                header: "Note",
                sortable: false,
                minWidth: "130px",
                render: (r) => <span className="text-[10px] text-[#D9AA90] font-mono">{r.confidence_level}</span>,
              },
            ]}
            rowKey={(r) => r.player_ids.join("-")}
            title="Recurring Semifinal Combinations"
            subtitle="Pairs appearing together in 2+ EPL Semifinals (small-sample exploratory)"
            defaultSortKey="semifinals_together"
          />
        </div>
      )}
    </div>
  );
}
