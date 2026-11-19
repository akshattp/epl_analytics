"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { History, Sparkles, Shield, BarChart3, Gavel, Layout, Wrench, Zap, Info, Layers } from "lucide-react";
import { fetchApi } from "@/lib/api";

const CATEGORY_ICONS: Record<string, any> = {
  "New Features": Sparkles,
  "Analytics Improvements": BarChart3,
  "Auction Improvements": Gavel,
  "UI/UX Improvements": Layout,
  "Bug Fixes": Wrench,
  "Security Improvements": Shield,
  "Performance Improvements": Zap,
};

export default function ChangelogPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedVersion, setSelectedVersion] = useState<string>("ALL");

  useEffect(() => {
    fetchApi("/api/changelog")
      .then((res) => setData(res))
      .catch((err) => console.error("Failed to fetch changelog:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full mb-3"></div>
        <p className="font-display text-lg text-[#2563EB] dark:text-[#3B82F6]">Loading EPL Release History...</p>
      </div>
    );
  }

  const releases = (data?.releases || []).filter((r: any) =>
    selectedVersion === "ALL" ? true : r.version === selectedVersion
  );

  return (
    <div className="space-y-8">
      {/* Editorial Hero */}
      <div className="bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] rounded-xl p-6 sm:p-8 border border-[#E2E8F0] dark:border-[#334155] shadow-lg">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-[#2563EB] dark:text-[#3B82F6] font-semibold mb-2">
              <History className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
              <span>Version Management &amp; Product Evolution</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#101828] dark:text-[#F8FAFC]">
              What&apos;s New in EPL Analytics
            </h1>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-2 max-w-2xl">
              Transparent, evidence-backed release notes documenting every feature, statistical upgrade, auction hardening milestone, and UI/UX refinement from Version 1.0.0 to Version {data?.current_version}.
            </p>
          </div>
          <div className="bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-5 py-3 text-right shrink-0 shadow-md">
            <span className="text-[10px] uppercase tracking-widest text-[#2563EB] dark:text-[#3B82F6] block font-mono">Current Active Build</span>
            <span className="font-mono text-2xl font-bold text-[#101828] dark:text-[#F8FAFC]">v{data?.current_version}</span>
            <span className="text-[11px] text-[#2563EB] dark:text-[#3B82F6] block font-mono">
              {data?.releases?.[0]?.release_date}
            </span>
          </div>
        </div>
      </div>

      {/* Provenance Note */}
      {data?.provenance_note && (
        <div className="bg-white dark:bg-[#151F32] border-l-4 border-[#2563EB] rounded-r-xl p-4 text-xs text-[#101828] dark:text-[#F8FAFC] flex items-start space-x-3 shadow-md border-t border-r border-b border-[#E2E8F0] dark:border-[#334155]">
          <Info className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6] shrink-0 mt-0.5" />
          <div>
            <strong className="uppercase tracking-wider text-[10px] text-[#2563EB] dark:text-[#3B82F6] block mb-0.5">
              Release Record Verification &amp; Provenance
            </strong>
            <span className="text-[#101828] dark:text-[#F8FAFC]/90">{data.provenance_note}</span>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] rounded-xl border border-[#E2E8F0] dark:border-[#334155] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedCategory === "ALL"
                ? "bg-[#2563EB] text-white shadow-sm"
                : "bg-[#F8FAFC] dark:bg-[#0B1120] text-[#64748B] dark:text-[#94A3B8] border border-[#E2E8F0] dark:border-[#334155] hover:text-[#101828] dark:text-[#F8FAFC]"
            }`}
          >
            All Categories
          </button>
          {(data?.categories || []).map((cat: string) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedCategory === cat
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : "bg-[#F8FAFC] dark:bg-[#0B1120] text-[#64748B] dark:text-[#94A3B8] border border-[#E2E8F0] dark:border-[#334155] hover:text-[#101828] dark:text-[#F8FAFC]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs font-semibold text-[#2563EB] dark:text-[#3B82F6]">Release:</span>
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B1120] text-[#101828] dark:text-[#F8FAFC] font-mono font-semibold focus:outline-none focus:border-[#E2E8F0] dark:border-[#334155]"
          >
            <option value="ALL">All Versions ({data?.releases?.length || 0})</option>
            {(data?.releases || []).map((r: any) => (
              <option key={r.version} value={r.version}>
                v{r.version} ({r.release_date})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Release Cards */}
      <div className="space-y-6">
        {releases.map((rel: any) => (
          <article
            key={rel.version}
            className="bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-lg overflow-hidden"
          >
            {/* Release Header */}
            <div className="bg-[#F8FAFC] dark:bg-[#0B1120] text-[#101828] dark:text-[#F8FAFC] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-[#2563EB]">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xl font-bold text-[#101828] dark:text-[#F8FAFC]">v{rel.version}</span>
                  {rel.is_latest && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#2563EB] text-white text-[10px] font-bold uppercase tracking-wider font-mono">
                      Latest Release
                    </span>
                  )}
                  <span className="text-xs text-[#2563EB] dark:text-[#3B82F6] font-display italic">
                    — {rel.codename}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-3xl">{rel.summary}</p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <div className="font-mono text-xs font-semibold text-[#2563EB] dark:text-[#3B82F6]">{rel.release_date}</div>
                <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono">{rel.date_source}</div>
              </div>
            </div>

            {/* Categorized Changes */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {Object.entries(rel.changes || {}).map(([cat, items]: [string, any]) => {
                  if (selectedCategory !== "ALL" && selectedCategory !== cat) return null;
                  if (!items || items.length === 0) return null;
                  const Icon = CATEGORY_ICONS[cat] || Layers;
                  return (
                    <div
                      key={cat}
                      className="bg-[#F8FAFC] dark:bg-[#0B1120]/60 rounded-xl border border-[#E2E8F0] dark:border-[#334155]/15 p-4 space-y-2"
                    >
                      <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#3B82F6] border-b border-[#E2E8F0] dark:border-[#334155]/15 pb-1.5">
                        <Icon className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
                        <span>{cat}</span>
                        <span className="ml-auto font-mono text-[10px] text-[#2563EB] dark:text-[#3B82F6]">({items.length})</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-[#101828] dark:text-[#F8FAFC]/90 list-disc list-inside leading-relaxed">
                        {items.map((txt: string, i: number) => (
                          <li key={i}>{txt}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              {/* Affected Modules */}
              {rel.affected_modules?.length > 0 && (
                <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#334155]/15">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#2563EB] dark:text-[#3B82F6] block mb-1.5 font-mono">
                    Affected Modules &amp; Artifacts
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {rel.affected_modules.map((mod: string) => (
                      <span
                        key={mod}
                        className="px-2 py-0.5 rounded bg-[#F8FAFC] dark:bg-[#0B1120] text-[#2563EB] dark:text-[#3B82F6] font-mono text-[10px] border border-[#E2E8F0] dark:border-[#334155]"
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="text-center pt-2">
        <Link
          href="/"
          className="inline-flex items-center px-5 py-2.5 rounded-lg bg-[#2563EB] text-white hover:bg-[#2563EB]/90 text-xs font-semibold transition shadow-sm"
        >
          Return to EPL Overview Dashboard
        </Link>
      </div>
    </div>
  );
}
