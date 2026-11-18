"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Search, Download, FileSpreadsheet, FileText } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { RatingBadge } from "@/components/RatingBadge";
import { DataTable, DataTableColumn } from "@/components/DataTable";

export default function PlayersPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [seasonFilter, setSeasonFilter] = useState("ALL");
  const [exporting, setExporting] = useState<string | null>(null);

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

  const handleExport = async (format: "pdf" | "xlsx" | "csv") => {
    setExporting(format);
    try {
      const params = new URLSearchParams({ format });
      if (search.trim()) params.append("search", search.trim());
      if (roleFilter !== "ALL") params.append("role", roleFilter);
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      const res = await fetch(`/api/exports/players?${params.toString()}`);
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `EPL_Player_Statistics.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(null);
    }
  };

  const columns: DataTableColumn<any>[] = [
    {
      key: "name",
      header: "Player",
      tooltip: "Canonical Player Name & Permanent EPL ID",
      minWidth: "180px",
      sortAccessor: (p) => p.name,
      render: (p) => (
        <div>
          <Link href={`/players/${p.player_id}`} className="font-bold text-sm text-[#07203F] hover:text-[#A65E46] transition">
            {p.name}
          </Link>
          <span className="block text-[10px] font-mono text-[#07203F]/60">
            {p.player_id} • {p.batting_hand || "RHB"}
          </span>
        </div>
      ),
    },
    {
      key: "primary_role",
      header: "Role",
      tooltip: "Primary Playing Discipline",
      minWidth: "130px",
      render: (p) => (
        <span className="px-2 py-0.5 rounded bg-[#07203F]/10 text-[#07203F] text-[11px] font-medium">
          {p.primary_role}
        </span>
      ),
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
      render: (p) => <span className="font-mono font-bold text-[#07203F]">{p.total_runs}</span>,
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
      render: (p) => <span className="font-mono font-bold text-[#A65E46]">{p.wickets}</span>,
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
      header: "EPL Rtg",
      tooltip: "Composite 100-Point Bayesian EPL Player Rating",
      align: "center",
      minWidth: "86px",
      sortAccessor: (p) => p.ratings?.overall_rating || 0,
      render: (p) => <RatingBadge score={p.ratings?.overall_rating || 0} size="sm" />,
    },
    {
      key: "category",
      header: "Auction Tier",
      tooltip: "Auction Valuation Tier",
      minWidth: "145px",
      sortAccessor: (p) => p.valuation?.estimated_valuation || 0,
      render: (p) => (
        <div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
            (p.valuation?.category || "").includes("Marquee")
              ? "bg-[#A65E46] text-[#EBDED4]"
              : "bg-[#EBDED4] text-[#07203F]"
          }`}>
            {p.valuation?.category}
          </span>
          <span className="block font-mono text-[10px] text-[#A65E46] font-bold mt-0.5">
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
      minWidth: "85px",
      render: (p) => (
        <Link
          href={`/players/${p.player_id}`}
          className="inline-block px-2.5 py-1 rounded bg-[#07203F] text-[#EBDED4] hover:bg-[#A65E46] text-[11px] font-semibold transition"
        >
          Inspect →
        </Link>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#07203F] border-t-transparent rounded-full mb-4"></div>
        <p className="font-serif text-lg text-[#07203F]">Loading Master Player Registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Editorial Header + Export Controls */}
      <div className="border-b border-[#07203F]/20 pb-6 pt-2">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-semibold tracking-wider text-[#A65E46] mb-1">
              Historical Player Master Database
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#02000D]">
              Player Directory
            </h1>
            <p className="text-sm text-[#07203F]/80 mt-1 max-w-2xl">
              Complete catalog of {players.length} canonical cricketers across EPL 2023–2025. Exports include the entire active filtered dataset across all pages.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleExport("pdf")}
              disabled={exporting !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-[#A65E46] text-[#EBDED4] hover:bg-[#A65E46]/90 text-xs font-semibold transition disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{exporting === "pdf" ? "Generating PDF..." : "Download PDF"}</span>
            </button>
            <button
              type="button"
              onClick={() => handleExport("xlsx")}
              disabled={exporting !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-[#07203F] text-[#EBDED4] hover:bg-[#02000D] text-xs font-semibold transition disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#D9AA90]" />
              <span>{exporting === "xlsx" ? "Generating Excel..." : "Download Excel"}</span>
            </button>
            <button
              type="button"
              onClick={() => handleExport("csv")}
              disabled={exporting !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-[#07203F] bg-white text-[#07203F] hover:bg-[#EBDED4] text-xs font-semibold transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exporting === "csv" ? "Exporting..." : "Download CSV"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/90 rounded-xl p-4 border border-[#07203F]/15 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#07203F]/50" />
          <input
            type="text"
            placeholder="Search player name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-[#07203F]/20 bg-[#EBDED4]/30 focus:outline-none focus:border-[#A65E46] text-[#02000D]"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter by role"
          className="px-3 py-1.5 text-xs rounded border border-[#07203F]/20 bg-[#EBDED4]/30 text-[#02000D]"
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
          className="px-3 py-1.5 text-xs rounded border border-[#07203F]/20 bg-[#EBDED4]/30 text-[#02000D]"
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
          className="px-3 py-1.5 text-xs rounded border border-[#07203F]/20 bg-[#EBDED4]/30 text-[#02000D]"
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
        subtitle="Sticky opaque headers • Click any column heading to sort • Horizontal scroll pins Player identity"
        defaultSortKey="overall_rating"
        defaultSortDir="desc"
        defaultPageSize={25}
        stickyFirstColumn
        highlightRow={(p) => (p.ratings?.overall_rating || 0) >= 80}
      />
    </div>
  );
}
