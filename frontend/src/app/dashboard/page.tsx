"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy, Flame, Shield, TrendingUp, Users,
  ArrowRight, Sparkles, CheckCircle2, DollarSign,
  FlaskConical, Activity, History, Award, Zap, Crosshair
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { RatingBadge } from "@/components/RatingBadge";
import {
  SeasonRunsWicketsChart,
  RunRateBoundaryTrendChart,
  TeamWinDistributionChart,
  OutcomesSplitChart,
} from "@/components/EplCharts";
import { fetchApi } from "@/lib/api";

export default function OverviewPage() {
  const [data, setData] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [charts, setCharts] = useState<any>(null);
  const [records, setRecords] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [overviewRes, insightsRes, chartsRes, recordsRes] = await Promise.all([
          fetchApi("/api/overview"),
          fetchApi("/api/insights"),
          fetchApi("/api/advanced/charts/overview"),
          fetchApi("/api/analytics/records").catch(() => null),
        ]);
        setData(overviewRes);
        setInsights(insightsRes.all ? insightsRes.all.slice(0, 3) : []);
        setCharts(chartsRes);
        setRecords(recordsRes);
      } catch (err) {
        console.error("Error loading overview:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="inline-block animate-spin w-9 h-9 border-4 border-[#2563EB] dark:border-[#38BDF8] border-t-transparent rounded-full"></div>
        <p className="font-display text-lg text-[#101828] dark:text-[#F8FAFC]">Initializing EPL Cricket Intelligence Suite...</p>
      </div>
    );
  }

  const s = data?.summary;
  const topScore = records?.highest_individual_scores?.[0];
  const topSpell = records?.best_bowling_figures?.[0];

  return (
    <div className="space-y-10">
      {/* Top Release Telemetry Strip */}
      <div className="bg-[#F1F5F9] dark:bg-[#101828] text-[#101828] dark:text-[#F8FAFC] rounded-xl px-4 py-3 border border-[#E2E8F0] dark:border-[#334155] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm transition-colors duration-200">
        <div className="flex items-center space-x-2.5">
          <span className="px-2 py-0.5 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white font-mono text-[10px] font-bold tracking-wider">
            v1.3.0
          </span>
          <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">
            Active: 100-Pt Player Intelligence Scores (PIS), Situational Splits, 6-Over Milestones &amp; Live Auction Engine.
          </span>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <Link href="/analytics/records" className="text-[#2563EB] dark:text-[#38BDF8] hover:underline font-semibold inline-flex items-center gap-1 transition">
            <Award className="w-3.5 h-3.5" />
            <span>Records</span>
          </Link>
          <Link href="/intelligence-lab" className="text-[#2563EB] dark:text-[#38BDF8] hover:underline font-semibold inline-flex items-center gap-1 transition">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Intel Lab</span>
          </Link>
          <Link href="/changelog" className="text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC] underline inline-flex items-center gap-1 transition">
            <History className="w-3.5 h-3.5" />
            <span>Changelog</span>
          </Link>
        </div>
      </div>

      {/* Hero Editorial Header */}
      <div className="border-b border-[#E2E8F0] dark:border-[#334155] pb-8 pt-1">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#2563EB] dark:text-[#38BDF8] bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 px-3 py-1 rounded-full">
              <span>Historical Tournament Analytics</span>
              <span>•</span>
              <span>3 Seasons (2023 – 2025)</span>
              <span>•</span>
              <span>27 Verified Matches</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#101828] dark:text-[#F8FAFC] leading-tight">
              Exotica Premier League
            </h1>
            <p className="text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8] max-w-2xl leading-relaxed">
              Official player performance records, transparent statistical ratings, partnership &amp; fielding intelligence, and live auction operations built for six franchise owners.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/auction"
              className="inline-flex items-center space-x-2 bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB] text-white px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-sm"
            >
              <DollarSign className="w-4 h-4" />
              <span>Live Auction Room</span>
            </Link>
            <Link
              href="/analytics/records"
              className="inline-flex items-center space-x-2 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#101828] dark:text-[#F8FAFC] px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition shadow-sm"
            >
              <Award className="w-4 h-4 text-[#2563EB] dark:text-[#38BDF8]" />
              <span>Tournament Records</span>
            </Link>
            <Link
              href="/players"
              className="inline-flex items-center space-x-2 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#101828] dark:text-[#F8FAFC] px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition shadow-sm"
            >
              <Users className="w-4 h-4 text-[#2563EB] dark:text-[#38BDF8]" />
              <span>Players Directory</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Above-the-Fold KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Tournament Scope"
          value="3 Seasons"
          subtitle="27 Matches • 56 Innings"
          icon={<Trophy className="w-4 h-4" />}
        />
        <StatCard
          title="Canonical Players"
          value={s?.total_players || 73}
          subtitle="Tracked with permanent IDs"
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          title="Tournament Runs"
          value={s?.total_runs ? Number(s.total_runs).toLocaleString() : "2,423"}
          subtitle="Regulation innings scoring"
          icon={<Flame className="w-4 h-4" />}
        />
        <StatCard
          title="Tournament Wickets"
          value={s?.total_wickets || 147}
          subtitle="Regulation dismissals"
          icon={<Crosshair className="w-4 h-4" />}
        />
        <StatCard
          title="Highest Score"
          value={topScore ? topScore.display_score : "41*"}
          subtitle={topScore ? `${topScore.player_name} (${topScore.season})` : "Akshat Panchal (2025)"}
          icon={<Zap className="w-4 h-4" />}
          highlight
        />
        <StatCard
          title="Best Bowling Spell"
          value={topSpell ? topSpell.display_figures : "4/4"}
          subtitle={topSpell ? `${topSpell.player_name} (${topSpell.season})` : "Divyesh (2024)"}
          icon={<Shield className="w-4 h-4" />}
          highlight
        />
      </div>

      {/* Marquee Performer Highlight Banner */}
      {s?.best_overall_player && (
        <div className="bg-white dark:bg-[#151F32] rounded-xl p-6 border border-[#E2E8F0] dark:border-[#334155] shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#2563EB] dark:text-[#38BDF8] font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#0891B2] dark:text-[#22D3EE]" />
                <span>Tournament Marquee Player (#1 All-Rounder)</span>
              </div>
              <h2 className="font-display text-2xl lg:text-3xl font-bold text-[#101828] dark:text-[#F8FAFC]">
                {s.best_overall_player.name}
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] max-w-xl leading-relaxed">
                Leads all registered EPL cricketers with a composite 100-point Player Intelligence Score of {s.best_overall_player.rating}. Delivers verified top-tier volume with both bat and ball in high-pressure 6-over games.
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-xs text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-1 font-semibold">Overall Rating</div>
                <RatingBadge score={s.best_overall_player.rating} size="lg" />
              </div>
              <Link
                href={`/players/${s.best_overall_player.player_id}`}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB] text-white px-4 py-2.5 rounded-lg text-xs font-bold transition inline-flex items-center space-x-1.5 shadow-sm"
              >
                <span>Full Intelligence Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Visual Tournament Analytics Charts */}
      {charts && (
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#334155] pb-2.5">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#101828] dark:text-[#F8FAFC] tracking-tight">
                Visual Tournament Analytics
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                Dynamically computed from all 27 verified match scorecards with strict regulation and Super Over isolation.
              </p>
            </div>
            <Link href="/analytics/advanced" className="text-xs font-semibold text-[#2563EB] dark:text-[#38BDF8] hover:underline flex items-center transition">
              <span>Explore Partnerships &amp; Fielding</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SeasonRunsWicketsChart data={charts.season_trends || []} />
            <RunRateBoundaryTrendChart data={charts.season_trends || []} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <TeamWinDistributionChart data={charts.team_win_distribution || []} />
            <OutcomesSplitChart
              title="Toss Decision vs Match Outcome"
              definition="Share of all 27 EPL matches won by the toss winner vs toss loser."
              interpretation="Toss winners won 13 of 27 matches (48.1%), indicating no statistically meaningful toss advantage."
              data={charts.toss_outcomes || []}
            />
            <OutcomesSplitChart
              title="Batting First vs Chasing Outcomes"
              definition="Match victories achieved while chasing compared to defending a first-innings target."
              interpretation="Chasing teams won 15 of 27 matches (55.6%), showing a slight historical edge to batting second in 6-over contests."
              data={charts.innings_outcomes || []}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <OutcomesSplitChart
              title="Tournament Run Composition"
              definition="Breakdown of all regulation runs across running between wickets, boundaries (4s & 6s), and extras."
              interpretation="Underarm 6-over cricket relies heavily on running between wickets and extras alongside selective boundary bursts."
              data={charts.run_composition || []}
              valueKey="runs"
            />
            <OutcomesSplitChart
              title="Bowling Dot-Ball Pressure Ratio"
              definition="Verified legal deliveries resulting in dot balls (0s) vs scoring deliveries across all 277 spells."
              interpretation="Directly measured from scorecard bowling 0s (827 dot balls), demonstrating how dot-ball containment anchors defending totals."
              data={charts.bowling_pressure || []}
              valueKey="balls"
            />
          </div>
        </div>
      )}

      {/* Historical Seasons Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#334155] pb-2.5">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#101828] dark:text-[#F8FAFC] tracking-tight">
              Historical Season Archive
            </h2>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              Comparative analysis across EPL 2023, EPL 2024, and EPL 2025.
            </p>
          </div>
          <Link href="/seasons" className="text-xs font-semibold text-[#2563EB] dark:text-[#38BDF8] hover:underline flex items-center transition">
            <span>Detailed Season Comparison</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {data?.seasons?.map((season: any) => (
            <div
              key={season.season}
              className="bg-white dark:bg-[#151F32] rounded-xl p-5 border border-[#E2E8F0] dark:border-[#334155] shadow-sm hover:shadow-md transition space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-xl font-bold text-[#101828] dark:text-[#F8FAFC]">
                  EPL {season.season}
                </span>
                <span className="text-[11px] font-semibold bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#2563EB] dark:text-[#38BDF8] px-2.5 py-0.5 rounded-full font-mono">
                  {season.matches_count} Matches
                </span>
              </div>

              <div className="space-y-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
                <div className="flex justify-between py-1 border-b border-[#E2E8F0] dark:border-[#334155]">
                  <span>Tournament Champion</span>
                  <span className="font-bold text-[#101828] dark:text-[#F8FAFC]">{season.champion}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0] dark:border-[#334155]">
                  <span>Average Innings Total</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{season.average_score} runs</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0] dark:border-[#334155]">
                  <span>Tournament Run Rate</span>
                  <span className="font-mono font-bold text-[#2563EB] dark:text-[#38BDF8]">{season.run_rate} RPO</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Total Runs Scored</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{season.total_runs} runs</span>
                </div>
              </div>

              <Link
                href="/seasons"
                className="block text-center text-xs font-semibold text-[#2563EB] dark:text-[#38BDF8] bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 py-2 rounded-lg border border-blue-200 dark:border-blue-800/50 transition"
              >
                Inspect Season Records →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Automated Tournament Insights Preview */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#334155] pb-2.5">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#2563EB] dark:text-[#38BDF8]" />
            <h2 className="font-display text-2xl font-bold text-[#101828] dark:text-[#F8FAFC] tracking-tight">
              Automated Tournament Intelligence
            </h2>
          </div>
          <Link href="/insights" className="text-xs font-semibold text-[#2563EB] dark:text-[#38BDF8] hover:underline flex items-center transition">
            <span>Explore All 16 Insights</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {insights.map((item, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#151F32] rounded-xl p-5 border border-[#E2E8F0] dark:border-[#334155] shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#2563EB] dark:text-[#38BDF8] font-mono">
                  {item.category}
                </span>
                <h3 className="font-display text-lg font-bold text-[#101828] dark:text-[#F8FAFC] mt-1 mb-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                  {item.short_explanation}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E2E8F0] dark:border-[#334155] flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                <span>{item.season_references}</span>
                <span className="flex items-center space-x-1 font-medium text-[#0891B2] dark:text-[#22D3EE]">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
