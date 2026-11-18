"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sliders, Shield, Users, Eye, Play, Lock, CheckCircle2,
  Upload, Plus, Trash2, AlertCircle
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { RatingBadge } from "@/components/RatingBadge";

interface AuctionSetupWizardProps {
  token: string | null;
  isAuctioneer: boolean;
  onAuctionStarted: () => void;
  onNotify: (msg: string, type: "success" | "error" | "info") => void;
}

export function AuctionSetupWizard({
  token,
  isAuctioneer,
  onAuctionStarted,
  onNotify,
}: AuctionSetupWizardProps) {
  const [step, setStep] = useState<"rules" | "teams" | "pool" | "preview">("rules");
  const [config, setConfig] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);
  const [pool, setPool] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New player add form
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("All-rounder");
  const [newHand, setNewHand] = useState("RHB");
  const [newCat, setNewCat] = useState("Uncapped / New");
  const [newBasePrice, setNewBasePrice] = useState(2.0);

  // CSV Import
  const [csvText, setCsvText] = useState("");
  const [showCsvBox, setShowCsvBox] = useState(false);

  // Confirmation modal for START AUCTION
  const [confirmOpen, setConfirmOpen] = useState(false);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const loadSetupData = async () => {
    setLoading(true);
    try {
      const [cfgRes, prevRes, poolRes, tRes] = await Promise.all([
        fetchApi("/api/auction/config"),
        fetchApi("/api/auction/preview"),
        fetchApi("/api/auction/pool"),
        fetchApi("/api/auction/teams"),
      ]);
      setConfig(cfgRes);
      setPreview(prevRes);
      setPool(poolRes.pool || []);
      setTeams(tRes.teams || []);
    } catch (err) {
      console.error("Error loading auction setup:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSetupData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuctioneer) {
      onNotify("Sign in as Official Auctioneer to save setup configuration.", "error");
      return;
    }
    setSaving(true);
    try {
      const updated = await fetchApi("/api/auction/config", {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          auction_name: config.auction_name,
          season_year: Number(config.season_year),
          auction_date: config.auction_date,
          num_teams: Number(config.num_teams),
          initial_purse: Number(config.initial_purse),
          min_base_price: Number(config.min_base_price),
          min_bid_increment: Number(config.min_bid_increment),
          min_squad_size: Number(config.min_squad_size),
          max_squad_size: Number(config.max_squad_size),
          timer_duration: Number(config.timer_duration),
          unsold_rule: config.unsold_rule,
          retention_rule: config.retention_rule,
          auction_format: config.auction_format,
          nomination_order: config.nomination_order,
        }),
      });
      setConfig(updated);
      onNotify("Auction configuration saved and synced across franchises.", "success");
      loadSetupData();
    } catch (err: any) {
      onNotify(`Failed to save config: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTeam = async (t: any) => {
    if (!isAuctioneer) {
      onNotify("Only the Auctioneer can edit franchise configuration.", "error");
      return;
    }
    try {
      await fetchApi(`/api/auction/teams/${t.team_id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          team_name: t.team_name,
          owner_name: t.owner_name,
          logo_text: t.logo_text || "EPL",
          purse_total: Number(t.purse_total),
          min_squad_size: Number(t.min_squad_size || 6),
          max_squad_size: Number(t.max_squad_size || 8),
        }),
      });
      onNotify(`Saved franchise configuration for ${t.team_name}.`, "success");
      loadSetupData();
    } catch (err: any) {
      onNotify(`Failed updating team: ${err.message}`, "error");
    }
  };

  const handleAddPoolPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuctioneer) {
      onNotify("Sign in as Official Auctioneer to add players.", "error");
      return;
    }
    if (!newName.trim()) return;
    try {
      const res = await fetchApi("/api/auction/pool", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          name: newName.trim(),
          primary_role: newRole,
          batting_hand: newHand,
          category: newCat,
          base_price: Number(newBasePrice),
          is_available: true,
        }),
      });
      onNotify(`Added ${res.name || newName} (${res.player_id}) to the auction pool.`, "success");
      setNewName("");
      loadSetupData();
    } catch (err: any) {
      onNotify(`Failed adding player: ${err.message}`, "error");
    }
  };

  const handleToggleAvailability = async (entry: any) => {
    if (!isAuctioneer) {
      onNotify("Sign in as Official Auctioneer to modify pool availability.", "error");
      return;
    }
    try {
      await fetchApi(`/api/auction/pool/${entry.entry_id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ is_available: !entry.is_available }),
      });
      loadSetupData();
    } catch (err: any) {
      onNotify(`Update failed: ${err.message}`, "error");
    }
  };

  const handleUpdatePoolBasePrice = async (entry: any, newBp: number) => {
    if (!isAuctioneer || isNaN(newBp) || newBp <= 0) return;
    try {
      await fetchApi(`/api/auction/pool/${entry.entry_id}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ base_price: newBp }),
      });
      onNotify(`Updated base price for ${entry.name} to ₹${newBp}L.`, "info");
      loadSetupData();
    } catch (err: any) {
      onNotify(`Update failed: ${err.message}`, "error");
    }
  };

  const handleRemoveEntry = async (entryId: number) => {
    if (!isAuctioneer) return;
    try {
      await fetchApi(`/api/auction/pool/${entryId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      onNotify("Removed player entry from auction pool.", "info");
      loadSetupData();
    } catch (err: any) {
      onNotify(`Delete failed: ${err.message}`, "error");
    }
  };

  const handleCsvImport = async () => {
    if (!isAuctioneer) {
      onNotify("Sign in as Official Auctioneer to import CSV.", "error");
      return;
    }
    if (!csvText.trim()) return;
    try {
      const res = await fetchApi("/api/auction/pool/import-csv", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ csv_text: csvText }),
      });
      onNotify(`CSV Import complete: ${res.added} added, ${res.updated} updated, ${res.skipped} skipped.`, "success");
      setCsvText("");
      setShowCsvBox(false);
      loadSetupData();
    } catch (err: any) {
      onNotify(`CSV Import failed: ${err.message}`, "error");
    }
  };

  const handleStartAuction = async () => {
    if (!isAuctioneer) {
      onNotify("Only the Official Auctioneer can start the auction.", "error");
      return;
    }
    try {
      await fetchApi("/api/auction/lifecycle/start", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ confirm: true }),
      });
      setConfirmOpen(false);
      onNotify("AUCTION STARTED! Configuration locked and Live Bidding Room opened.", "success");
      onAuctionStarted();
    } catch (err: any) {
      onNotify(`Start failed: ${err.message}`, "error");
    }
  };

  const poolColumns: DataTableColumn<any>[] = [
    {
      key: "name",
      header: "Player",
      minWidth: "165px",
      render: (r) => (
        <div>
          <Link href={`/players/${r.player_id}`} className="font-bold text-[#07203F] hover:text-[#A65E46]">
            {r.name}
          </Link>
          <span className="block text-[10px] font-mono text-[#07203F]/60">
            {r.player_id} • {r.is_returning ? "Returning" : "New Uncapped"}
          </span>
        </div>
      ),
    },
    { key: "primary_role", header: "Role", minWidth: "120px" },
    { key: "matches", header: "Mat", align: "right", minWidth: "56px" },
    {
      key: "total_runs",
      header: "Runs / Wkts",
      align: "right",
      minWidth: "88px",
      render: (r) => <span className="font-mono">{r.total_runs}r / {r.wickets}w</span>,
    },
    {
      key: "overall_rating",
      header: "EPL Rtg",
      align: "center",
      minWidth: "78px",
      render: (r) => <RatingBadge score={r.overall_rating || 0} size="sm" />,
    },
    { key: "category", header: "Category", minWidth: "135px" },
    {
      key: "base_price",
      header: "Base Price (L)",
      align: "right",
      minWidth: "96px",
      render: (r) => (
        <input
          type="number"
          step="0.5"
          min="1"
          disabled={!isAuctioneer || config?.locked}
          defaultValue={r.base_price}
          onBlur={(e) => {
            const v = parseFloat(e.target.value);
            if (v !== r.base_price) handleUpdatePoolBasePrice(r, v);
          }}
          className="w-16 px-1.5 py-0.5 text-right font-mono text-xs rounded border border-[#07203F]/20 bg-[#EBDED4]/30 disabled:opacity-60"
        />
      ),
    },
    {
      key: "is_available",
      header: "Status",
      align: "center",
      minWidth: "100px",
      render: (r) => (
        <button
          type="button"
          disabled={!isAuctioneer || config?.locked}
          onClick={() => handleToggleAvailability(r)}
          className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
            r.is_available
              ? "bg-[#07203F] text-[#EBDED4]"
              : "bg-[#EBDED4] text-[#A65E46] border border-[#A65E46]/40"
          }`}
        >
          {r.is_available ? "AVAILABLE" : "UNAVAILABLE"}
        </button>
      ),
    },
    {
      key: "actions",
      header: "Remove",
      sortable: false,
      align: "center",
      minWidth: "66px",
      render: (r) =>
        isAuctioneer && !config?.locked ? (
          <button
            type="button"
            onClick={() => handleRemoveEntry(r.entry_id)}
            className="p-1 text-[#A65E46] hover:text-[#02000D]"
            title="Remove from pool"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="text-[10px] text-[#07203F]/40">—</span>
        ),
    },
  ];

  if (loading || !config) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#07203F] border-t-transparent rounded-full mb-3"></div>
        <p className="font-serif text-base text-[#07203F]">Loading Pre-Auction Setup Wizard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lock / Role Notice */}
      {config.locked ? (
        <div className="bg-[#07203F] text-[#EBDED4] p-4 rounded-xl border border-[#D9AA90]/35 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-[#D9AA90]" />
            <span>
              <strong>Configuration Locked ({config.status})</strong> — Auction has started. Setup parameters are read-only until reset by the Auctioneer.
            </span>
          </div>
          <button
            type="button"
            onClick={onAuctionStarted}
            className="px-3 py-1.5 rounded bg-[#A65E46] text-[#EBDED4] font-semibold hover:bg-[#A65E46]/90"
          >
            Enter Live Bidding Room →
          </button>
        </div>
      ) : !isAuctioneer ? (
        <div className="bg-[#EBDED4] border-l-4 border-[#A65E46] p-3.5 rounded-r-lg text-xs text-[#07203F] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#A65E46] shrink-0" />
          <span>
            Viewing Pre-Auction Setup in <strong>read-only mode</strong>. Select the <strong>Official Auctioneer</strong> persona in the top bar to configure rules, teams, player pool, and launch the auction.
          </span>
        </div>
      ) : null}

      {/* 4-Step Wizard Navigation */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { id: "rules", num: "01", title: "Auction Rules & Format", sub: "18 configurable parameters", icon: Sliders },
          { id: "teams", num: "02", title: "Six Franchise Setup", sub: "Owners, purses & squad caps", icon: Shield },
          { id: "pool", num: "03", title: "Player Pool & CSV Import", sub: `${pool.length} players registered`, icon: Users },
          { id: "preview", num: "04", title: "Preview & Start Auction", sub: "Verify & lock configuration", icon: Eye },
        ].map((st) => {
          const Icon = st.icon;
          const active = step === st.id;
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => setStep(st.id as any)}
              className={`p-4 rounded-xl border text-left transition ${
                active
                  ? "bg-[#07203F] text-[#EBDED4] border-[#A65E46] shadow-md"
                  : "bg-white/90 text-[#07203F] border-[#07203F]/15 hover:bg-[#EBDED4]/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`font-mono text-xs font-bold ${active ? "text-[#D9AA90]" : "text-[#A65E46]"}`}>
                  STEP {st.num}
                </span>
                <Icon className="w-4 h-4 opacity-80" />
              </div>
              <div className="font-serif font-bold text-sm">{st.title}</div>
              <div className={`text-[10px] mt-0.5 ${active ? "text-[#EBDED4]/75" : "text-[#07203F]/65"}`}>
                {st.sub}
              </div>
            </button>
          );
        })}
      </div>

      {/* STEP 1: AUCTION RULES */}
      {step === "rules" && (
        <form onSubmit={handleSaveConfig} className="bg-white/95 rounded-xl border border-[#07203F]/20 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#07203F]/10 pb-3">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#07203F]">Auction Configuration &amp; Governance Rules</h3>
              <p className="text-xs text-[#07203F]/70">Every tournament parameter is persisted in SQLite and survives backend restarts.</p>
            </div>
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-[#EBDED4] text-[#07203F] font-bold">
              STATUS: {config.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#07203F] mb-1">1. Auction Name</label>
              <input type="text" disabled={!isAuctioneer || config.locked} value={config.auction_name} onChange={(e) => setConfig({ ...config, auction_name: e.target.value })} className="w-full px-3 py-2 rounded border border-[#07203F]/20 bg-[#EBDED4]/25" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#07203F] mb-1">2. Season / Year</label>
              <input type="number" disabled={!isAuctioneer || config.locked} value={config.season_year} onChange={(e) => setConfig({ ...config, season_year: e.target.value })} className="w-full px-3 py-2 rounded border border-[#07203F]/20 bg-[#EBDED4]/25 font-mono" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#07203F] mb-1">3. Auction Date</label>
              <input type="date" disabled={!isAuctioneer || config.locked} value={config.auction_date} onChange={(e) => setConfig({ ...config, auction_date: e.target.value })} className="w-full px-3 py-2 rounded border border-[#07203F]/20 bg-[#EBDED4]/25 font-mono" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#07203F] mb-1">4. Number of Teams</label>
              <input type="number" min={2} max={12} disabled={!isAuctioneer || config.locked} value={config.num_teams} onChange={(e) => setConfig({ ...config, num_teams: e.target.value })} className="w-full px-3 py-2 rounded border border-[#07203F]/20 bg-[#EBDED4]/25 font-mono" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#07203F] mb-1">5. Initial Purse per Team (Lakhs)</label>
              <input type="number" step="1" disabled={!isAuctioneer || config.locked} value={config.initial_purse} onChange={(e) => setConfig({ ...config, initial_purse: e.target.value })} className="w-full px-3 py-2 rounded border border-[#07203F]/20 bg-[#EBDED4]/25 font-mono" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#07203F] mb-1">6. Minimum Base Price (Lakhs)</label>
              <input type="number" step="0.5" disabled={!isAuctioneer || config.locked} value={config.min_base_price} onChange={(e) => setConfig({ ...config, min_base_price: e.target.value })} className="w-full px-3 py-2 rounded border border-[#07203F]/20 bg-[#EBDED4]/25 font-mono" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#07203F] mb-1">7. Minimum Bid Increment (Lakhs)</label>
              <input type="number" step="0.1" disabled={!isAuctioneer || config.locked} value={config.min_bid_increment} onChange={(e) => setConfig({ ...config, min_bid_increment: e.target.value })} className="w-full px-3 py-2 rounded border border-[#07203F]/20 bg-[#EBDED4]/25 font-mono" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#07203F] mb-1">8. Minimum Squad Size</label>
              <input type="number" min={4} max={15} disabled={!isAuctioneer || config.locked} value={config.min_squad_size} onChange={(e) => setConfig({ ...config, min_squad_size: e.target.value })} className="w-full px-3 py-2 rounded border border-[#07203F]/20 bg-[#EBDED4]/25 font-mono" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#07203F] mb-1">9. Maximum Squad Size</label>
              <input type="number" min={6} max={18} disabled={!isAuctioneer || config.locked} value={config.max_squad_size} onChange={(e) => setConfig({ ...config, max_squad_size: e.target.value })} className="w-full px-3 py-2 rounded border border-[#07203F]/20 bg-[#EBDED4]/25 font-mono" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#07203F] mb-1">10. Bidding Timer (Seconds)</label>
              <input type="number" min={5} max={120} disabled={!isAuctioneer || config.locked} value={config.timer_duration} onChange={(e) => setConfig({ ...config, timer_duration: e.target.value })} className="w-full px-3 py-2 rounded border border-[#07203F]/20 bg-[#EBDED4]/25 font-mono" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#07203F] mb-1">11. Nomination Order</label>
              <select disabled={!isAuctioneer || config.locked} value={config.nomination_order} onChange={(e) => setConfig({ ...config, nomination_order: e.target.value })} className="w-full px-3 py-2 rounded border border-[#07203F]/20 bg-[#EBDED4]/25">
                <option>Category Tier (Marquee First)</option>
                <option>Highest EPL Rating First</option>
                <option>Randomized Within Tier</option>
                <option>Manual Auctioneer Selection</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#07203F] mb-1">12. Auction Format</label>
              <select disabled={!isAuctioneer || config.locked} value={config.auction_format} onChange={(e) => setConfig({ ...config, auction_format: e.target.value })} className="w-full px-3 py-2 rounded border border-[#07203F]/20 bg-[#EBDED4]/25">
                <option>Live Ascending English Auction</option>
                <option>Accelerated Hybrid Auction</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-[10px] font-bold uppercase text-[#07203F] mb-1">13. Unsold Player Rule</label>
              <input type="text" disabled={!isAuctioneer || config.locked} value={config.unsold_rule} onChange={(e) => setConfig({ ...config, unsold_rule: e.target.value })} className="w-full px-3 py-2 rounded border border-[#07203F]/20 bg-[#EBDED4]/25" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase text-[#07203F] mb-1">14. Retention Rules</label>
              <input type="text" disabled={!isAuctioneer || config.locked} value={config.retention_rule} onChange={(e) => setConfig({ ...config, retention_rule: e.target.value })} className="w-full px-3 py-2 rounded border border-[#07203F]/20 bg-[#EBDED4]/25" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#07203F]/10">
            <span className="text-[11px] text-[#07203F]/70">
              Active Categories: {(config.categories || []).join(" • ")}
            </span>
            <div className="flex gap-2">
              {isAuctioneer && !config.locked && (
                <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-[#A65E46] text-[#EBDED4] hover:bg-[#A65E46]/90 text-xs font-semibold transition">
                  {saving ? "Saving..." : "Save Configuration"}
                </button>
              )}
              <button type="button" onClick={() => setStep("teams")} className="px-4 py-2 rounded bg-[#07203F] text-[#EBDED4] hover:bg-[#02000D] text-xs font-semibold transition">
                Next: Franchise Setup →
              </button>
            </div>
          </div>
        </form>
      )}

      {/* STEP 2: SIX FRANCHISES */}
      {step === "teams" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((t, idx) => (
              <div key={t.team_id} className="bg-white/95 rounded-xl border border-[#07203F]/20 p-4 shadow-sm space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-[#07203F]/10 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-[#07203F] text-[#D9AA90] font-serif font-bold flex items-center justify-center text-xs">
                      {t.logo_text || `T${t.team_id}`}
                    </div>
                    <span className="font-mono text-[10px] uppercase text-[#A65E46] font-bold">Franchise #{t.team_id}</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#07203F]/60">Authenticated Owner</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#07203F]">Team Name</label>
                    <input
                      type="text"
                      disabled={!isAuctioneer || config.locked}
                      value={t.team_name}
                      onChange={(e) => {
                        const copy = [...teams];
                        copy[idx] = { ...t, team_name: e.target.value };
                        setTeams(copy);
                      }}
                      className="w-full px-2.5 py-1.5 rounded border border-[#07203F]/20 bg-[#EBDED4]/25"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#07203F]">Owner Name</label>
                    <input
                      type="text"
                      disabled={!isAuctioneer || config.locked}
                      value={t.owner_name}
                      onChange={(e) => {
                        const copy = [...teams];
                        copy[idx] = { ...t, owner_name: e.target.value };
                        setTeams(copy);
                      }}
                      className="w-full px-2.5 py-1.5 rounded border border-[#07203F]/20 bg-[#EBDED4]/25"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#07203F]">Monogram</label>
                      <input
                        type="text"
                        maxLength={4}
                        disabled={!isAuctioneer || config.locked}
                        value={t.logo_text || ""}
                        onChange={(e) => {
                          const copy = [...teams];
                          copy[idx] = { ...t, logo_text: e.target.value.toUpperCase() };
                          setTeams(copy);
                        }}
                        className="w-full px-2 py-1 rounded border border-[#07203F]/20 bg-[#EBDED4]/25 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#07203F]">Purse (L)</label>
                      <input
                        type="number"
                        disabled={!isAuctioneer || config.locked}
                        value={t.purse_total}
                        onChange={(e) => {
                          const copy = [...teams];
                          copy[idx] = { ...t, purse_total: parseFloat(e.target.value) || 100 };
                          setTeams(copy);
                        }}
                        className="w-full px-2 py-1 rounded border border-[#07203F]/20 bg-[#EBDED4]/25 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#07203F]">Max Squad</label>
                      <input
                        type="number"
                        disabled={!isAuctioneer || config.locked}
                        value={t.max_squad_size}
                        onChange={(e) => {
                          const copy = [...teams];
                          copy[idx] = { ...t, max_squad_size: parseInt(e.target.value) || 8 };
                          setTeams(copy);
                        }}
                        className="w-full px-2 py-1 rounded border border-[#07203F]/20 bg-[#EBDED4]/25 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {isAuctioneer && !config.locked && (
                  <button
                    type="button"
                    onClick={() => handleSaveTeam(t)}
                    className="w-full py-1.5 rounded bg-[#07203F] text-[#EBDED4] hover:bg-[#A65E46] font-semibold transition"
                  >
                    Save Team #{t.team_id}
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={() => setStep("pool")} className="px-4 py-2 rounded bg-[#07203F] text-[#EBDED4] hover:bg-[#A65E46] text-xs font-semibold transition">
              Next: Auction Player Pool →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: AUCTION PLAYER POOL */}
      {step === "pool" && (
        <div className="space-y-5">
          {isAuctioneer && !config.locked && (
            <div className="bg-white/95 rounded-xl border border-[#07203F]/20 p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#07203F]/10 pb-2.5">
                <h3 className="font-serif text-base font-bold text-[#07203F]">Register New Player or Bulk CSV Import</h3>
                <button
                  type="button"
                  onClick={() => setShowCsvBox(!showCsvBox)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#EBDED4] text-[#07203F] hover:bg-[#D9AA90] text-xs font-semibold transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{showCsvBox ? "Close CSV Importer" : "Import Players via CSV"}</span>
                </button>
              </div>

              <form onSubmit={handleAddPoolPlayer} className="grid grid-cols-1 sm:grid-cols-6 gap-2.5 items-end text-xs">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-[#07203F]">Player Name</label>
                  <input type="text" required placeholder="Full Name..." value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full px-2.5 py-1.5 rounded border border-[#07203F]/20 bg-[#EBDED4]/25" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#07203F]">Role</label>
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full px-2 py-1.5 rounded border border-[#07203F]/20 bg-[#EBDED4]/25">
                    <option>All-rounder</option>
                    <option>Specialist Batsman</option>
                    <option>Specialist Bowler</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#07203F]">Category</label>
                  <select value={newCat} onChange={(e) => setNewCat(e.target.value)} className="w-full px-2 py-1.5 rounded border border-[#07203F]/20 bg-[#EBDED4]/25">
                    <option>Marquee / Elite</option>
                    <option>Tier 1 (High Impact)</option>
                    <option>Tier 2 (Solid Core)</option>
                    <option>Role Specialist</option>
                    <option>Uncapped / New</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#07203F]">Base (L)</label>
                  <input type="number" step="0.5" min="1" value={newBasePrice} onChange={(e) => setNewBasePrice(parseFloat(e.target.value) || 2)} className="w-full px-2 py-1.5 rounded border border-[#07203F]/20 bg-[#EBDED4]/25 font-mono" />
                </div>
                <button type="submit" className="px-3 py-1.5 rounded bg-[#07203F] text-[#EBDED4] hover:bg-[#A65E46] font-semibold inline-flex items-center justify-center gap-1 transition">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Player</span>
                </button>
              </form>

              {showCsvBox && (
                <div className="pt-3 border-t border-[#07203F]/10 space-y-2 text-xs">
                  <p className="text-[#07203F]/75">
                    Paste CSV with headers <code className="font-mono bg-[#EBDED4] px-1 rounded">name,role,category,base_price,batting_hand</code>. Returning canonical EPL players are matched automatically without creating duplicates.
                  </p>
                  <textarea
                    rows={4}
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder={"name,role,category,base_price,batting_hand\nRohan Mehta,All-rounder,Uncapped / New,2.0,RHB"}
                    className="w-full p-2.5 font-mono text-xs rounded border border-[#07203F]/20 bg-[#EBDED4]/20"
                  />
                  <button type="button" onClick={handleCsvImport} className="px-4 py-1.5 rounded bg-[#A65E46] text-[#EBDED4] font-semibold hover:bg-[#A65E46]/90">
                    Run Duplicate-Safe CSV Import
                  </button>
                </div>
              )}
            </div>
          )}

          <DataTable
            data={pool}
            columns={poolColumns}
            rowKey={(r) => r.entry_id}
            title={`Configured Auction Pool (${pool.filter((p) => p.is_available).length} Available / ${pool.length} Total)`}
            subtitle="Edit base prices inline or toggle availability before starting the auction"
            searchable
            defaultSortKey="overall_rating"
          />

          <div className="flex justify-end">
            <button type="button" onClick={() => setStep("preview")} className="px-4 py-2 rounded bg-[#A65E46] text-[#EBDED4] hover:bg-[#A65E46]/90 text-xs font-semibold transition">
              Proceed to Pre-Auction Preview →
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: PRE-AUCTION PREVIEW & START AUCTION */}
      {step === "preview" && preview && (
        <div className="space-y-6">
          <div className="bg-white/95 rounded-xl border border-[#07203F]/20 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#07203F]/10 pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#A65E46]">
                  Pre-Auction Readiness Audit
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#07203F]">{preview.config.auction_name}</h3>
                <p className="text-xs text-[#07203F]/70 mt-0.5">
                  Date: {preview.config.auction_date} • Format: {preview.config.auction_format} • Order: {preview.config.nomination_order}
                </p>
              </div>
              <span className="px-3 py-1 rounded bg-[#07203F] text-[#D9AA90] font-mono text-xs font-bold">
                {preview.pool_sufficient ? "POOL VERIFIED READY" : "POOL BELOW MIN SLOTS"}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#07203F] text-[#EBDED4] p-4 rounded-lg">
                <span className="text-[10px] uppercase text-[#D9AA90] block">Registered Pool</span>
                <span className="font-mono text-2xl font-bold">{preview.total_registered_players}</span>
                <span className="text-[11px] text-[#EBDED4]/75 block">
                  {preview.returning_players} Returning • {preview.new_players} New
                </span>
              </div>
              <div className="bg-[#07203F] text-[#EBDED4] p-4 rounded-lg">
                <span className="text-[10px] uppercase text-[#D9AA90] block">Franchises &amp; Purse</span>
                <span className="font-mono text-2xl font-bold">₹{preview.total_available_purse}L</span>
                <span className="text-[11px] text-[#EBDED4]/75 block">{preview.number_of_teams} Teams Total Pool</span>
              </div>
              <div className="bg-[#07203F] text-[#EBDED4] p-4 rounded-lg">
                <span className="text-[10px] uppercase text-[#D9AA90] block">Squad Limits</span>
                <span className="font-mono text-2xl font-bold">{preview.min_squad_size} – {preview.max_squad_size}</span>
                <span className="text-[11px] text-[#EBDED4]/75 block">Max {preview.max_league_slots} league roster slots</span>
              </div>
              <div className="bg-[#07203F] text-[#EBDED4] p-4 rounded-lg">
                <span className="text-[10px] uppercase text-[#D9AA90] block">Bidding Rules</span>
                <span className="font-mono text-2xl font-bold">+₹{preview.config.min_bid_increment}L</span>
                <span className="text-[11px] text-[#EBDED4]/75 block">Min Base ₹{preview.config.min_base_price}L • {preview.config.timer_duration}s Timer</span>
              </div>
            </div>

            {/* Category Distribution */}
            <div>
              <h4 className="font-serif text-sm font-bold text-[#07203F] mb-2">Category Distribution</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(preview.category_distribution || {}).map(([cat, cnt]: [string, any]) => (
                  <div key={cat} className="px-3 py-1.5 rounded bg-[#EBDED4]/70 border border-[#07203F]/15 text-xs">
                    <span className="font-semibold text-[#07203F]">{cat}:</span>{" "}
                    <span className="font-mono font-bold text-[#A65E46]">{cnt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* START AUCTION CTA */}
            <div className="bg-[#02000D] text-[#EBDED4] p-5 rounded-xl border border-[#A65E46]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-serif text-lg font-bold text-[#EBDED4]">Ready to Launch Live Auction?</h4>
                <p className="text-xs text-[#EBDED4]/75 mt-0.5">
                  Starting locks all configuration parameters, activates team purses, and opens the real-time WebSocket bidding room for all six franchise owners.
                </p>
              </div>
              {config.locked ? (
                <button
                  type="button"
                  onClick={onAuctionStarted}
                  className="px-5 py-3 rounded-lg bg-[#A65E46] text-[#EBDED4] font-bold text-xs uppercase tracking-wider hover:bg-[#A65E46]/90 transition shrink-0"
                >
                  Enter Active Live Room →
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!isAuctioneer}
                  onClick={() => setConfirmOpen(true)}
                  className="px-6 py-3 rounded-lg bg-[#A65E46] text-[#EBDED4] font-bold text-xs uppercase tracking-wider hover:bg-[#A65E46]/90 transition inline-flex items-center gap-2 disabled:opacity-40 shrink-0"
                >
                  <Play className="w-4 h-4" />
                  <span>START AUCTION</span>
                </button>
              )}
            </div>
          </div>

          {/* Explicit Confirmation Modal */}
          {confirmOpen && (
            <div className="fixed inset-0 z-50 bg-[#02000D]/75 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl border-2 border-[#07203F] max-w-md w-full p-6 space-y-4 shadow-2xl">
                <h3 className="font-serif text-xl font-bold text-[#07203F]">Confirm Official Auction Start</h3>
                <p className="text-xs text-[#07203F]/80 leading-relaxed">
                  You are about to lock the configuration for <strong>{preview.config.auction_name}</strong> ({preview.total_registered_players} players, {preview.number_of_teams} franchises, ₹{preview.total_available_purse}L combined purse) and launch the live bidding room.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(false)}
                    className="px-4 py-2 rounded border border-[#07203F]/25 text-xs font-semibold text-[#07203F] hover:bg-[#EBDED4]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleStartAuction}
                    className="px-4 py-2 rounded bg-[#A65E46] text-[#EBDED4] text-xs font-bold hover:bg-[#A65E46]/90 inline-flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm &amp; Start Live Auction</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
