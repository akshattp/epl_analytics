"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, ArrowRight } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { RatingBadge } from "@/components/RatingBadge";
import { ExportButtonsBar } from "@/components/ExportButtonsBar";

export default function AllRoundersPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAllRounders() {
      try {
        const res = await fetchApi("/api/analytics/all-rounders");
        setData(res.leaderboard || []);
      } catch (err) {
        console.error("Error loading all rounders:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAllRounders();
  }, []);

  return (
    <div className="space-y-8">
      <div className="border-b border-[#07203F]/20 pb-6 pt-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-semibold tracking-wider text-[#A65E46] mb-1">
            Dual-Discipline Impact &amp; Squad Flexibility
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#02000D]">
            All-Rounder Rankings
          </h1>
          <p className="text-sm text-[#07203F]/80 mt-1 max-w-xl">
            Harmonic statistical index assessing genuine two-way performance in both batting and bowling disciplines.
          </p>
        </div>
        <ExportButtonsBar role="All-rounder" sortBy="all_rounder_rating" />
      </div>

      <div 
        tabIndex={0} 
        role="region" 
        aria-label="All-Rounder Rankings Leaderboard Table"
        className="table-wrapper bg-white/90 backdrop-blur rounded-lg border border-[#07203F]/15 shadow-sm"
      >
        <table className="w-full text-left table-editorial table-sticky-col">
          <thead className="bg-[#07203F] text-[#EBDED4]">
            <tr>
              <th scope="col" className="p-3">Rank & Player</th>
              <th scope="col" className="p-3">All-Rounder Rating</th>
              <th scope="col" className="p-3">Bat Rating</th>
              <th scope="col" className="p-3">Bowl Rating</th>
              <th scope="col" className="p-3">Runs (Inn)</th>
              <th scope="col" className="p-3">Strike Rate</th>
              <th scope="col" className="p-3">Wickets (Ov)</th>
              <th scope="col" className="p-3">Economy</th>
              <th scope="col" className="p-3 text-right">Inspect</th>
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
                      <span className="text-[10px] text-[#07203F]/50 block font-mono">{p.matches} matches played</span>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <RatingBadge score={p.ratings.all_rounder_rating} size="sm" />
                </td>
                <td className="p-3 font-mono font-bold text-[#07203F]">{p.ratings.batting_rating.toFixed(1)}</td>
                <td className="p-3 font-mono font-bold text-[#A65E46]">{p.ratings.bowling_rating.toFixed(1)}</td>
                <td className="p-3 font-mono font-semibold text-[#02000D]">{p.total_runs} ({p.innings})</td>
                <td className="p-3 font-mono">{p.strike_rate.toFixed(1)}</td>
                <td className="p-3 font-mono font-semibold text-[#A65E46]">{p.wickets} ({p.overs} ov)</td>
                <td className="p-3 font-mono">{p.legal_balls > 0 ? p.economy.toFixed(2) : "-"}</td>
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
