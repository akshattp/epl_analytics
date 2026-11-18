"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Layers, Users, Sparkles, ArrowRight, Shield, 
  Flame, CheckCircle2, DollarSign, ChevronRight 
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { RatingBadge } from "@/components/RatingBadge";

export default function SimilarPlayersPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("GROUP-1");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGroups() {
      try {
        const res = await fetchApi("/api/analytics/similar-groups");
        setGroups(res.groups || []);
        if (res.groups && res.groups.length > 0) {
          setSelectedGroupId(res.groups[0].group_id);
        }
      } catch (err) {
        console.error("Error loading similar groups:", err);
      } finally {
        setLoading(false);
      }
    }
    loadGroups();
  }, []);

  const activeGroup = groups.find((g) => g.group_id === selectedGroupId) || groups[0];

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#07203F] border-t-transparent rounded-full mb-4"></div>
        <p className="font-serif text-lg text-[#07203F]">Clustering Players via Statistical Feature Models...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-[#07203F]/20 pb-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-semibold tracking-wider text-[#A65E46] mb-1">
              Statistical Clustering & Auction Substitution Engine
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#02000D]">
              Similar Player Groups
            </h1>
            <p className="text-sm text-[#07203F]/80 mt-1 max-w-2xl leading-relaxed">
              Seven functionally clustered cohorts engineered via StandardScaler, normalized distance vectors, and cosine similarity. Designed for franchise owners to identify alternative targets during live bidding.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#07203F]/60 block">Cohorts</span>
            <span className="font-mono text-xl font-bold text-[#A65E46]">7 Groups</span>
          </div>
        </div>
      </div>

      {/* Cohort Selector Tabs */}
      <div className="flex overflow-x-auto space-x-2 pb-2 scrollbar-none">
        {groups.map((g) => (
          <button
            key={g.group_id}
            onClick={() => setSelectedGroupId(g.group_id)}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 border ${
              selectedGroupId === g.group_id
                ? "bg-[#07203F] text-[#EBDED4] border-[#D9AA90]/40 shadow-sm"
                : "bg-white/80 text-[#07203F] border-[#07203F]/15 hover:bg-[#EBDED4]"
            }`}
          >
            <span>{g.group_name}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
              selectedGroupId === g.group_id ? "bg-[#A65E46] text-[#EBDED4]" : "bg-[#07203F]/10 text-[#07203F]"
            }`}>
              {g.player_count}
            </span>
          </button>
        ))}
      </div>

      {/* Active Group Detail Card */}
      {activeGroup && (
        <div className="space-y-6">
          <div className="bg-[#07203F] text-[#EBDED4] rounded-lg p-6 border border-[#D9AA90]/20 shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-4 border-b border-[#D9AA90]/20">
              <div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-[#D9AA90]">
                  {activeGroup.group_id} Cohort Profile
                </div>
                <h2 className="font-serif text-2xl lg:text-3xl font-bold text-[#EBDED4] mt-1">
                  {activeGroup.group_name}
                </h2>
                <p className="text-xs text-[#EBDED4]/80 mt-1 max-w-xl">
                  {activeGroup.why_grouped}
                </p>
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-center px-3 border-r border-[#D9AA90]/20">
                  <span className="text-[10px] uppercase text-[#D9AA90] font-semibold block">Intra-Cohort Similarity</span>
                  <span className="font-mono text-2xl font-bold text-[#EBDED4]">
                    {activeGroup.cohort_similarity_score}%
                  </span>
                </div>
                <div className="text-center px-3">
                  <span className="text-[10px] uppercase text-[#D9AA90] font-semibold block">Confidence</span>
                  <span className="text-xs font-bold text-[#A65E46] bg-[#EBDED4] px-2.5 py-1 rounded inline-block mt-1">
                    {activeGroup.confidence}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-xs">
              <div className="bg-[#02000D]/40 p-3.5 rounded border border-[#D9AA90]/15 space-y-1">
                <span className="text-[#D9AA90] font-semibold uppercase tracking-wider text-[10px] block">
                  Cohort Strengths
                </span>
                <p className="text-[#EBDED4]/90 leading-relaxed">
                  {activeGroup.main_strengths}
                </p>
              </div>
              <div className="bg-[#02000D]/40 p-3.5 rounded border border-[#D9AA90]/15 space-y-1">
                <span className="text-[#D9AA90] font-semibold uppercase tracking-wider text-[10px] block">
                  Auction Relevance & Strategy
                </span>
                <p className="text-[#EBDED4]/90 leading-relaxed">
                  {activeGroup.auction_relevance}
                </p>
              </div>
            </div>
          </div>

          {/* Table of Cohort Players */}
          <div 
            tabIndex={0} 
            role="region" 
            aria-label={`${activeGroup.group_name} Cohort Players Table`}
            className="table-wrapper bg-white/90 backdrop-blur rounded-lg border border-[#07203F]/15 shadow-sm"
          >
            <table className="w-full text-left table-editorial table-sticky-col">
              <thead className="bg-[#07203F] text-[#EBDED4]">
                <tr>
                  <th scope="col" className="p-3">Player</th>
                  <th scope="col" className="p-3">Primary Role</th>
                  <th scope="col" className="p-3">EPL Rating</th>
                  <th scope="col" className="p-3">Matches</th>
                  <th scope="col" className="p-3">Runs</th>
                  <th scope="col" className="p-3">Strike Rate</th>
                  <th scope="col" className="p-3">Wickets</th>
                  <th scope="col" className="p-3">Economy</th>
                  <th scope="col" className="p-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#07203F]/10 text-xs">
                {activeGroup.players.map((p: any) => (
                  <tr key={p.player_id} className="hover:bg-[#EBDED4]/40 transition">
                    <td className="p-3 font-medium">
                      <Link href={`/players/${p.player_id}`} className="hover:text-[#A65E46] transition font-bold text-sm text-[#07203F]">
                        {p.player_name}
                      </Link>
                      <span className="text-[10px] text-[#07203F]/50 block font-mono">{p.player_id}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-[11px] bg-[#07203F]/10 text-[#07203F] px-2 py-0.5 rounded font-medium">
                        {p.primary_role}
                      </span>
                    </td>
                    <td className="p-3">
                      <RatingBadge score={p.overall_rating} size="sm" />
                    </td>
                    <td className="p-3 font-mono">{p.matches}</td>
                    <td className="p-3 font-mono font-semibold text-[#02000D]">{p.total_runs}</td>
                    <td className="p-3 font-mono text-[#07203F]">{p.strike_rate.toFixed(1)}</td>
                    <td className="p-3 font-mono font-bold text-[#A65E46]">{p.wickets}</td>
                    <td className="p-3 font-mono text-[#07203F]">{p.economy > 0 ? p.economy.toFixed(2) : "-"}</td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/players/${p.player_id}`}
                        className="text-xs font-semibold text-[#07203F] hover:text-[#A65E46] transition inline-flex items-center space-x-1"
                      >
                        <span>Profile</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
