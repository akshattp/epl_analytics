"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mic, MicOff, Users, DollarSign, Trophy,
  LogOut, Gavel, CheckCircle, XCircle,
  TrendingUp, ChevronRight, AlertCircle, Zap
} from "lucide-react";

interface AuctionState {
  status: string;
  current_player?: {
    player_id: string;
    name: string;
    role: string;
    base_price?: number;
  };
  current_bid?: number;
  current_bidder?: string;
  current_bidder_team?: string;
  teams?: Record<string, { name: string; purse_remaining: number; squad_size: number }>;
}

interface PoolPlayer {
  player_id: string;
  name: string;
  role: string;
  base_price: number;
  status: string;
}

function useAuctioneerAuth() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("epl_auction_role");
    const token = localStorage.getItem("epl_auction_token");
    if (!token || role !== "auctioneer") {
      router.replace("/auction-portal/login");
      return;
    }
    setAuthed(true);
  }, [router]);

  return authed;
}

export default function AuctioneerControlCenter() {
  const authed = useAuctioneerAuth();
  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);
  const [auctionState, setAuctionState] = useState<AuctionState>({ status: "idle" });
  const [pool, setPool] = useState<PoolPlayer[]>([]);
  const [bidHistory, setBidHistory] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [nomineeId, setNomineeId] = useState("");

  const getToken = () => localStorage.getItem("epl_auction_token") || "";

  // Load pool
  useEffect(() => {
    if (!authed) return;
    fetch("/api/auction/pool")
      .then(r => r.json())
      .then(d => setPool(d.pool || []))
      .catch(() => {});
  }, [authed]);

  // WebSocket connect
  const connectWs = useCallback(() => {
    const token = getToken();
    const wsUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/api/auction/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const ev = data.event;
        if (ev === "CONNECTION_ESTABLISHED") {
          const st = data.auction_state;
          if (st) {
            setAuctionState({
              status: st.state || "idle",
              current_player: st.current_player,
              current_bid: st.current_bid,
              current_bidder: st.current_bidder?.owner_name,
              current_bidder_team: st.current_bidder?.team_name
            });
          }
        } else if (ev === "PLAYER_NOMINATED") {
          setAuctionState({
            status: "BIDDING_ACTIVE",
            current_player: data.player,
            current_bid: data.base_price,
            current_bidder: undefined,
            current_bidder_team: undefined
          });
          setBidHistory([]);
        } else if (ev === "NEW_HIGHEST_BID") {
          setAuctionState(prev => ({
            ...prev,
            current_bid: data.bid_amount,
            current_bidder: data.bidder_owner,
            current_bidder_team: data.bidder_team_name
          }));
          setBidHistory(h => [`${data.bidder_team_name}: ₹${((data.bid_amount || 0) * 100000).toLocaleString()}`, ...h.slice(0, 29)]);
        } else if (ev === "PLAYER_SOLD") {
          setAuctionState(prev => ({ ...prev, status: "SOLD" }));
        } else if (ev === "PLAYER_UNSOLD") {
          setAuctionState(prev => ({ ...prev, status: "UNSOLD" }));
        } else if (ev === "AUCTION_PAUSED") {
          setAuctionState(prev => ({ ...prev, status: "PAUSED" }));
        } else if (ev === "AUCTION_RESUMED") {
          setAuctionState(prev => ({ ...prev, status: "BIDDING_ACTIVE" }));
        }
      } catch { /* ignore */ }
    };
  }, []);

  useEffect(() => {
    if (!authed) return;
    connectWs();
    return () => wsRef.current?.close();
  }, [authed, connectWs]);

  function sendWsAction(action: string, payload: Record<string, unknown> = {}) {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action, ...payload }));
    }
  }

  function nominatePlayer() {
    if (!nomineeId) return;
    const selected = pool.find(p => p.player_id === nomineeId);
    if (!selected) return;
    sendWsAction("NOMINATE", {
      player: {
        id: selected.player_id,
        player_id: selected.player_id,
        name: selected.name,
        primary_role: selected.role,
        base_price: selected.base_price,
      },
      base_price: selected.base_price
    });
    setNomineeId("");
  }

  function markSold() { sendWsAction("SOLD"); }
  function markUnsold() { sendWsAction("UNSOLD"); }
  function pauseAuction() { sendWsAction("PAUSE"); }

  function logout() {
    localStorage.clear();
    router.replace("/auction-portal/login");
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#111318] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF4B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cp = auctionState.current_player;
  const currentBid = auctionState.current_bid || 0;
  const teams = auctionState.teams || {};
  const availablePlayers = pool.filter(p => p.status === "available");

  return (
    <div className="min-h-screen bg-[#111318] text-[#F1EBDD]">
      {/* Header */}
      <div className="bg-[#0D1017] border-b border-[#2A2E38]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#FF4B35]/10 border border-[#FF4B35]/30 flex items-center justify-center">
                <Gavel className="w-5 h-5 text-[#FF4B35]" />
              </div>
              <div>
                <h1 className="text-lg font-bold font-['Space_Grotesk']">Auctioneer Control Center</h1>
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                  <span className="text-[#A8A295]">{connected ? "Live Connection" : "Disconnected"}</span>
                  {!connected && (
                    <button onClick={connectWs} className="text-[#FF4B35] hover:underline ml-1">Reconnect</button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/auction-portal/live"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF4B35]/10 border border-[#FF4B35]/30 text-sm text-[#FF4B35] hover:bg-[#FF4B35]/20 transition-colors"
              >
                <Zap className="w-4 h-4" />
                Full View
              </Link>
              <button onClick={logout} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#181A20] border border-[#2A2E38] text-sm text-[#A8A295] hover:text-[#F1EBDD] transition-colors">
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Current Player — Centre Stage */}
          <div className="lg:col-span-2 space-y-4">
            {/* Current player spotlight */}
            <div className="bg-[#0D1017] border border-[#2A2E38] rounded-2xl p-6">
              <div className="text-[11px] font-mono uppercase tracking-widest text-[#A8A295] mb-3">
                Currently on Block
              </div>
              {cp ? (
                <div>
                  <div className="text-3xl font-bold font-['Space_Grotesk'] text-[#F1EBDD] mb-1">{cp.name}</div>
                  <div className="text-sm text-[#A8A295] mb-4">{cp.role}</div>
                  <div className="flex items-end gap-4">
                    <div>
                      <div className="text-[11px] text-[#4A5068] uppercase tracking-widest">Current Bid</div>
                      <div className="font-mono text-4xl font-bold text-[#FF4B35]">
                        ₹{(currentBid / 100000).toFixed(1)}L
                      </div>
                    </div>
                    {auctionState.current_bidder_team && (
                      <div className="pb-1">
                        <div className="text-[11px] text-[#4A5068] uppercase tracking-widest">Leading Bid By</div>
                        <div className="text-lg font-semibold text-emerald-400">{auctionState.current_bidder_team}</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-6 text-[#4A5068]">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">No player currently on block. Nominate one below.</span>
                </div>
              )}
            </div>

            {/* Auctioneer actions */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={markSold}
                disabled={!cp}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-6 h-6" />
                <span className="text-xs font-bold uppercase tracking-wider">SOLD</span>
              </button>
              <button
                onClick={markUnsold}
                disabled={!cp}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <XCircle className="w-6 h-6" />
                <span className="text-xs font-bold uppercase tracking-wider">UNSOLD</span>
              </button>
              <button
                onClick={pauseAuction}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors"
              >
                <MicOff className="w-6 h-6" />
                <span className="text-xs font-bold uppercase tracking-wider">PAUSE</span>
              </button>
            </div>

            {/* Player nomination */}
            <div className="bg-[#0D1017] border border-[#2A2E38] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Mic className="w-4 h-4 text-[#FF4B35]" />
                <h2 className="text-sm font-bold uppercase tracking-widest">Nominate Player</h2>
              </div>
              <div className="flex gap-2">
                <select
                  value={nomineeId}
                  onChange={e => setNomineeId(e.target.value)}
                  className="flex-1 bg-[#181A20] border border-[#2A2E38] rounded-xl px-4 py-2.5 text-sm text-[#F1EBDD] focus:outline-none focus:border-[#FF4B35] transition-colors"
                >
                  <option value="">Select player…</option>
                  {availablePlayers.map(p => (
                    <option key={p.player_id} value={p.player_id}>
                      {p.name} ({p.role}) — Base: ₹{(p.base_price / 100000).toFixed(1)}L
                    </option>
                  ))}
                </select>
                <button
                  onClick={nominatePlayer}
                  disabled={!nomineeId}
                  className="px-5 py-2.5 rounded-xl bg-[#FF4B35] text-white text-sm font-bold disabled:opacity-30 hover:bg-[#E03D28] transition-colors"
                >
                  Nominate
                </button>
              </div>
            </div>

            {/* Bid history */}
            <div className="bg-[#0D1017] border border-[#2A2E38] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-[#FF4B35]" />
                <h2 className="text-sm font-bold uppercase tracking-widest">Bid Feed</h2>
              </div>
              {bidHistory.length === 0 ? (
                <p className="text-xs text-[#4A5068] italic">No bids yet.</p>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {bidHistory.map((b, i) => (
                    <div key={i} className="text-xs font-mono text-[#A8A295] py-1 border-b border-[#2A2E38]/40">
                      {b}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Team purse overview */}
          <div className="space-y-4">
            <div className="bg-[#0D1017] border border-[#2A2E38] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-[#FF4B35]" />
                <h2 className="text-sm font-bold uppercase tracking-widest">Team Purses</h2>
              </div>
              {Object.keys(teams).length === 0 ? (
                <p className="text-xs text-[#4A5068] italic">Connect to auction to see live purse data.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(teams).map(([tid, team]) => (
                    <div key={tid}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-[#F1EBDD] truncate">{team.name}</span>
                        <span className="font-mono text-xs text-emerald-400">₹{(team.purse_remaining / 100000).toFixed(1)}L</span>
                      </div>
                      <div className="text-[10px] text-[#4A5068]">{team.squad_size} players · {tid}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Player pool summary */}
            <div className="bg-[#0D1017] border border-[#2A2E38] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-4 h-4 text-[#FF4B35]" />
                <h2 className="text-sm font-bold uppercase tracking-widest">Player Pool</h2>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div>
                  <div className="font-mono text-xl font-bold text-[#FF4B35]">{pool.filter(p => p.status === "available").length}</div>
                  <div className="text-[10px] text-[#4A5068]">Available</div>
                </div>
                <div>
                  <div className="font-mono text-xl font-bold text-emerald-400">{pool.filter(p => p.status === "sold").length}</div>
                  <div className="text-[10px] text-[#4A5068]">Sold</div>
                </div>
                <div>
                  <div className="font-mono text-xl font-bold text-[#A8A295]">{pool.filter(p => p.status === "unsold").length}</div>
                  <div className="text-[10px] text-[#4A5068]">Unsold</div>
                </div>
              </div>
            </div>

            <Link
              href="/rankings"
              className="flex items-center gap-3 p-4 rounded-xl bg-[#0D1017] border border-[#2A2E38] hover:border-[#FF4B35]/30 transition-colors group"
            >
              <DollarSign className="w-5 h-5 text-[#FF4B35]" />
              <div>
                <div className="text-sm font-semibold text-[#F1EBDD] group-hover:text-[#FF4B35] transition-colors">Player Rankings</div>
                <div className="text-xs text-[#4A5068]">Research before nominating</div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#4A5068] ml-auto" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
