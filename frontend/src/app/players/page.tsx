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
  const [experienceFilter, setExperienceFilter] = useState("ALL");

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
      if (roleFilter !== "ALL" && p.primary_role !== roleFilter && p.role_classification !== roleFilter) return false;
      if (categoryFilter !== "ALL" && p.valuation?.category !== categoryFilter) return false;
      if (seasonFilter !== "ALL" && !(p.seasons || []).includes(parseInt(seasonFilter))) return false;
      if (experienceFilter !== "ALL" && (p.experience_level || "").toLowerCase() !== experienceFilter.toLowerCase()) return false;
      return true;
    });
  }, [players, search, roleFilter, categoryFilter, seasonFilter, experienceFilter]);

  const getInitials = (name: string) => {
    const parts = name.replace(/\([^)]*\)/g, "").trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return (name[0] || "P").toUpperCase();
  };

  const getRoleBadge = (p: any) => {
    const role = p.role_classification || p.primary_role || "";
    const r = role.toLowerCase();
    const conf = p.confidence_level;
    if (r.includes("all-round")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF4B35]/10 text-[#FF4B35] border border-[#FF4B35]/30 text-[10px] font-bold tracking-wide">
          <span>{role}</span>
        </span>
      );
    }
    if (r.includes("bat")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FAF7F0] dark:bg-[#181A20] text-[#111318] dark:text-[#F1EBDD] border border-[#DDD5C3] dark:border-[#2A2E38] text-[10px] font-semibold tracking-wide">
          <span>{role}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8E1D1]/60 dark:bg-[#22252D] text-[#5C584E] dark:text-[#A8A296] border border-[#DDD5C3] dark:border-[#2A2E38] text-[10px] font-medium tracking-wide">
        <span>{role}</span>
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
          <div className="w-8 h-8 rounded-full bg-[#FAF7F0] dark:bg-[#181A20] border border-[#DDD5C3] dark:border-[#2A2E38] flex items-center justify-center font-bold text-xs text-[#FF4B35] font-mono shrink-0 shadow-sm">
            {getInitials(p.name)}
          </div>
          <div className="min-w-0">
            <Link href={`/players/${p.player_id}`} className="font-bold text-sm text-[#111318] dark:text-[#F1EBDD] hover:text-[#FF4B35] dark:hover:text-[#FF4B35] transition truncate block">
              {p.name}
            </Link>
            <span className="block text-[10px] font-mono text-[#5C584E] dark:text-[#A8A296]">
              {p.player_id} • {p.batting_hand || "RHB"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "primary_role",
      header: "Classification",
      tooltip: "Audited Role & Statistical Confidence",
      minWidth: "155px",
      render: (p) => (
        <div className="space-y-0.5">
          <div>{getRoleBadge(p)}</div>
          <div className="flex items-center gap-1 text-[9px] font-mono text-[#5C584E] dark:text-[#A8A296]">
            <span className={`w-1.5 h-1.5 rounded-full ${
              p.confidence_level === "HIGH" ? "bg-emerald-500" :
              p.confidence_level === "MEDIUM" ? "bg-[#FF4B35]" : "bg-amber-500"
            }`} />
            <span>{p.experience_level || "Emerging"} • {p.confidence_level || "LOW"} Conf</span>
          </div>
        </div>
      ),
    },
    {
      key: "tags",
      header: "Performance Tags",
      tooltip: "Controlled Vocabulary Performance Tags",
      minWidth: "165px",
      render: (p) => (
        <div className="flex flex-wrap gap-1 max-w-[170px]">
          {(p.performance_tags || []).length > 0 ? (
            p.performance_tags.slice(0, 2).map((t: string, idx: number) => (
              <span
                key={idx}
                className={`text-[9px] px-1.5 py-0.5 rounded font-medium border ${
                  t === "Limited Sample Size"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    : t.includes("All-round")
                    ? "bg-[#FF4B35]/10 text-[#FF4B35] border-[#FF4B35]/20 font-bold"
                    : "bg-[#F1EBDD] dark:bg-[#111318] text-[#111318] dark:text-[#F1EBDD] border-[#DDD5C3] dark:border-[#2A2E38]"
                }`}
              >
                {t}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-[#5C584E] dark:text-[#A8A296] italic">—</span>
          )}
        </div>
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
      render: (p) => <span className="font-mono font-bold text-[#111318] dark:text-[#F1EBDD]">{p.total_runs}</span>,
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
      render: (p) => <span className="font-mono font-bold text-[#111318] dark:text-[#F1EBDD]">{p.wickets}</span>,
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
              ? "bg-[#FF4B35] text-white"
              : "bg-[#FAF7F0] dark:bg-[#181A20] text-[#5C584E] dark:text-[#A8A296] border border-[#DDD5C3] dark:border-[#2A2E38]"
          }`}>
            {p.valuation?.category}
          </span>
          <span className="block font-mono text-[10px] text-[#FF4B35] font-bold mt-0.5">
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
          className="inline-block px-3 py-1 rounded-lg bg-[#FAF7F0] dark:bg-[#181A20] border border-[#DDD5C3] dark:border-[#2A2E38] text-[#111318] dark:text-[#F1EBDD] hover:bg-[#FF4B35] hover:text-white hover:border-[#FF4B35] text-[11px] font-semibold transition shadow-sm"
        >
          Inspect →
        </Link>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#FF4B35] border-t-transparent rounded-full"></div>
        <p className="font-display text-lg text-[#111318] dark:text-[#F1EBDD]">Loading Master Player Registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Editorial Header + Export Controls */}
      <div className="border-b border-[#DDD5C3] dark:border-[#2A2E38] pb-6 pt-2">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-semibold tracking-wider text-[#FF4B35] mb-1 font-mono">
              Historical Player Master Database
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111318] dark:text-[#F1EBDD]">
              Player Directory
            </h1>
            <p className="text-sm text-[#5C584E] dark:text-[#A8A296] mt-1 max-w-2xl leading-relaxed">
              Complete catalog of {players.length} canonical cricketers across EPL 2023–2025. Displays Player Intelligence Scores (PIS), 6-over milestones, and verified auction tiers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ExportButtonsBar sortBy="overall_rating" />
          </div>
        </div>
      </div>

      {/* Modern Filters Bar */}
      <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-xl p-4 border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#5C584E] dark:text-[#A8A296] pointer-events-none" />
          <input
            type="text"
            placeholder="Search player name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#DDD5C3] dark:border-[#2A2E38] bg-[#F1EBDD] dark:bg-[#111318] focus:outline-none focus:border-[#FF4B35] focus:ring-1 focus:ring-[#FF4B35] text-[#111318] dark:text-[#F1EBDD] placeholder-[#5C584E]/60 dark:placeholder-[#A8A296]/60 transition"
          />
        </div>

        <select
          value={experienceFilter}
          onChange={(e) => setExperienceFilter(e.target.value)}
          aria-label="Filter by experience level"
          className="px-3 py-1.5 text-xs rounded-lg border border-[#DDD5C3] dark:border-[#2A2E38] bg-[#F1EBDD] dark:bg-[#111318] text-[#111318] dark:text-[#F1EBDD] focus:outline-none focus:border-[#FF4B35] transition"
        >
          <option value="ALL">All Experience Levels</option>
          <option value="Proven">Proven (10+ Matches)</option>
          <option value="Established">Established (6–9 Matches)</option>
          <option value="Developing">Developing (3–5 Matches)</option>
          <option value="Emerging">Emerging (1–2 Matches)</option>
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter by role"
          className="px-3 py-1.5 text-xs rounded-lg border border-[#DDD5C3] dark:border-[#2A2E38] bg-[#F1EBDD] dark:bg-[#111318] text-[#111318] dark:text-[#F1EBDD] focus:outline-none focus:border-[#FF4B35] transition"
        >
          <option value="ALL">All Playing Roles</option>
          <option value="All-rounder">All-rounders</option>
          <option value="Specialist Batsman">Specialist Batsmen / Batters</option>
          <option value="Specialist Bowler">Specialist Bowlers</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by auction category"
          className="px-3 py-1.5 text-xs rounded-lg border border-[#DDD5C3] dark:border-[#2A2E38] bg-[#F1EBDD] dark:bg-[#111318] text-[#111318] dark:text-[#F1EBDD] focus:outline-none focus:border-[#FF4B35] transition"
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
          className="px-3 py-1.5 text-xs rounded-lg border border-[#DDD5C3] dark:border-[#2A2E38] bg-[#F1EBDD] dark:bg-[#111318] text-[#111318] dark:text-[#F1EBDD] focus:outline-none focus:border-[#FF4B35] transition"
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
