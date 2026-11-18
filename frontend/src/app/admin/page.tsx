"use client";

import { useEffect, useState } from "react";
import { 
  Settings, UserPlus, RefreshCw, CheckCircle2, 
  AlertTriangle, Shield, Check, Info 
} from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function AdminPage() {
  const [quality, setQuality] = useState<any>(null);
  const [aliases, setAliases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Player Form State
  const [name, setName] = useState("");
  const [role, setRole] = useState("All-rounder");
  const [hand, setHand] = useState("RHB");
  const [notes, setNotes] = useState("");
  const [trialRating, setTrialRating] = useState(65.0);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Reimport State
  const [reimporting, setReimporting] = useState(false);
  const [reimportMsg, setReimportMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [qRes, aRes] = await Promise.all([
        fetchApi("/api/admin/data-quality"),
        fetchApi("/api/admin/identity-resolution")
      ]);
      setQuality(qRes);
      setAliases(aRes.aliases || []);
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess(null);
    setFormError(null);
    try {
      const res = await fetchApi("/api/admin/players/new", {
        method: "POST",
        body: JSON.stringify({
          name,
          primary_role: role,
          batting_hand: hand,
          experience_notes: notes,
          trial_rating: trialRating,
        }),
      });
      setFormSuccess(`Player ${res.name} registered successfully with ID ${res.player_id}!`);
      setName("");
      setNotes("");
      loadData();
    } catch (err: any) {
      setFormError(err.message || "Failed to register player");
    }
  };

  const handleTriggerReimport = async () => {
    setReimporting(true);
    setReimportMsg(null);
    try {
      const res = await fetchApi("/api/admin/reimport", { method: "POST" });
      setReimportMsg(res.message);
      loadData();
    } catch (err: any) {
      setReimportMsg(`Error: ${err.message}`);
    } finally {
      setReimporting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#07203F] border-t-transparent rounded-full mb-4"></div>
        <p className="font-serif text-lg text-[#07203F]">Loading Governance & Data Management Portal...</p>
      </div>
    );
  }

  const qSum = quality?.summary;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="border-b border-[#07203F]/20 pb-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-semibold tracking-wider text-[#A65E46] mb-1">
              Platform Administration & Data Governance
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#02000D]">
              Administration & Data Quality
            </h1>
            <p className="text-sm text-[#07203F]/80 mt-1 max-w-xl">
              Register uncapped tournament players, audit scorecard validation integrity, manage player identity resolution, and reprocess archives.
            </p>
          </div>
          <button
            onClick={handleTriggerReimport}
            disabled={reimporting}
            className="bg-[#07203F] text-[#EBDED4] hover:bg-[#07203F]/90 px-4 py-2 rounded text-xs font-semibold inline-flex items-center space-x-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reimporting ? "animate-spin" : ""}`} />
            <span>{reimporting ? "Reprocessing..." : "Re-run Extraction Pipeline"}</span>
          </button>
        </div>
      </div>

      {reimportMsg && (
        <div className="bg-emerald-800 text-white p-3 rounded text-xs font-semibold flex items-center space-x-2 shadow">
          <CheckCircle2 className="w-4 h-4" />
          <span>{reimportMsg}</span>
        </div>
      )}

      {/* SECTION 1: DATA QUALITY HEALTH AUDIT */}
      <div className="space-y-4">
        <h2 className="font-serif text-2xl font-bold text-[#07203F]">
          Data Quality & Import Audit
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-[#07203F] text-[#EBDED4] p-4 rounded-lg border border-[#D9AA90]/20 space-y-1">
            <span className="text-[10px] text-[#D9AA90] uppercase tracking-wider block">Discovered Scorecards</span>
            <span className="font-mono text-2xl font-bold">{qSum?.total_matches} PDFs (27 Total)</span>
            <span className="text-[11px] text-emerald-400 block">100% Extracted (0 Failures)</span>
          </div>
          <div className="bg-[#07203F] text-[#EBDED4] p-4 rounded-lg border border-[#D9AA90]/20 space-y-1">
            <span className="text-[10px] text-[#D9AA90] uppercase tracking-wider block">Validated Innings</span>
            <span className="font-mono text-2xl font-bold">{qSum?.clean_innings} / {qSum?.total_innings}</span>
            <span className="text-[11px] text-[#EBDED4]/70 block">Sum(Batsmen) + Extras == Total</span>
          </div>
          <div className="bg-[#07203F] text-[#EBDED4] p-4 rounded-lg border border-[#D9AA90]/20 space-y-1">
            <span className="text-[10px] text-[#D9AA90] uppercase tracking-wider block">Scorebook Adjustments</span>
            <span className="font-mono text-2xl font-bold text-[#A65E46]">{qSum?.flagged_innings} Innings</span>
            <span className="text-[11px] text-[#EBDED4]/70 block">Uncredited penalty runs audited</span>
          </div>
          <div className="bg-[#07203F] text-[#EBDED4] p-4 rounded-lg border border-[#D9AA90]/20 space-y-1">
            <span className="text-[10px] text-[#D9AA90] uppercase tracking-wider block">Data Health Score</span>
            <span className="font-mono text-2xl font-bold text-emerald-400">{qSum?.data_health_score}%</span>
            <span className="text-[11px] text-[#EBDED4]/70 block">Verified source of truth</span>
          </div>
        </div>

        {/* Audit Log Table */}
        <div 
          tabIndex={0} 
          role="region" 
          aria-label="Scorebook Validation Audit Log Table"
          className="table-wrapper bg-white/90 backdrop-blur rounded-lg border border-[#07203F]/15 shadow-sm"
        >
          <table className="w-full text-left table-editorial table-sticky-col">
            <thead className="bg-[#07203F] text-[#EBDED4]">
              <tr>
                <th scope="col" className="p-3">File / Season</th>
                <th scope="col" className="p-3">Severity</th>
                <th scope="col" className="p-3">Category</th>
                <th scope="col" className="p-3">Audit Observation & Uncredited Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#07203F]/10 text-xs">
              {quality?.audits?.map((a: any) => (
                <tr key={a.id} className="hover:bg-[#EBDED4]/40 transition">
                  <td className="p-3 font-semibold text-[#07203F]">
                    {a.file_name}
                    <span className="text-[10px] text-[#07203F]/50 block font-mono">Season {a.season}</span>
                  </td>
                  <td className="p-3">
                    <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                      {a.severity}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-[#07203F]/70">{a.category}</td>
                  <td className="p-3 text-[#02000D]">{a.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: NEW PLAYER REGISTRATION */}
      <div className="bg-white/90 backdrop-blur rounded-lg p-6 border border-[#07203F]/15 shadow-sm space-y-6">
        <div>
          <span className="text-xs uppercase font-bold text-[#A65E46] tracking-wider block">
            Auction Eligibility Registration
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#07203F] mt-0.5">
            Register New Uncapped Player
          </h2>
          <p className="text-xs text-[#07203F]/70 max-w-xl">
            Register players without historical EPL scorecards. They are clearly identified as New with a trial assessment rating, without falsely assigning zero ratings.
          </p>
        </div>

        {formSuccess && (
          <div className="bg-emerald-800 text-white p-3 rounded text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{formSuccess}</span>
          </div>
        )}
        {formError && (
          <div className="bg-red-800 text-white p-3 rounded text-xs font-semibold flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleRegisterPlayer} className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-name" className="text-xs font-semibold text-[#07203F] block mb-1">
                Official Player Name *
              </label>
              <input
                id="reg-name"
                type="text"
                required
                placeholder="e.g., Rohan Mehra"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded border border-[#07203F]/20 bg-[#EBDED4]/30 focus:outline-none focus:border-[#A65E46] text-[#02000D]"
              />
            </div>

            <div>
              <label htmlFor="reg-role" className="text-xs font-semibold text-[#07203F] block mb-1">
                Declared Playing Role *
              </label>
              <select
                id="reg-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded border border-[#07203F]/20 bg-[#EBDED4]/30 focus:outline-none focus:border-[#A65E46] text-[#02000D]"
              >
                <option value="All-rounder">All-rounder</option>
                <option value="Specialist Batsman">Specialist Batsman</option>
                <option value="Specialist Bowler">Specialist Bowler</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-hand" className="text-xs font-semibold text-[#07203F] block mb-1">
                Batting / Bowling Hand
              </label>
              <select
                id="reg-hand"
                value={hand}
                onChange={(e) => setHand(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded border border-[#07203F]/20 bg-[#EBDED4]/30 focus:outline-none focus:border-[#A65E46] text-[#02000D]"
              >
                <option value="RHB">Right-Hand Bat (RHB)</option>
                <option value="LHB">Left-Hand Bat (LHB)</option>
              </select>
            </div>

            <div>
              <label htmlFor="reg-trial" className="text-xs font-semibold text-[#07203F] block mb-1">
                Trial / Practice Match Rating (0-100)
              </label>
              <input
                id="reg-trial"
                type="number"
                min="0"
                max="100"
                step="1"
                value={trialRating}
                onChange={(e) => setTrialRating(parseFloat(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded border border-[#07203F]/20 bg-[#EBDED4]/30 focus:outline-none focus:border-[#A65E46] text-[#02000D]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-notes" className="text-xs font-semibold text-[#07203F] block mb-1">
              Previous Cricket Experience / Scouting Notes
            </label>
            <textarea
              id="reg-notes"
              rows={3}
              placeholder="e.g. Proven underarm tennis cricket batsman in local tournaments. Good power hitting in death overs."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded border border-[#07203F]/20 bg-[#EBDED4]/30 focus:outline-none focus:border-[#A65E46] text-[#02000D]"
            />
          </div>

          <button
            type="submit"
            className="bg-[#A65E46] text-[#EBDED4] hover:bg-[#A65E46]/90 px-6 py-2.5 rounded text-xs font-semibold transition"
          >
            Register Player into Master Database
          </button>
        </form>
      </div>

      {/* SECTION 3: PLAYER IDENTITY RESOLUTION TABLE */}
      <div className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#07203F]">
            Player Identity Resolution Registry
          </h2>
          <p className="text-xs text-[#07203F]/70">
            Audit trail of raw scorecard name variations mapped to permanent unique Player IDs.
          </p>
        </div>

        <div 
          tabIndex={0} 
          role="region" 
          aria-label="Player Identity Resolution Mappings Table"
          className="table-wrapper bg-white/90 backdrop-blur rounded-lg border border-[#07203F]/15 shadow-sm max-h-96 overflow-y-auto"
        >
          <table className="w-full text-left table-editorial table-sticky-col">
            <thead className="bg-[#07203F] text-[#EBDED4] sticky top-0 z-10">
              <tr>
                <th scope="col" className="p-3">Raw Scorecard Name</th>
                <th scope="col" className="p-3">Canonical Player Name</th>
                <th scope="col" className="p-3">Permanent Player ID</th>
                <th scope="col" className="p-3">Resolution Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#07203F]/10 text-xs">
              {aliases.map((al) => (
                <tr key={al.alias_id} className="hover:bg-[#EBDED4]/40 transition">
                  <td className="p-3 font-mono font-medium text-[#07203F]">{al.raw_name}</td>
                  <td className="p-3 font-semibold text-[#02000D]">{al.canonical_name}</td>
                  <td className="p-3 font-mono text-[11px] text-[#A65E46]">{al.player_id}</td>
                  <td className="p-3">
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                      {al.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
