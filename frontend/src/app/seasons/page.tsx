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
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#A65E46] border-t-transparent rounded-full mb-4"></div>
        <p className="font-serif text-lg text-[#D9AA90]">Loading Cross-Season Comparative Trends...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="border-b border-[#07203F] pb-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs uppercase font-bold tracking-widest text-[#D9AA90] mb-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#A65E46]" />
              <span>Cross-Era Tournament Evolution</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#EBDED4]">
              Season Comparison
            </h1>
            <p className="text-sm text-[#EBDED4]/80 mt-1 max-w-xl">
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
            className="bg-[#07203F] text-[#EBDED4] rounded-xl p-6 border border-[#D9AA90]/25 shadow-lg space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#D9AA90]/20 pb-3">
              <span className="font-serif text-2xl font-bold text-[#EBDED4]">EPL {s.season}</span>
              <span className="text-xs font-semibold bg-[#A65E46] text-[#EBDED4] px-2.5 py-0.5 rounded-full shadow-sm">
                Champion: {s.champion}
              </span>
            </div>

            <div className="space-y-2 text-xs text-[#EBDED4]/90">
              <div className="flex justify-between py-1.5 border-b border-[#D9AA90]/10">
                <span className="text-[#D9AA90]">Total Matches</span>
                <span className="font-mono font-bold text-[#EBDED4]">{s.matches_count} matches</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#D9AA90]/10">
                <span className="text-[#D9AA90]">Average Score / 6 Ov</span>
                <span className="font-mono font-bold text-lg text-[#EBDED4]">{s.average_score} runs</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#D9AA90]/10">
                <span className="text-[#D9AA90]">Tournament Run Rate</span>
                <span className="font-mono font-bold text-[#D9AA90]">{s.run_rate} RPO</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#D9AA90]/10">
                <span className="text-[#D9AA90]">Total Wickets Fallen</span>
                <span className="font-mono font-bold text-[#EBDED4]">{s.total_wickets} wkts</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#D9AA90]/10">
                <span className="text-[#D9AA90]">Balls Per Wicket</span>
                <span className="font-mono font-bold text-[#EBDED4]">{s.balls_per_wicket} balls</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#D9AA90]/10">
                <span className="text-[#D9AA90]">Boundaries (4s / 6s)</span>
                <span className="font-mono font-bold text-[#EBDED4]">{s.total_fours} 4s / {s.total_sixes} 6s</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#D9AA90]">Competitiveness Index</span>
                <span className="font-mono font-bold text-[#A65E46]">{s.competitiveness_index}% close games</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cross-Season Observations */}
      <div className="bg-[#07203F] text-[#EBDED4] rounded-xl p-6 border border-[#D9AA90]/25 shadow-md space-y-3">
        <h3 className="font-serif text-lg font-bold text-[#EBDED4] flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#A65E46]" />
          <span>Key Takeaways Across Three Editions</span>
        </h3>
        <ul className="list-disc list-inside space-y-2 text-xs text-[#EBDED4]/85 leading-relaxed pl-1">
          <li><strong className="text-[#D9AA90]">Scoring Density:</strong> EPL 2025 produced the highest scoring totals in tournament history, with average scores rising from ~28 runs in 2023 to ~42 runs in 2025.</li>
          <li><strong className="text-[#D9AA90]">Competitive Parity:</strong> Every season has featured at least three 1-run or 1-wicket thrillers, demonstrating exceptionally balanced team owners&apos; drafting.</li>
          <li><strong className="text-[#D9AA90]">Super Over Milestone:</strong> Season 2025 marked the tournament&apos;s first-ever Super Over playoff tiebreaker in the Semifinal between Exotica Warriors and The Ultimates.</li>
        </ul>
      </div>
    </div>
  );
}
