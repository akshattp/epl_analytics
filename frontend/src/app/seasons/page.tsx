"use client";

import { useEffect, useState } from "react";
import { Trophy, TrendingUp, BarChart3, Activity } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSeasons() {
      try {
        const res = await fetchApi("/api/seasons");
        setSeasons(res.seasons || []);
      } catch (err) {
        console.error("Error loading seasons:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSeasons();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full mb-4"></div>
        <p className="font-display text-lg text-[#64748B] dark:text-[#94A3B8]">Loading Cross-Season Comparative Trends...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="border-b border-[#E2E8F0] dark:border-[#334155] pb-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs uppercase font-bold tracking-widest text-[#2563EB] dark:text-[#3B82F6] mb-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Cross-Era Tournament Evolution</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#101828] dark:text-[#F8FAFC]">
              Season Comparison
            </h1>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-xl">
              Comparative analysis across EPL 2023, EPL 2024, and EPL 2025: scoring rate changes, boundary density, and competitive balance.
            </p>
          </div>
        </div>
      </div>

      {/* Season Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {seasons.map((s) => (
          <div 
            key={s.season}
            className="bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] rounded-xl p-6 border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#334155] pb-3">
              <span className="font-display text-2xl font-bold text-[#101828] dark:text-[#F8FAFC]">EPL {s.season}</span>
              <span className="text-xs font-semibold bg-[#2563EB] text-white px-2.5 py-0.5 rounded-full shadow-sm">
                Champion: {s.champion}
              </span>
            </div>

            <div className="space-y-2 text-xs text-[#101828] dark:text-[#F8FAFC]">
              <div className="flex justify-between py-1.5 border-b border-[#E2E8F0] dark:border-[#334155]">
                <span className="text-[#64748B] dark:text-[#94A3B8]">Total Matches</span>
                <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{s.matches_count} matches</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E2E8F0] dark:border-[#334155]">
                <span className="text-[#64748B] dark:text-[#94A3B8]">Average Score / 6 Ov</span>
                <span className="font-mono font-bold text-lg text-[#101828] dark:text-[#F8FAFC]">{s.average_score} runs</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E2E8F0] dark:border-[#334155]">
                <span className="text-[#64748B] dark:text-[#94A3B8]">Tournament Run Rate</span>
                <span className="font-mono font-bold text-[#0891B2] dark:text-[#22D3EE]">{s.run_rate} RPO</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E2E8F0] dark:border-[#334155]">
                <span className="text-[#64748B] dark:text-[#94A3B8]">Total Wickets Fallen</span>
                <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{s.total_wickets} wkts</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E2E8F0] dark:border-[#334155]">
                <span className="text-[#64748B] dark:text-[#94A3B8]">Balls Per Wicket</span>
                <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{s.balls_per_wicket} balls</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E2E8F0] dark:border-[#334155]">
                <span className="text-[#64748B] dark:text-[#94A3B8]">Boundaries (4s / 6s)</span>
                <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{s.total_fours} 4s / {s.total_sixes} 6s</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#64748B] dark:text-[#94A3B8]">Competitiveness Index</span>
                <span className="font-mono font-bold text-[#2563EB] dark:text-[#3B82F6]">{s.competitiveness_index}% close games</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cross-Season Observations */}
      <div className="bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] rounded-xl p-6 border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-3">
        <h3 className="font-display text-lg font-bold text-[#101828] dark:text-[#F8FAFC] flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
          <span>Key Takeaways Across Three Editions</span>
        </h3>
        <ul className="list-disc list-inside space-y-2 text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed pl-1">
          <li><strong className="text-[#101828] dark:text-[#F8FAFC]">Scoring Density:</strong> EPL 2025 produced the highest scoring totals in tournament history, with average scores rising from ~28 runs in 2023 to ~42 runs in 2025.</li>
          <li><strong className="text-[#101828] dark:text-[#F8FAFC]">Competitive Parity:</strong> Every season has featured at least three 1-run or 1-wicket thrillers, demonstrating exceptionally balanced team owners&apos; drafting.</li>
          <li><strong className="text-[#101828] dark:text-[#F8FAFC]">Super Over Milestone:</strong> Season 2025 marked the tournament&apos;s first-ever Super Over playoff tiebreaker in the Semifinal between Exotica Warriors and The Ultimates.</li>
        </ul>
      </div>
    </div>
  );
}
