"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy, Flame, Shield, TrendingUp, Users,
  ArrowRight, Sparkles, CheckCircle2, DollarSign,
  FlaskConical, Activity, History
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [overviewRes, insightsRes, chartsRes] = await Promise.all([
          fetchApi("/api/overview"),
          fetchApi("/api/insights"),
          fetchApi("/api/advanced/charts/overview"),
        ]);
        setData(overviewRes);
        setInsights(insightsRes.all ? insightsRes.all.slice(0, 3) : []);
        setCharts(chartsRes);
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
      <div className="py-20 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#07203F] border-t-transparent rounded-full mb-4"></div>
        <p className="font-serif text-lg text-[#07203F]">Loading Historical EPL Intelligence...</p>
      </div>
    );
  }

  const s = data?.summary;

  return (
    <div className="space-y-10">
      {/* Version 1.1 Editorial Release Strip */}
      <div className="bg-[#02000D] text-[#EBDED4] rounded-lg px-4 py-2.5 border border-[#D9AA90]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded bg-[#A65E46] text-[#EBDED4] font-mono text-[10px] font-bold">
            v1.1.0
          </span>
          <span className="text-[#EBDED4]/90">
            New: Partnership &amp; Fielding Analytics, EPL Intelligence Lab, Chromium PDF Exports &amp; Auction Setup Wizard.
          </span>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <Link href="/analytics/advanced" className="text-[#D9AA90] hover:underline font-semibold inline-flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" />
            <span>Advanced Analytics</span>
          </Link>
          <Link href="/intelligence-lab" className="text-[#D9AA90] hover:underline font-semibold inline-flex items-center gap-1">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Intel Lab</span>
          </Link>
          <Link href="/changelog" className="text-[#EBDED4]/80 hover:text-[#D9AA90] underline inline-flex items-center gap-1">
            <History className="w-3.5 h-3.5" />
            <span>What&apos;s New</span>
          </Link>
        </div>
      </div>

      {/* Editorial Hero Header */}
      <div className="border-b border-[#07203F]/20 pb-8 pt-1">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#A65E46] mb-2 bg-[#A65E46]/10 px-2.5 py-1 rounded">
              <span>Historical Tournament Analytics</span>
              <span>•</span>
              <span>3 Seasons (2023 – 2025)</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#02000D] leading-tight">
              Exotica Premier League
            </h1>
            <p className="text-sm sm:text-base text-[#07203F]/80 max-w-2xl mt-2 leading-relaxed">
              Official player performance records, transparent statistical ratings, partnership &amp; fielding intelligence, and end-to-end auction management built for six franchise owners.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/auction"
              className="inline-flex items-center space-x-2 bg-[#A65E46] text-[#EBDED4] px-4 py-2 rounded text-xs font-semibold hover:bg-[#A65E46]/90 transition shadow-sm"
            >
              <DollarSign className="w-4 h-4" />
              <span>Auction Setup &amp; Live Room</span>
            </Link>
            <Link
              href="/players"
              className="inline-flex items-center space-x-2 bg-[#07203F] text-[#EBDED4] px-4 py-2 rounded text-xs font-semibold hover:bg-[#07203F]/90 transition shadow-sm"
            >
              <Users className="w-4 h-4" />
              <span>Player Directory</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Top Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tournament History"
          value={`${s?.total_seasons || 3} Seasons`}
          subtitle={`${s?.total_matches || 27} Completed matches across 2023, 2024, 2025`}
          icon={<Trophy className="w-5 h-5" />}
        />
        <StatCard
          title="All-Time Leading Scorer"
          value={s?.highest_run_scorer?.name || "N/A"}
          subtitle={`${s?.highest_run_scorer?.runs || 0} Runs scored in regulation innings`}
          icon={<Flame className="w-5 h-5" />}
          trend="Highest aggregate volume"
        />
        <StatCard
          title="All-Time Leading Bowler"
          value={s?.highest_wicket_taker?.name || "N/A"}
          subtitle={`${s?.highest_wicket_taker?.wickets || 0} Regulation wickets taken`}
          icon={<Shield className="w-5 h-5" />}
          trend="Tournament strike weapon"
        />
        <StatCard
          title="Dominant Franchise"
          value={s?.most_successful_team?.name || "N/A"}
          subtitle={`${s?.most_successful_team?.wins || 0} Match victories recorded`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend="Highest winning percentage"
        />
      </div>

      {/* Marquee Performer Highlight Banner */}
      {s?.best_overall_player && (
        <div className="bg-[#07203F] text-[#EBDED4] rounded-lg p-6 border border-[#D9AA90]/20 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-widest text-[#D9AA90] font-semibold">
                Tournament Marquee Player (#1 All-Rounder)
              </div>
              <h2 className="font-serif text-2xl lg:text-3xl font-bold text-[#EBDED4]">
                {s.best_overall_player.name}
              </h2>
              <p className="text-xs text-[#EBDED4]/80 max-w-xl leading-relaxed">
                Leads all registered EPL cricketers with a composite 100-point rating of {s.best_overall_player.rating}. Delivers verified top-tier volume with both bat and ball in high-pressure 6-over games.
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-xs text-[#D9AA90] uppercase tracking-wider mb-1">Overall Rating</div>
                <RatingBadge score={s.best_overall_player.rating} size="lg" />
              </div>
              <Link
                href={`/players/${s.best_overall_player.player_id}`}
                className="bg-[#A65E46] text-[#EBDED4] px-4 py-2.5 rounded text-xs font-semibold hover:bg-[#A65E46]/90 transition inline-flex items-center space-x-1"
              >
                <span>Full Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6A: VISUAL TOURNAMENT ANALYTICS CHARTS */}
      {charts && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#07203F]/20 pb-2">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#02000D]">
                Visual Tournament Analytics
              </h2>
              <p className="text-xs text-[#07203F]/70">
                Dynamically computed from all 27 verified match scorecards (regulation innings segregated from Super Overs).
              </p>
            </div>
            <Link href="/analytics/advanced" className="text-xs font-semibold text-[#A65E46] hover:underline flex items-center">
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
        <div className="flex items-center justify-between border-b border-[#07203F]/20 pb-2">
          <h2 className="font-serif text-2xl font-bold text-[#02000D]">
            Historical Season Archive
          </h2>
          <Link href="/seasons" className="text-xs font-semibold text-[#A65E46] hover:underline flex items-center">
            <span>Detailed Season Comparison</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {data?.seasons?.map((season: any) => (
            <div
              key={season.season}
              className="bg-white/80 backdrop-blur rounded-lg p-5 border border-[#07203F]/15 shadow-sm space-y-4 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-serif text-xl font-bold text-[#07203F]">
                  EPL {season.season}
                </span>
                <span className="text-[11px] font-semibold bg-[#07203F] text-[#EBDED4] px-2 py-0.5 rounded">
                  {season.matches_count} Matches
                </span>
              </div>

              <div className="space-y-2 text-xs text-[#07203F]/80">
                <div className="flex justify-between py-1 border-b border-[#07203F]/10">
                  <span className="text-[#07203F]/60">Tournament Champion</span>
                  <span className="font-semibold text-[#A65E46]">{season.champion}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#07203F]/10">
                  <span className="text-[#07203F]/60">Average Innings Total</span>
                  <span className="font-mono font-bold text-[#02000D]">{season.average_score} runs</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#07203F]/10">
                  <span className="text-[#07203F]/60">Tournament Run Rate</span>
                  <span className="font-mono font-bold text-[#02000D]">{season.run_rate} RPO</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#07203F]/60">Total Runs Scored</span>
                  <span className="font-mono font-bold text-[#02000D]">{season.total_runs} runs</span>
                </div>
              </div>

              <Link
                href="/seasons"
                className="block text-center text-xs font-semibold text-[#07203F] bg-[#EBDED4] hover:bg-[#D9AA90]/40 py-1.5 rounded transition"
              >
                Inspect Season Records →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Editorial Tournament Insights Preview */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-[#07203F]/20 pb-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#A65E46]" />
            <h2 className="font-serif text-2xl font-bold text-[#02000D]">
              Automated Tournament Intelligence
            </h2>
          </div>
          <Link href="/insights" className="text-xs font-semibold text-[#A65E46] hover:underline flex items-center">
            <span>Explore All 16 Insights</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {insights.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#07203F] text-[#EBDED4] rounded-lg p-5 border border-[#D9AA90]/20 shadow-sm flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D9AA90]">
                  {item.category}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#EBDED4] mt-1 mb-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-[#EBDED4]/80 leading-relaxed">
                  {item.short_explanation}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#D9AA90]/20 flex items-center justify-between text-[11px] text-[#D9AA90]">
                <span>{item.season_references}</span>
                <span className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-[#D9AA90]" />
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
