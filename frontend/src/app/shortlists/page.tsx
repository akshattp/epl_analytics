"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bookmark, Trash2, Shield, Lock, Plus, CheckCircle2, AlertCircle
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { RatingBadge } from "@/components/RatingBadge";
import { DataTable, DataTableColumn } from "@/components/DataTable";

export default function ShortlistsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [shortlist, setShortlist] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Login form
  const [loginUsername, setLoginUsername] = useState("vipers");
  const [loginPin, setLoginPin] = useState("");
  const [authMsg, setAuthMsg] = useState<string | null>(null);

  // Add target form
  const [addPlayerId, setAddPlayerId] = useState("EPL-P-001");
  const [addPriority, setAddPriority] = useState("High");
  const [addMaxBid, setAddMaxBid] = useState(15.0);
  const [addNotes, setAddNotes] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const [aRes, pRes] = await Promise.all([
          fetchApi("/api/auth/accounts"),
          fetchApi("/api/auction/players"),
        ]);
        const owners = (aRes.personas || []).filter((x: any) => x.role === "team_owner");
        setAccounts(owners);
        setPlayers(pRes.players || []);
        if (pRes.players?.length) setAddPlayerId(pRes.players[0].player_id);

        const savedToken = window.localStorage.getItem("epl_auth_token");
        if (savedToken) {
          try {
            const me = await fetchApi("/api/auth/me", {
              headers: { Authorization: `Bearer ${savedToken}` },
            });
            setToken(savedToken);
            setUser(me.user);
            setTeam(me.team);
          } catch {
            window.localStorage.removeItem("epl_auth_token");
          }
        }
      } catch (err) {
        console.error("Failed initializing shortlists:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const loadShortlist = async (tok: string, tid: number) => {
    try {
      const res = await fetchApi(`/api/auction/shortlists/${tid}`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const items = res.shortlist || [];
      setShortlist(items);
      if (items.length > 0) {
        const balRes = await fetchApi("/api/auction/squad-balance", {
          method: "POST",
          body: JSON.stringify({
            team_id: tid,
            player_ids: items.map((i: any) => i.player_id),
          }),
        });
        setBalance(balRes);
      } else {
        setBalance(null);
      }
    } catch (err) {
      console.error("Failed loading private shortlist:", err);
    }
  };

  useEffect(() => {
    if (token && user?.role === "team_owner" && user.team_id) {
      loadShortlist(token, user.team_id);
    } else {
      setShortlist([]);
      setBalance(null);
    }
  }, [token, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMsg(null);
    try {
      const res = await fetchApi("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: loginUsername, password: loginPin.trim() }),
      });
      setToken(res.token);
      setUser(res.user);
      setTeam(res.team);
      setLoginPin("");
      window.localStorage.setItem("epl_auth_token", res.token);
      window.localStorage.setItem("epl_auth_user", JSON.stringify(res.user));
    } catch (err: any) {
      setAuthMsg(err.message || "Invalid franchise credentials.");
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setTeam(null);
    setShortlist([]);
    setBalance(null);
    window.localStorage.removeItem("epl_auth_token");
    window.localStorage.removeItem("epl_auth_user");
  };

  const handleAddTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user?.team_id) return;
    try {
      await fetchApi("/api/auction/shortlists", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          team_id: user.team_id,
          player_id: addPlayerId,
          priority: addPriority,
          max_target_bid: Number(addMaxBid),
          notes: addNotes,
        }),
      });
      setAddNotes("");
      setAuthMsg("Player saved to your confidential franchise shortlist.");
      loadShortlist(token, user.team_id);
    } catch (err: any) {
      setAuthMsg(`Failed: ${err.message}`);
    }
  };

  const handleRemove = async (shortlistId: number) => {
    if (!token || !user?.team_id) return;
    try {
      await fetchApi(`/api/auction/shortlists/${shortlistId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      loadShortlist(token, user.team_id);
    } catch (err) {
      console.error("Delete shortlist error:", err);
    }
  };

  const columns: DataTableColumn<any>[] = [
    {
      key: "player_name",
      header: "Target Player",
      minWidth: "165px",
      render: (r) => (
        <Link href={`/players/${r.player_id}`} className="font-bold text-[#101828] dark:text-[#F8FAFC] hover:text-[#2563EB] dark:text-[#3B82F6] transition">
          {r.player_name}
        </Link>
      ),
    },
    { key: "role", header: "Role", minWidth: "120px" },
    {
      key: "rating",
      header: "EPL Rtg",
      align: "center",
      minWidth: "80px",
      render: (r) => <RatingBadge score={r.rating || 0} size="sm" />,
    },
    {
      key: "priority",
      header: "Priority",
      align: "center",
      minWidth: "88px",
      render: (r) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          r.priority === "High" 
            ? "bg-[#2563EB] text-white" 
            : "bg-[#F8FAFC] dark:bg-[#0B1120] text-[#2563EB] dark:text-[#3B82F6] border border-[#E2E8F0] dark:border-[#334155]"
        }`}>
          {r.priority}
        </span>
      ),
    },
    {
      key: "max_target_bid",
      header: "Max Target (L)",
      align: "right",
      minWidth: "100px",
      render: (r) => <span className="font-mono font-bold text-[#2563EB] dark:text-[#3B82F6]">₹{Number(r.max_target_bid).toFixed(1)}L</span>,
    },
    {
      key: "valuation",
      header: "Est. Val (L)",
      align: "right",
      minWidth: "90px",
      render: (r) => <span className="font-mono text-[#2563EB] dark:text-[#3B82F6]">₹{Number(r.valuation).toFixed(1)}L</span>,
    },
    { key: "notes", header: "Private Notes", minWidth: "160px", sortable: false },
    {
      key: "actions",
      header: "Remove",
      sortable: false,
      align: "center",
      minWidth: "70px",
      render: (r) => (
        <button onClick={() => handleRemove(r.shortlist_id)} className="text-[#2563EB] dark:text-[#3B82F6] hover:text-[#2563EB] dark:text-[#3B82F6] transition p-1" title="Remove">
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full mb-3"></div>
        <p className="font-display text-lg text-[#2563EB] dark:text-[#3B82F6]">Verifying Franchise Session...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="border-b border-[#E2E8F0] dark:border-[#334155] pb-6 pt-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs uppercase font-bold tracking-widest text-[#2563EB] dark:text-[#3B82F6] mb-1.5">
            <Bookmark className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
            <span>Strictly Isolated Franchise Scouting</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#101828] dark:text-[#F8FAFC]">
            Private Shortlists &amp; Squad Builder
          </h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-2xl">
            Confidential auction target watchlists enforced with server-side Bearer authentication and strict per-franchise access isolation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <button onClick={handleLogout} className="px-3.5 py-2 rounded-lg border border-blue-200 dark:border-[#334155] text-[#101828] dark:text-[#F8FAFC] text-xs font-semibold hover:bg-white dark:bg-[#151F32] transition">
              Sign Out ({user.username})
            </button>
          )}
          <Link href="/auction" className="bg-[#2563EB] text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#1D4ED8] transition shadow-sm">
            Go to Live Auction →
          </Link>
        </div>
      </div>

      {/* Authentication Gate */}
      {!token || !user ? (
        <div className="max-w-md mx-auto bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] rounded-xl border border-[#E2E8F0] dark:border-[#334155] p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E2E8F0] dark:border-[#334155] pb-3">
            <Lock className="w-5 h-5 text-[#2563EB] dark:text-[#3B82F6]" />
            <div>
              <h2 className="font-display text-lg font-bold text-[#101828] dark:text-[#F8FAFC]">Franchise Owner Sign-In</h2>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">Only the authenticated owner can view or modify their private shortlist.</p>
            </div>
          </div>
          {authMsg && (
            <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#2563EB]/40 text-[#2563EB] dark:text-[#3B82F6] text-xs font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>{authMsg}</span>
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#2563EB] dark:text-[#3B82F6] mb-1">Franchise Owner Account</label>
              <select value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B1120] text-[#101828] dark:text-[#F8FAFC] focus:outline-none focus:border-[#E2E8F0] dark:border-[#334155]">
                {accounts.map((a) => (
                  <option key={a.username} value={a.username}>Team {a.team_id}: {a.display_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#2563EB] dark:text-[#3B82F6] mb-1">Owner PIN</label>
              <input type="password" required value={loginPin} onChange={(e) => setLoginPin(e.target.value)} placeholder="Enter franchise PIN..." className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B1120] text-[#101828] dark:text-[#F8FAFC] font-mono focus:outline-none focus:border-[#E2E8F0] dark:border-[#334155]" />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-bold transition shadow-sm">
              Unlock Private Shortlist
            </button>
          </form>
        </div>
      ) : user.role !== "team_owner" ? (
        <div className="bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] rounded-xl border border-[#2563EB] p-6 text-center space-y-2">
          <Shield className="w-8 h-8 mx-auto text-[#2563EB] dark:text-[#3B82F6]" />
          <h3 className="font-display text-lg font-bold text-[#101828] dark:text-[#F8FAFC]">Confidential Owner Area</h3>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] max-w-lg mx-auto">
            You are currently signed in as <strong>{user.display_name}</strong> (Auctioneer). Even the Auctioneer cannot inspect or modify franchise owners&apos; confidential shortlists. Sign out and sign in as a franchise owner to manage a team watchlist.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Franchise Header */}
          <div className="bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] p-5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#2563EB] dark:text-[#3B82F6] font-bold font-mono">Confidential Watchlist Unlocked</span>
              <h2 className="font-display text-2xl font-bold">{team?.team_name || user.display_name}</h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Owner: {team?.owner_name} • Remaining Purse: ₹{team?.purse_remaining ?? 100}L</p>
            </div>
            <span className="font-mono text-xs px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#334155] text-[#2563EB] dark:text-[#3B82F6]">
              {shortlist.length} Target(s) Saved
            </span>
          </div>

          {authMsg && (
            <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] border-l-4 border-[#2563EB] text-xs font-semibold text-[#2563EB] dark:text-[#3B82F6] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
              <span>{authMsg}</span>
            </div>
          )}

          {/* Add Target Player Form */}
          <form onSubmit={handleAddTarget} className="bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] rounded-xl border border-[#E2E8F0] dark:border-[#334155] p-5 shadow-md grid grid-cols-1 sm:grid-cols-12 gap-3 items-end text-xs">
            <div className="sm:col-span-4">
              <label className="block text-[10px] font-bold uppercase text-[#2563EB] dark:text-[#3B82F6] mb-1">Player</label>
              <select value={addPlayerId} onChange={(e) => setAddPlayerId(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B1120] text-[#101828] dark:text-[#F8FAFC] focus:outline-none focus:border-[#E2E8F0] dark:border-[#334155]">
                {players.map((p) => (
                  <option key={p.player_id} value={p.player_id}>
                    {p.name} ({p.primary_role} • Est ₹{p.estimated_valuation}L)
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase text-[#2563EB] dark:text-[#3B82F6] mb-1">Priority</label>
              <select value={addPriority} onChange={(e) => setAddPriority(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B1120] text-[#101828] dark:text-[#F8FAFC] focus:outline-none focus:border-[#E2E8F0] dark:border-[#334155]">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase text-[#2563EB] dark:text-[#3B82F6] mb-1">Max Bid (L)</label>
              <input type="number" step="0.5" min="1" value={addMaxBid} onChange={(e) => setAddMaxBid(parseFloat(e.target.value) || 10)} className="w-full px-2.5 py-2 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B1120] text-[#101828] dark:text-[#F8FAFC] font-mono focus:outline-none focus:border-[#E2E8F0] dark:border-[#334155]" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase text-[#2563EB] dark:text-[#3B82F6] mb-1">Private Note</label>
              <input type="text" value={addNotes} onChange={(e) => setAddNotes(e.target.value)} placeholder="Backup opener..." className="w-full px-2.5 py-2 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B1120] text-[#101828] dark:text-[#F8FAFC] focus:outline-none focus:border-[#E2E8F0] dark:border-[#334155]" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="w-full py-2 rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-bold inline-flex items-center justify-center gap-1 transition shadow-sm">
                <Plus className="w-3.5 h-3.5" />
                <span>Add Target</span>
              </button>
            </div>
          </form>

          {/* Squad Balance Audit */}
          {balance && (
            <div className="bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] rounded-xl p-5 border border-[#E2E8F0] dark:border-[#334155] space-y-3 shadow-md">
              <div className="flex flex-wrap justify-between items-center gap-2 border-b border-[#E2E8F0] dark:border-[#334155] pb-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#2563EB] dark:text-[#3B82F6] font-mono">Projected Watchlist Balance</span>
                  <h3 className="font-display text-lg font-bold">{balance.balance_status}</h3>
                </div>
                <div className="font-mono text-xs text-[#2563EB] dark:text-[#3B82F6]">
                  Avg Rating: <strong>{balance.average_rating}</strong> • Projected Cost: <strong>₹{balance.projected_cost}L</strong>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#334155] p-2.5 rounded-lg">
                <div>Batsmen: <strong className="font-mono text-[#101828] dark:text-[#F8FAFC]">{balance.composition?.specialist_batsmen}</strong></div>
                <div>Bowlers: <strong className="font-mono text-[#101828] dark:text-[#F8FAFC]">{balance.composition?.specialist_bowlers}</strong></div>
                <div>All-Rounders: <strong className="font-mono text-[#2563EB] dark:text-[#3B82F6]">{balance.composition?.all_rounders}</strong></div>
              </div>
              <ul className="list-disc list-inside text-xs text-[#101828] dark:text-[#F8FAFC]/85 space-y-1">
                {(balance.recommendations || []).map((rec: string, i: number) => <li key={i}>{rec}</li>)}
              </ul>
            </div>
          )}

          <DataTable
            data={shortlist}
            columns={columns}
            rowKey={(r) => r.shortlist_id}
            title="Confidential Target Shortlist"
            emptyMessage="Your private shortlist is empty. Add target players above."
          />
        </div>
      )}
    </div>
  );
}
