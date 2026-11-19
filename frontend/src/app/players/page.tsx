"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Search, Download, FileSpreadsheet, FileText, Users, Award, Shield } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { RatingBadge } from "@/components/RatingBadge";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { ExportButtonsBar } from "@/components/ExportButtonsBar";

export default function PlayersPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [seasonFilter, setSeasonFilter] = useState("ALL");

  useEffect(() => {
    async function loadPlayers() {
      try {
        const res = await fetchApi("/api/players?sort_by=rating");
        setPlayers(res.players || []);
      } catch (err) {
        console.error("Error loading players:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPlayers();
  }, []);

  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.player_id.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (roleFilter !== "ALL" && p.primary_role !== roleFilter) return false;
      if (categoryFilter !== "ALL" && p.valuation?.category !== categoryFilter) return false;
      if (seasonFilter !== "ALL" && !(p.seasons || []).includes(parseInt(seasonFilter))) return false;
      return true;
    });
  }, [players, search, roleFilter, categoryFilter, seasonFilter]);

  const getInitials = (name: string) => {
    const parts = name.replace(/\([^)]*\)/g, "").trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return (name[0] || "P").toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes("all-round")) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#60A5FA] border border-blue-200 dark:border-blue-800 text-[10px] font-bold tracking-wide">
          All-Rounder
        </span>
      );
    }
    if (r.includes("bat")) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-[#0891B2] dark:text-[#22D3EE] border border-cyan-200 dark:border-cyan-800 text-[10px] font-semibold tracking-wide">
          Pure Batsman
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-[#64748B] dark:text-[#94A3B8] border border-slate-200 dark:border-slate-700 text-[10px] font-medium tracking-wide">
        Pure Bowler
      </span>
    );
  };

  const columns: DataTableColumn<any>[] = [
    {
      key: "name",
      header: "Player",
      tooltip: "Canonical Player Name & Permanent EPL ID",
      minWidth: "210px",
      sortAccessor: (p) => p.name,
      render: (p) => (
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-[#1E293B] border border-blue-200 dark:border-[#334155] flex items-center justify-center font-bold text-xs text-[#2563EB] dark:text-[#38BDF8] font-mono shrink-0 shadow-sm">
            {getInitials(p.name)}
          </div>
          <div className="min-w-0">
            <Link href={`/players/${p.player_id}`} className="font-bold text-sm text-[#101828] dark:text-[#F8FAFC] hover:text-[#2563EB] dark:hover:text-[#38BDF8] transition truncate block">
              {p.name}
            </Link>
            <span className="block text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]">
              {p.player_id} • {p.batting_hand || "RHB"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "primary_role",
      header: "Role",
      tooltip: "Primary Playing Discipline",
      minWidth: "130px",
      render: (p) => getRoleBadge(p.primary_role),
    },
    {
      key: "matches",
      header: "Mat",
      tooltip: "Total Regulation Matches Played",
      align: "right",
      minWidth: "64px",
      sortAccessor: (p) => p.matches,
      render: (p) => <span className="font-mono font-semibold">{p.matches}</span>,
    },
    {
      key: "total_runs",
      header: "Runs",
      tooltip: "Total Regulation Batting Runs",
      align: "right",
      minWidth: "70px",
      sortAccessor: (p) => p.total_runs,
      render: (p) => <span className="font-mono font-bold text-[#2563EB] dark:text-[#38BDF8]">{p.total_runs}</span>,
    },
    {
      key: "batting_average",
      header: "Bat Avg",
      tooltip: "Regulation Batting Average",
      align: "right",
      minWidth: "78px",
      sortAccessor: (p) => p.batting_average,
      render: (p) => <span className="font-mono">{Number(p.batting_average || 0).toFixed(1)}</span>,
    },
    {
      key: "strike_rate",
      header: "Bat SR",
      tooltip: "Regulation Batting Strike Rate",
      align: "right",
      minWidth: "78px",
      sortAccessor: (p) => p.strike_rate,
      render: (p) => <span className="font-mono">{Number(p.strike_rate || 0).toFixed(1)}</span>,
    },
    {
      key: "wickets",
      header: "Wkts",
      tooltip: "Total Regulation Wickets Taken",
      align: "right",
      minWidth: "66px",
      sortAccessor: (p) => p.wickets,
      render: (p) => <span className="font-mono font-bold text-[#0891B2] dark:text-[#22D3EE]">{p.wickets}</span>,
    },
    {
      key: "economy",
      header: "Econ",
      tooltip: "Regulation Bowling Economy Rate (Runs Per Over)",
      align: "right",
      minWidth: "74px",
      sortAccessor: (p) => (p.legal_balls > 0 ? p.economy : 99),
      render: (p) => <span className="font-mono">{p.legal_balls > 0 ? Number(p.economy).toFixed(2) : "—"}</span>,
    },
    {
      key: "overall_rating",
      header: "PIS Rating",
      tooltip: "Composite 100-Point EPL Player Intelligence Score",
      align: "center",
      minWidth: "96px",
      sortAccessor: (p) => p.ratings?.overall_rating || 0,
      render: (p) => <RatingBadge score={p.ratings?.overall_rating || 0} size="sm" />,
    },
    {
      key: "category",
      header: "Auction Tier",
      tooltip: "Auction Valuation Tier",
      minWidth: "150px",
      sortAccessor: (p) => p.valuation?.estimated_valuation || 0,
      render: (p) => (
        <div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            (p.valuation?.category || "").includes("Marquee")
              ? "bg-[#2563EB] text-white"
              : "bg-slate-100 dark:bg-slate-800 text-[#64748B] dark:text-[#94A3B8]"
          }`}>
            {p.valuation?.category}
          </span>
          <span className="block font-mono text-[10px] text-[#2563EB] dark:text-[#38BDF8] font-bold mt-0.5">
            Est: ₹{Number(p.valuation?.estimated_valuation || 0).toFixed(1)}L
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Profile",
      sortable: false,
      align: "right",
      minWidth: "95px",
      render: (p) => (
        <Link
          href={`/players/${p.player_id}`}
          className="inline-block px-3 py-1 rounded-lg bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#101828] dark:text-[#F8FAFC] hover:bg-[#2563EB] hover:text-white dark:hover:bg-[#3B82F6] text-[11px] font-semibold transition shadow-sm"
        >
          Inspect →
        </Link>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#2563EB] dark:border-[#38BDF8] border-t-transparent rounded-full"></div>
        <p className="font-display text-lg text-[#101828] dark:text-[#F8FAFC]">Loading Master Player Registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Editorial Header + Export Controls */}
      <div className="border-b border-[#E2E8F0] dark:border-[#334155] pb-6 pt-2">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-semibold tracking-wider text-[#2563EB] dark:text-[#38BDF8] mb-1 font-mono">
              Historical Player Master Database
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#101828] dark:text-[#F8FAFC]">
              Player Directory
            </h1>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
              Complete catalog of {players.length} canonical cricketers across EPL 2023–2025. Displays Player Intelligence Scores (PIS), 6-over milestones, and verified auction tiers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ExportButtonsBar sortBy="overall_rating" />
          </div>
        </div>
      </div>

      {/* Modern Filters Bar */}
      <div className="bg-white dark:bg-[#151F32] rounded-xl p-4 border border-[#E2E8F0] dark:border-[#334155] shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#64748B] dark:text-[#94A3B8] pointer-events-none" />
          <input
            type="text"
            placeholder="Search player name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B1120] focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] focus:ring-1 focus:ring-[#2563EB] dark:focus:ring-[#3B82F6] text-[#101828] dark:text-[#F8FAFC] placeholder-[#64748B]/60 dark:placeholder-[#94A3B8]/60 transition"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter by role"
          className="px-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B1120] text-[#101828] dark:text-[#F8FAFC] focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] transition"
        >
          <option value="ALL">All Playing Roles</option>
          <option value="All-rounder">All-rounders</option>
          <option value="Specialist Batsman">Specialist Batsmen</option>
          <option value="Specialist Bowler">Specialist Bowlers</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by auction category"
          className="px-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B1120] text-[#101828] dark:text-[#F8FAFC] focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] transition"
        >
          <option value="ALL">All Auction Tiers</option>
          <option value="Marquee / Elite">Marquee / Elite</option>
          <option value="Tier 1 (High Impact)">Tier 1 (High Impact)</option>
          <option value="Tier 2 (Solid Core)">Tier 2 (Solid Core)</option>
          <option value="Role Specialist">Role Specialist</option>
          <option value="Uncapped / New">Uncapped / New</option>
        </select>

        <select
          value={seasonFilter}
          onChange={(e) => setSeasonFilter(e.target.value)}
          aria-label="Filter by season"
          className="px-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B1120] text-[#101828] dark:text-[#F8FAFC] focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] transition"
        >
          <option value="ALL">All Seasons (2023–2025)</option>
          <option value="2025">EPL 2025</option>
          <option value="2024">EPL 2024</option>
          <option value="2023">EPL 2023</option>
        </select>
      </div>

      {/* Universal Sticky Data Table */}
      <DataTable
        data={filteredPlayers}
        columns={columns}
        rowKey={(p) => p.player_id}
        title={`Canonical Player Registry (${filteredPlayers.length} / ${players.length})`}
        subtitle="Sticky opaque headers • Click column heading to sort • Horizontal scroll pins Player identity"
        defaultSortKey="overall_rating"
        defaultSortDir="desc"
        defaultPageSize={25}
        stickyFirstColumn
        highlightRow={(p) => (p.ratings?.overall_rating || 0) >= 80}
      />
    </div>
  );
}
