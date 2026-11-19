"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, ArrowRight, Activity } from "lucide-react";
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
      {/* Editorial Header */}
      <div className="border-b border-[#07203F] pb-6 pt-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs uppercase font-bold tracking-widest text-[#D9AA90] mb-1.5">
            <Activity className="w-3.5 h-3.5 text-[#A65E46]" />
            <span>Dual-Discipline Impact &amp; Squad Flexibility</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#EBDED4]">
            All-Rounder Rankings
          </h1>
          <p className="text-sm text-[#EBDED4]/80 mt-1 max-w-xl">
            Harmonic statistical index assessing genuine two-way performance in both batting and bowling disciplines.
          </p>
        </div>
        <ExportButtonsBar role="All-rounder" sortBy="all_rounder_rating" />
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-[#A65E46] border-t-transparent rounded-full mb-3"></div>
          <p className="font-serif text-lg text-[#D9AA90]">Evaluating Dual-Discipline Harmonic Indices...</p>
        </div>
      ) : (
        <div 
          tabIndex={0} 
          role="region" 
          aria-label="All-Rounder Rankings Leaderboard Table"
          className="table-wrapper bg-[#07203F]/80 backdrop-blur rounded-xl border border-[#D9AA90]/20 shadow-lg overflow-hidden"
        >
          <table className="w-full text-left table-editorial table-sticky-col">
            <thead className="bg-[#02000D] text-[#EBDED4] border-b border-[#D9AA90]/20">
              <tr>
                <th scope="col" className="p-3">Rank &amp; Player</th>
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
                        <span className="text-[10px] text-[#D9AA90]/70 block font-mono">{p.matches} matches played</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <RatingBadge score={p.ratings.all_rounder_rating} size="sm" />
                  </td>
                  <td className="p-3 font-mono font-bold text-[#EBDED4]">{p.ratings.batting_rating.toFixed(1)}</td>
                  <td className="p-3 font-mono font-bold text-[#A65E46]">{p.ratings.bowling_rating.toFixed(1)}</td>
                  <td className="p-3 font-mono font-semibold text-[#EBDED4]">{p.total_runs} ({p.innings})</td>
                  <td className="p-3 font-mono text-[#D9AA90] font-semibold">{p.strike_rate.toFixed(1)}</td>
                  <td className="p-3 font-mono font-semibold text-[#A65E46]">{p.wickets} ({p.overs} ov)</td>
                  <td className="p-3 font-mono text-[#EBDED4]/90">{p.legal_balls > 0 ? p.economy.toFixed(2) : "-"}</td>
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
