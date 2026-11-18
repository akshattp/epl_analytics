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
        <Link href={`/players/${r.player_id}`} className="font-bold text-[#07203F] hover:text-[#A65E46]">
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
          r.priority === "High" ? "bg-[#A65E46] text-[#EBDED4]" : "bg-[#EBDED4] text-[#07203F]"
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
      render: (r) => <span className="font-mono font-bold text-[#A65E46]">₹{Number(r.max_target_bid).toFixed(1)}L</span>,
    },
    {
      key: "valuation",
      header: "Est. Val (L)",
      align: "right",
      minWidth: "90px",
      render: (r) => <span className="font-mono">₹{Number(r.valuation).toFixed(1)}L</span>,
    },
    { key: "notes", header: "Private Notes", minWidth: "160px", sortable: false },
    {
      key: "actions",
      header: "Remove",
      sortable: false,
      align: "center",
      minWidth: "70px",
      render: (r) => (
        <button onClick={() => handleRemove(r.shortlist_id)} className="text-[#A65E46] hover:text-[#02000D] p-1" title="Remove">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#07203F] border-t-transparent rounded-full mb-3"></div>
        <p className="font-serif text-lg text-[#07203F]">Verifying Franchise Session...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-[#07203F]/20 pb-6 pt-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-semibold tracking-wider text-[#A65E46] mb-1">
            Strictly Isolated Franchise Scouting
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#02000D]">
            Private Shortlists &amp; Squad Builder
          </h1>
          <p className="text-sm text-[#07203F]/80 mt-1 max-w-2xl">
            Confidential auction target watchlists enforced with server-side Bearer authentication and strict per-franchise access isolation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <button onClick={handleLogout} className="px-3 py-2 rounded border border-[#07203F] text-[#07203F] text-xs font-semibold hover:bg-[#EBDED4]">
              Sign Out ({user.username})
            </button>
          )}
          <Link href="/auction" className="bg-[#07203F] text-[#EBDED4] px-4 py-2 rounded text-xs font-semibold hover:bg-[#A65E46] transition">
            Go to Live Auction →
          </Link>
        </div>
      </div>

      {/* Authentication Gate */}
      {!token || !user ? (
        <div className="max-w-md mx-auto bg-white/95 rounded-xl border border-[#07203F]/20 p-6 shadow-md space-y-4">
          <div className="flex items-center gap-2 text-[#07203F] border-b border-[#07203F]/10 pb-3">
            <Lock className="w-5 h-5 text-[#A65E46]" />
            <div>
              <h2 className="font-serif text-lg font-bold">Franchise Owner Sign-In</h2>
              <p className="text-[11px] text-[#07203F]/70">Only the authenticated owner can view or modify their private shortlist.</p>
            </div>
          </div>
          {authMsg && (
            <div className="p-2.5 rounded bg-[#EBDED4] text-[#A65E46] text-xs font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>{authMsg}</span>
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#07203F] mb-1">Franchise Owner Account</label>
              <select value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} className="w-full px-3 py-2 rounded border border-[#07203F]/20 bg-[#EBDED4]/30">
                {accounts.map((a) => (
                  <option key={a.username} value={a.username}>Team {a.team_id}: {a.display_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#07203F] mb-1">Owner PIN</label>
              <input type="password" required value={loginPin} onChange={(e) => setLoginPin(e.target.value)} placeholder="Enter franchise PIN..." className="w-full px-3 py-2 rounded border border-[#07203F]/20 bg-[#EBDED4]/30 font-mono" />
            </div>
            <button type="submit" className="w-full py-2.5 rounded bg-[#07203F] text-[#EBDED4] hover:bg-[#A65E46] font-bold transition">
              Unlock Private Shortlist
            </button>
          </form>
        </div>
      ) : user.role !== "team_owner" ? (
        <div className="bg-white/95 rounded-xl border border-[#A65E46] p-6 text-center space-y-2">
          <Shield className="w-8 h-8 mx-auto text-[#A65E46]" />
          <h3 className="font-serif text-lg font-bold text-[#07203F]">Confidential Owner Area</h3>
          <p className="text-xs text-[#07203F]/80 max-w-lg mx-auto">
            You are currently signed in as <strong>{user.display_name}</strong> (Auctioneer). Even the Auctioneer cannot inspect or modify franchise owners&apos; confidential shortlists. Sign out and sign in as a franchise owner to manage a team watchlist.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Franchise Header */}
          <div className="bg-[#07203F] text-[#EBDED4] p-5 rounded-xl border border-[#D9AA90]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#D9AA90] font-bold">Confidential Watchlist Unlocked</span>
              <h2 className="font-serif text-2xl font-bold">{team?.team_name || user.display_name}</h2>
              <p className="text-xs text-[#EBDED4]/80">Owner: {team?.owner_name} • Remaining Purse: ₹{team?.purse_remaining ?? 100}L</p>
            </div>
            <span className="font-mono text-xs px-3 py-1.5 rounded bg-[#02000D]/60 border border-[#D9AA90]/35 text-[#D9AA90]">
              {shortlist.length} Target(s) Saved
            </span>
          </div>

          {authMsg && (
            <div className="p-3 rounded bg-[#EBDED4] border-l-4 border-[#07203F] text-xs font-semibold text-[#07203F] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#A65E46]" />
              <span>{authMsg}</span>
            </div>
          )}

          {/* Add Target Player Form */}
          <form onSubmit={handleAddTarget} className="bg-white/95 rounded-xl border border-[#07203F]/20 p-5 shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-3 items-end text-xs">
            <div className="sm:col-span-4">
              <label className="block text-[10px] font-bold uppercase text-[#07203F] mb-1">Player</label>
              <select value={addPlayerId} onChange={(e) => setAddPlayerId(e.target.value)} className="w-full px-2.5 py-2 rounded border border-[#07203F]/20 bg-[#EBDED4]/25">
                {players.map((p) => (
                  <option key={p.player_id} value={p.player_id}>
                    {p.name} ({p.primary_role} • Est ₹{p.estimated_valuation}L)
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase text-[#07203F] mb-1">Priority</label>
              <select value={addPriority} onChange={(e) => setAddPriority(e.target.value)} className="w-full px-2.5 py-2 rounded border border-[#07203F]/20 bg-[#EBDED4]/25">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase text-[#07203F] mb-1">Max Bid (L)</label>
              <input type="number" step="0.5" min="1" value={addMaxBid} onChange={(e) => setAddMaxBid(parseFloat(e.target.value) || 10)} className="w-full px-2.5 py-2 rounded border border-[#07203F]/20 bg-[#EBDED4]/25 font-mono" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase text-[#07203F] mb-1">Private Note</label>
              <input type="text" value={addNotes} onChange={(e) => setAddNotes(e.target.value)} placeholder="Backup opener..." className="w-full px-2.5 py-2 rounded border border-[#07203F]/20 bg-[#EBDED4]/25" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="w-full py-2 rounded bg-[#A65E46] text-[#EBDED4] hover:bg-[#A65E46]/90 font-bold inline-flex items-center justify-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                <span>Add Target</span>
              </button>
            </div>
          </form>

          {/* Squad Balance Audit */}
          {balance && (
            <div className="bg-[#07203F] text-[#EBDED4] rounded-xl p-5 border border-[#D9AA90]/25 space-y-3">
              <div className="flex flex-wrap justify-between items-center gap-2 border-b border-[#D9AA90]/20 pb-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#D9AA90]">Projected Watchlist Balance</span>
                  <h3 className="font-serif text-lg font-bold">{balance.balance_status}</h3>
                </div>
                <div className="font-mono text-xs text-[#D9AA90]">
                  Avg Rating: <strong>{balance.average_rating}</strong> • Projected Cost: <strong>₹{balance.projected_cost}L</strong>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs bg-[#02000D]/40 p-2.5 rounded">
                <div>Batsmen: <strong className="font-mono">{balance.composition?.specialist_batsmen}</strong></div>
                <div>Bowlers: <strong className="font-mono">{balance.composition?.specialist_bowlers}</strong></div>
                <div>All-Rounders: <strong className="font-mono text-[#D9AA90]">{balance.composition?.all_rounders}</strong></div>
              </div>
              <ul className="list-disc list-inside text-xs text-[#EBDED4]/85">
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
