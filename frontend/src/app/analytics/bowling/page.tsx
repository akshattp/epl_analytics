"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
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
      <div className="border-b border-[#07203F]/20 pb-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-semibold tracking-wider text-[#A65E46] mb-1">
              Underarm Bowling Intelligence & Suppression Metrics
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#02000D]">
              Bowling Analytics
            </h1>
            <p className="text-sm text-[#07203F]/80 mt-1 max-w-xl">
              Verified economy rates, bowling strike rates, dot ball percentages, and multi-wicket spells across historical seasons.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-[#07203F]">Min Deliveries:</span>
            <select
              value={minBalls}
              onChange={(e) => setMinBalls(parseInt(e.target.value))}
              aria-label="Filter by Minimum Deliveries"
              className="px-2.5 py-1 rounded border border-[#07203F]/20 bg-white text-[#07203F]"
            >
              <option value="6">1+ Overs (6+ balls)</option>
              <option value="18">3+ Overs (18+ balls)</option>
              <option value="30">5+ Overs (30+ balls)</option>
            </select>
            <ExportButtonsBar sortBy="wickets" />
          </div>
        </div>
      </div>

      <div 
        tabIndex={0} 
        role="region" 
        aria-label="Bowling Analytics Leaderboard Table"
        className="table-wrapper bg-white/90 backdrop-blur rounded-lg border border-[#07203F]/15 shadow-sm"
      >
        <table className="w-full text-left table-editorial table-sticky-col">
          <thead className="bg-[#07203F] text-[#EBDED4]">
            <tr>
              <th scope="col" className="p-3">Rank & Bowler</th>
              <th scope="col" className="p-3">Overs</th>
              <th scope="col" className="p-3">
                <button
                  type="button"
                  onClick={() => setSortBy("wickets")}
                  className={`flex items-center space-x-1 uppercase text-left ${sortBy === "wickets" ? "text-[#D9AA90]" : ""}`}
                >
                  <span>Wickets</span>
                </button>
              </th>
              <th scope="col" className="p-3">
                <button
                  type="button"
                  onClick={() => setSortBy("economy")}
                  className={`flex items-center space-x-1 uppercase text-left ${sortBy === "economy" ? "text-[#D9AA90]" : ""}`}
                >
                  <span>Economy (RPO)</span>
                </button>
              </th>
              <th scope="col" className="p-3">
                <button
                  type="button"
                  onClick={() => setSortBy("strike_rate")}
                  className={`flex items-center space-x-1 uppercase text-left ${sortBy === "strike_rate" ? "text-[#D9AA90]" : ""}`}
                >
                  <span>Strike Rate</span>
                </button>
              </th>
              <th scope="col" className="p-3">
                <button
                  type="button"
                  onClick={() => setSortBy("dot_pct")}
                  className={`flex items-center space-x-1 uppercase text-left ${sortBy === "dot_pct" ? "text-[#D9AA90]" : ""}`}
                >
                  <span>Dot Ball %</span>
                </button>
              </th>
              <th scope="col" className="p-3">
                <button
                  type="button"
                  onClick={() => setSortBy("rating")}
                  className={`flex items-center space-x-1 uppercase text-left ${sortBy === "rating" ? "text-[#D9AA90]" : ""}`}
                >
                  <span>Bowl Rating</span>
                </button>
              </th>
              <th scope="col" className="p-3 text-right">Profile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#07203F]/10 text-xs">
            {data.map((p, idx) => (
              <tr key={p.player_id} className="hover:bg-[#EBDED4]/40 transition">
                <td className="p-3 font-medium">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[11px] text-[#07203F]/50 w-5">#{idx + 1}</span>
                    <div>
                      <Link href={`/players/${p.player_id}`} className="hover:text-[#A65E46] transition font-bold text-sm text-[#07203F]">
                        {p.name}
                      </Link>
                      <span className="text-[10px] text-[#07203F]/50 block font-mono">{p.primary_role}</span>
                    </div>
                  </div>
                </td>
                <td className="p-3 font-mono">{p.overs} ov</td>
                <td className="p-3 font-mono font-bold text-sm text-[#A65E46]">{p.wickets}</td>
                <td className="p-3 font-mono font-bold text-[#02000D]">{p.economy.toFixed(2)}</td>
                <td className="p-3 font-mono">{p.bowling_strike_rate ? `${p.bowling_strike_rate.toFixed(1)} b/w` : "N/A"}</td>
                <td className="p-3 font-mono">{p.dot_ball_percentage.toFixed(1)}%</td>
                <td className="p-3">
                  <RatingBadge score={p.ratings.bowling_rating} size="sm" />
                </td>
                <td className="p-3 text-right">
                  <Link
                    href={`/players/${p.player_id}`}
                    className="text-xs font-semibold text-[#07203F] hover:text-[#A65E46] transition"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
