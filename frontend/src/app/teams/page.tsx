"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, ArrowRight, Trophy, TrendingUp, Users } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import {
  TeamWinDistributionChart,
  SimpleComparisonBarChart,
  EPL_PALETTE,
} from "@/components/EplCharts";

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [chartTeams, setChartTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeams() {
      try {
        const [res, chRes] = await Promise.all([
          fetchApi("/api/teams"),
          fetchApi("/api/advanced/charts/teams"),
        ]);
        setTeams(res.teams || []);
        setChartTeams(chRes.teams || []);
      } catch (err) {
        console.error("Error loading teams:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTeams();
  }, []);

  const columns: DataTableColumn<any>[] = [
    {
      key: "team_name",
      header: "Franchise Team",
      minWidth: "175px",
      render: (t) => <span className="font-display font-bold text-sm text-[#111318] dark:text-[#F1EBDD]">{t.team_name}</span>,
    },
    {
      key: "seasons",
      header: "Season(s)",
      sortable: false,
      minWidth: "95px",
      render: (t) => <span className="font-mono text-[11px] text-[#5C584E] dark:text-[#A8A296]">{(t.seasons || []).join(", ")}</span>,
    },
    { key: "matches_played", header: "Played", align: "right", minWidth: "70px" },
    {
      key: "matches_won",
      header: "Won",
      align: "right",
      minWidth: "66px",
      render: (t) => <span className="font-mono font-bold text-[#FF4B35]">{t.matches_won}</span>,
    },
    { key: "matches_lost", header: "Lost", align: "right", minWidth: "66px" },
    {
      key: "win_percentage",
      header: "Win %",
      align: "right",
      minWidth: "78px",
      render: (t) => <span className="font-mono font-bold text-[#111318] dark:text-[#F1EBDD]">{Number(t.win_percentage || 0).toFixed(1)}%</span>,
    },
    { key: "total_runs_scored", header: "Runs For", align: "right", minWidth: "84px" },
    { key: "total_runs_conceded", header: "Runs Against", align: "right", minWidth: "96px" },
    {
      key: "batting_run_rate",
      header: "Bat RR",
      tooltip: "Batting Run Rate (Runs per Over)",
      align: "right",
      minWidth: "78px",
      render: (t) => <span className="font-mono text-[#111318] dark:text-[#F1EBDD]">{Number(t.batting_run_rate || 0).toFixed(2)}</span>,
    },
    {
      key: "bowling_economy",
      header: "Bowl Econ",
      tooltip: "Bowling Economy Rate (Runs conceded per Over)",
      align: "right",
      minWidth: "86px",
      render: (t) => <span className="font-mono text-[#111318] dark:text-[#F1EBDD]">{Number(t.bowling_economy || 0).toFixed(2)}</span>,
    },
    {
      key: "net_run_rate",
      header: "NRR",
      tooltip: "Net Run Rate",
      align: "right",
      minWidth: "78px",
      render: (t) => (
        <span className={`font-mono font-bold ${t.net_run_rate >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-[#FF4B35]"}`}>
          {t.net_run_rate > 0 ? `+${Number(t.net_run_rate).toFixed(2)}` : Number(t.net_run_rate).toFixed(2)}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#FF4B35] border-t-transparent rounded-full"></div>
        <p className="font-display text-lg text-[#111318] dark:text-[#F1EBDD]">Aggregating Historical Franchise Analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-[#DDD5C3] dark:border-[#2A2E38] pb-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-semibold tracking-wider text-[#FF4B35] mb-1 font-mono">
              Historical Team Performance &amp; Net Run Rates
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111318] dark:text-[#F1EBDD]">
              Team Analytics
            </h1>
            <p className="text-sm text-[#5C584E] dark:text-[#A8A296] mt-1 max-w-xl leading-relaxed">
              Win records, batting unit outputs, bowling discipline, championship progression, and net run rates across all EPL franchise campaigns (2023–2025).
            </p>
          </div>
          <Link
            href="/intelligence-lab"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#FAF7F0] dark:bg-[#181A20] border border-[#DDD5C3] dark:border-[#2A2E38] text-[#111318] dark:text-[#F1EBDD] hover:border-[#FF4B35] text-xs font-semibold transition shadow-sm"
          >
            <Shield className="w-3.5 h-3.5 text-[#FF4B35]" />
            <span>Explore Team Combinations in Intel Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Team Visual Analytics Charts */}
      {chartTeams.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <TeamWinDistributionChart data={chartTeams.slice(0, 10)} />
          <SimpleComparisonBarChart
            title="Batting Run Rate vs Bowling Economy (Top 10 Franchises)"
            definition="Compares offensive scoring rate (RPO) against bowling runs conceded per over."
            interpretation="Teams whose batting run rate substantially exceeds their bowling economy sustain positive NRR and deep playoff runs."
            data={chartTeams.slice(0, 10).map((t) => ({
              team: t.team.length > 12 ? t.team.slice(0, 12) + "…" : t.team,
              "Bat RR": t.batting_rr,
              "Bowl Econ": t.bowling_econ,
            }))}
            xKey="team"
            bars={[
              { dataKey: "Bat RR", name: "Batting RR", color: EPL_PALETTE.blue },
              { dataKey: "Bowl Econ", name: "Bowling Econ", color: EPL_PALETTE.cyan },
            ]}
            height={280}
          />
        </div>
      )}

      {chartTeams.length > 0 && (
        <SimpleComparisonBarChart
          title="Playoff & Championship Progression by Franchise"
          definition="Semifinal appearances, Final appearances, and EPL Championships won across 2023–2025."
          interpretation="Identifies franchises that consistently converted league campaigns into knockout victories and titles."
          data={chartTeams.filter((t) => t.semifinals > 0 || t.finals > 0 || t.titles > 0)}
          xKey="team"
          bars={[
            { dataKey: "semifinals", name: "Semifinals", color: EPL_PALETTE.cyan },
            { dataKey: "finals", name: "Finals", color: "#8B5CF6" },
            { dataKey: "titles", name: "Championships", color: EPL_PALETTE.blue },
          ]}
          height={250}
        />
      )}

      <DataTable
        data={teams}
        columns={columns}
        rowKey={(t, i) => `${t.team_name}-${i}`}
        title={`Franchise Performance Matrix (${teams.length} Teams)`}
        subtitle="Sticky headers & pinned Franchise column • Click any metric heading to sort"
        searchable
        defaultSortKey="win_percentage"
        highlightRow={(t) => t.win_percentage >= 75}
      />
    </div>
  );
}
