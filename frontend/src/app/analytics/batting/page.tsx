"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { RatingBadge } from "@/components/RatingBadge";
import { ExportButtonsBar } from "@/components/ExportButtonsBar";

export default function BattingAnalyticsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("runs");
  const [minInnings, setMinInnings] = useState(1);

  useEffect(() => {
    async function loadBatting() {
      try {
        const res = await fetchApi(`/api/analytics/batting?min_innings=${minInnings}&sort_by=${sortBy}`);
        setData(res.leaderboard || []);
      } catch (err) {
        console.error("Error loading batting:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBatting();
  }, [sortBy, minInnings]);

  return (
    <div className="space-y-8">
      <div className="border-b border-[#07203F]/20 pb-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-semibold tracking-wider text-[#A65E46] mb-1">
              Underarm Batting Performance Intelligence
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#02000D]">
              Batting Analytics
            </h1>
            <p className="text-sm text-[#07203F]/80 mt-1 max-w-xl">
              Deep scoring metrics, boundary percentages, scoring velocity, and consistency indices for all tournament batsmen.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-[#07203F]">Min Innings:</span>
            <select
              value={minInnings}
              onChange={(e) => setMinInnings(parseInt(e.target.value))}
              aria-label="Filter by Minimum Innings"
              className="px-2.5 py-1 rounded border border-[#07203F]/20 bg-white text-[#07203F]"
            >
              <option value="1">1+ Innings</option>
              <option value="3">3+ Innings</option>
              <option value="5">5+ Innings (Qualified)</option>
            </select>
            <ExportButtonsBar sortBy="runs" />
          </div>
        </div>
      </div>

      <div 
        tabIndex={0} 
        role="region" 
        aria-label="Batting Analytics Leaderboard Table"
        className="table-wrapper bg-white/90 backdrop-blur rounded-lg border border-[#07203F]/15 shadow-sm"
      >
        <table className="w-full text-left table-editorial table-sticky-col">
          <thead className="bg-[#07203F] text-[#EBDED4]">
            <tr>
              <th scope="col" className="p-3">Rank & Batsman</th>
              <th scope="col" className="p-3">Innings</th>
              <th scope="col" className="p-3">
                <button
                  type="button"
                  onClick={() => setSortBy("runs")}
                  className={`flex items-center space-x-1 uppercase text-left ${sortBy === "runs" ? "text-[#D9AA90]" : ""}`}
                >
                  <span>Runs</span>
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
                  onClick={() => setSortBy("batting_average")}
                  className={`flex items-center space-x-1 uppercase text-left ${sortBy === "batting_average" ? "text-[#D9AA90]" : ""}`}
                >
                  <span>Average</span>
                </button>
              </th>
              <th scope="col" className="p-3">
                <button
                  type="button"
                  onClick={() => setSortBy("boundary_pct")}
                  className={`flex items-center space-x-1 uppercase text-left ${sortBy === "boundary_pct" ? "text-[#D9AA90]" : ""}`}
                >
                  <span>Boundary %</span>
                </button>
              </th>
              <th scope="col" className="p-3">
                <button
                  type="button"
                  onClick={() => setSortBy("rating")}
                  className={`flex items-center space-x-1 uppercase text-left ${sortBy === "rating" ? "text-[#D9AA90]" : ""}`}
                >
                  <span>Bat Rating</span>
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
                <td className="p-3 font-mono">{p.innings}</td>
                <td className="p-3 font-mono font-bold text-sm text-[#02000D]">{p.total_runs}</td>
                <td className="p-3 font-mono font-bold text-[#A65E46]">{p.strike_rate.toFixed(1)}</td>
                <td className="p-3 font-mono">{p.batting_average.toFixed(2)}</td>
                <td className="p-3 font-mono">{p.boundary_percentage.toFixed(1)}%</td>
                <td className="p-3">
                  <RatingBadge score={p.ratings.batting_rating} size="sm" />
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
