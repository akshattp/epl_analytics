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
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full mb-4"></div>
        <p className="font-display text-lg text-[#2563EB] dark:text-[#3B82F6]">Clustering Players via Statistical Feature Models...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] dark:border-[#334155] pb-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs uppercase font-bold tracking-widest text-[#2563EB] dark:text-[#3B82F6] mb-1.5">
              <Layers className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
              <span>Statistical Clustering &amp; Auction Substitution Engine</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#101828] dark:text-[#F8FAFC]">
              Similar Player Groups
            </h1>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
              Seven functionally clustered cohorts engineered via StandardScaler, normalized distance vectors, and cosine similarity. Designed for franchise owners to identify alternative targets during live bidding.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] block">Cohorts</span>
            <span className="font-mono text-2xl font-bold text-[#2563EB] dark:text-[#3B82F6]">7 Groups</span>
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
                ? "bg-[#2563EB] text-white border-[#2563EB] shadow-sm"
                : "bg-white dark:bg-[#151F32] text-[#64748B] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#334155] hover:bg-white/80 dark:bg-[#151F32]/80"
            }`}
          >
            <span>{g.group_name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
              selectedGroupId === g.group_id ? "bg-[#F8FAFC] dark:bg-[#0B1120] text-[#2563EB] dark:text-[#3B82F6]" : "bg-slate-50 dark:bg-[#0B1120] text-[#2563EB] dark:text-[#3B82F6]"
            }`}>
              {g.player_count}
            </span>
          </button>
        ))}
      </div>

      {/* Active Group Detail Card */}
      {activeGroup && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] rounded-xl p-6 border border-[#E2E8F0] dark:border-[#334155] shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-4 border-b border-[#E2E8F0] dark:border-[#334155]">
              <div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-[#2563EB] dark:text-[#3B82F6] font-mono">
                  {activeGroup.group_id} Cohort Profile
                </div>
                <h2 className="font-display text-2xl lg:text-3xl font-bold text-[#101828] dark:text-[#F8FAFC] mt-1">
                  {activeGroup.group_name}
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-xl">
                  {activeGroup.why_grouped}
                </p>
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-center px-4 border-r border-[#E2E8F0] dark:border-[#334155]">
                  <span className="text-[10px] uppercase text-[#2563EB] dark:text-[#3B82F6] font-semibold block">Intra-Cohort Similarity</span>
                  <span className="font-mono text-2xl font-bold text-[#101828] dark:text-[#F8FAFC]">
                    {activeGroup.cohort_similarity_score}%
                  </span>
                </div>
                <div className="text-center px-4">
                  <span className="text-[10px] uppercase text-[#2563EB] dark:text-[#3B82F6] font-semibold block">Confidence</span>
                  <span className="text-xs font-bold text-[#101828] dark:text-[#F8FAFC] bg-[#2563EB] px-2.5 py-1 rounded-md inline-block mt-1 font-mono">
                    {activeGroup.confidence}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-xs">
              <div className="bg-slate-50 dark:bg-[#0B1120] p-3.5 rounded-lg border border-[#E2E8F0] dark:border-[#334155] space-y-1">
                <span className="text-[#2563EB] dark:text-[#3B82F6] font-semibold uppercase tracking-wider text-[10px] block">
                  Cohort Strengths
                </span>
                <p className="text-[#101828] dark:text-[#F8FAFC] leading-relaxed">
                  {activeGroup.main_strengths}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-[#0B1120] p-3.5 rounded-lg border border-[#E2E8F0] dark:border-[#334155] space-y-1">
                <span className="text-[#2563EB] dark:text-[#3B82F6] font-semibold uppercase tracking-wider text-[10px] block">
                  Auction Relevance &amp; Strategy
                </span>
                <p className="text-[#101828] dark:text-[#F8FAFC] leading-relaxed">
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
            className="table-wrapper bg-white/80 dark:bg-[#151F32]/80 backdrop-blur rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-lg overflow-hidden"
          >
            <table className="w-full text-left table-editorial table-sticky-col">
              <thead className="bg-[#F8FAFC] dark:bg-[#0B1120] text-[#101828] dark:text-[#F8FAFC] border-b border-[#E2E8F0] dark:border-[#334155]">
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
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#334155] text-xs text-[#101828] dark:text-[#F8FAFC]">
                {activeGroup.players.map((p: any) => (
                  <tr key={p.player_id} className="hover:bg-slate-50 dark:bg-[#0B1120] transition">
                    <td className="p-3 font-medium">
                      <Link href={`/players/${p.player_id}`} className="hover:text-[#2563EB] dark:text-[#3B82F6] transition font-bold text-sm text-[#101828] dark:text-[#F8FAFC]">
                        {p.player_name}
                      </Link>
                      <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block font-mono">{p.player_id}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-[11px] bg-[#F8FAFC] dark:bg-[#0B1120] text-[#2563EB] dark:text-[#3B82F6] border border-[#E2E8F0] dark:border-[#334155]/30 px-2 py-0.5 rounded font-medium">
                        {p.primary_role}
                      </span>
                    </td>
                    <td className="p-3">
                      <RatingBadge score={p.overall_rating} size="sm" />
                    </td>
                    <td className="p-3 font-mono text-[#101828] dark:text-[#F8FAFC]">{p.matches}</td>
                    <td className="p-3 font-mono font-semibold text-[#101828] dark:text-[#F8FAFC]">{p.total_runs}</td>
                    <td className="p-3 font-mono text-[#2563EB] dark:text-[#3B82F6] font-semibold">{p.strike_rate.toFixed(1)}</td>
                    <td className="p-3 font-mono font-bold text-[#2563EB] dark:text-[#3B82F6]">{p.wickets}</td>
                    <td className="p-3 font-mono text-[#101828] dark:text-[#F8FAFC]">{p.economy > 0 ? p.economy.toFixed(2) : "-"}</td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/players/${p.player_id}`}
                        className="text-xs font-semibold text-[#2563EB] dark:text-[#3B82F6] hover:text-[#101828] dark:text-[#F8FAFC] transition inline-flex items-center space-x-1"
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
