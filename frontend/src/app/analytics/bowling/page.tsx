"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, ArrowUp, ArrowDown } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { RatingBadge } from "@/components/RatingBadge";
import { ExportButtonsBar } from "@/components/ExportButtonsBar";

export default function BowlingAnalyticsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("wickets");
  const [minBalls, setMinBalls] = useState(6);

  useEffect(() => {
    async function loadBowling() {
      try {
        const res = await fetchApi(`/api/analytics/bowling?min_balls=${minBalls}&sort_by=${sortBy}`);
        setData(res.leaderboard || []);
      } catch (err) {
        console.error("Error loading bowling:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBowling();
  }, [sortBy, minBalls]);

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="border-b border-[#07203F] pb-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs uppercase font-bold tracking-widest text-[#D9AA90] mb-1.5">
              <Shield className="w-3.5 h-3.5 text-[#A65E46]" />
              <span>Underarm Bowling Intelligence &amp; Suppression Metrics</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#EBDED4]">
              Bowling Analytics
            </h1>
            <p className="text-sm text-[#EBDED4]/80 mt-1 max-w-xl">
              Verified economy rates, bowling strike rates, dot ball percentages, and multi-wicket spells across historical seasons.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-[#D9AA90]">Min Deliveries:</span>
            <select
              value={minBalls}
              onChange={(e) => setMinBalls(parseInt(e.target.value))}
              aria-label="Filter by Minimum Deliveries"
              className="px-3 py-1.5 rounded-lg border border-[#D9AA90]/30 bg-[#07203F] text-[#EBDED4] focus:outline-none focus:border-[#D9AA90] font-mono"
            >
              <option value="6">1+ Overs (6+ balls)</option>
              <option value="18">3+ Overs (18+ balls)</option>
              <option value="30">5+ Overs (30+ balls)</option>
            </select>
            <ExportButtonsBar sortBy="wickets" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-[#A65E46] border-t-transparent rounded-full mb-3"></div>
          <p className="font-serif text-lg text-[#D9AA90]">Computing Bowling Analytics...</p>
        </div>
      ) : (
        <div 
          tabIndex={0} 
          role="region" 
          aria-label="Bowling Analytics Leaderboard Table"
          className="table-wrapper bg-[#07203F]/80 backdrop-blur rounded-xl border border-[#D9AA90]/20 shadow-lg overflow-hidden"
        >
          <table className="w-full text-left table-editorial table-sticky-col">
            <thead className="bg-[#02000D] text-[#EBDED4] border-b border-[#D9AA90]/20">
              <tr>
                <th scope="col" className="p-3">Rank &amp; Bowler</th>
                <th scope="col" className="p-3">Overs</th>
                <th scope="col" className="p-3" aria-sort={sortBy === "wickets" ? "descending" : "none"}>
                  <button
                    type="button"
                    onClick={() => setSortBy("wickets")}
                    className={`flex items-center space-x-1 uppercase text-left transition ${sortBy === "wickets" ? "text-[#D9AA90] font-bold" : "text-[#EBDED4] hover:text-[#D9AA90]"}`}
                  >
                    <span>Wickets</span>
                  </button>
                </th>
                <th scope="col" className="p-3" aria-sort={sortBy === "economy" ? "descending" : "none"}>
                  <button
                    type="button"
                    onClick={() => setSortBy("economy")}
                    className={`flex items-center space-x-1 uppercase text-left transition ${sortBy === "economy" ? "text-[#D9AA90] font-bold" : "text-[#EBDED4] hover:text-[#D9AA90]"}`}
                  >
                    <span>Economy (RPO)</span>
                  </button>
                </th>
                <th scope="col" className="p-3" aria-sort={sortBy === "strike_rate" ? "descending" : "none"}>
                  <button
                    type="button"
                    onClick={() => setSortBy("strike_rate")}
                    className={`flex items-center space-x-1 uppercase text-left transition ${sortBy === "strike_rate" ? "text-[#D9AA90] font-bold" : "text-[#EBDED4] hover:text-[#D9AA90]"}`}
                  >
                    <span>Strike Rate</span>
                  </button>
                </th>
                <th scope="col" className="p-3" aria-sort={sortBy === "dot_pct" ? "descending" : "none"}>
                  <button
                    type="button"
                    onClick={() => setSortBy("dot_pct")}
                    className={`flex items-center space-x-1 uppercase text-left transition ${sortBy === "dot_pct" ? "text-[#D9AA90] font-bold" : "text-[#EBDED4] hover:text-[#D9AA90]"}`}
                  >
                    <span>Dot Ball %</span>
                  </button>
                </th>
                <th scope="col" className="p-3" aria-sort={sortBy === "rating" ? "descending" : "none"}>
                  <button
                    type="button"
                    onClick={() => setSortBy("rating")}
                    className={`flex items-center space-x-1 uppercase text-left transition ${sortBy === "rating" ? "text-[#D9AA90] font-bold" : "text-[#EBDED4] hover:text-[#D9AA90]"}`}
                  >
                    <span>Bowl Rating</span>
                  </button>
                </th>
                <th scope="col" className="p-3 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9AA90]/10 text-xs text-[#EBDED4]">
              {data.map((p, idx) => (
                <tr key={p.player_id} className="hover:bg-[#02000D]/60 transition">
                  <td className="p-3 font-medium">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[11px] text-[#D9AA90]/70 w-5">#{idx + 1}</span>
                      <div>
                        <Link href={`/players/${p.player_id}`} className="hover:text-[#D9AA90] transition font-bold text-sm text-[#EBDED4]">
                          {p.name}
                        </Link>
                        <span className="text-[10px] text-[#D9AA90]/70 block font-mono">{p.primary_role}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-[#EBDED4]/90">{p.overs} ov</td>
                  <td className="p-3 font-mono font-bold text-sm text-[#A65E46]">{p.wickets}</td>
                  <td className="p-3 font-mono font-bold text-[#EBDED4]">{p.economy.toFixed(2)}</td>
                  <td className="p-3 font-mono text-[#EBDED4]/90">{p.bowling_strike_rate ? `${p.bowling_strike_rate.toFixed(1)} b/w` : "N/A"}</td>
                  <td className="p-3 font-mono text-[#D9AA90] font-semibold">{p.dot_ball_percentage.toFixed(1)}%</td>
                  <td className="p-3">
                    <RatingBadge score={p.ratings.bowling_rating} size="sm" />
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/players/${p.player_id}`}
                      className="text-xs font-semibold text-[#D9AA90] hover:text-[#EBDED4] transition"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
