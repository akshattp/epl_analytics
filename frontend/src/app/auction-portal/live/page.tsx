"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Gavel, Users, DollarSign, Activity, AlertCircle,
  Trophy, Shield, Zap, Star, ArrowUpRight, Volume2,
  VolumeX, Clock, ChevronRight, Lock
} from "lucide-react";

interface CurrentPlayer {
  id: string;
  player_id: string;
  name: string;
  primary_role: string;
  base_price?: number;
  matches?: number;
  total_runs?: number;
  wickets?: number;
}

interface BidRecord {
  bidder_team_name: string;
  bidder_owner?: string;
  bid_amount: number;
  timestamp: string;
}

interface TeamState {
  id: number;
  name: string;
  owner_name: string;
  purse_remaining: number;
  squad_count: number;
}

export default function LiveAuctionTerminal() {
  const [connected, setConnected] = useState(false);
  const [auctionState, setAuctionState] = useState<string>("IDLE");
  const [currentPlayer, setCurrentPlayer] = useState<CurrentPlayer | null>(null);
  const [currentBid, setCurrentBid] = useState<number>(0);
  const [currentBidder, setCurrentBidder] = useState<any>(null);
  const [bidHistory, setBidHistory] = useState<BidRecord[]>([]);
  const [bidIncrement, setBidIncrement] = useState<number>(0.5);
  const [teams, setTeams] = useState<TeamState[]>([]);
  const [playerRankings, setPlayerRankings] = useState<any>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // User auth details
  const [currentUser, setCurrentUser] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Load auth from local storage
  useEffect(() => {
    const userStr = localStorage.getItem("epl_auction_user");
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch {}
    }
  }, []);

  // Fetch team balances
  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch("/api/auction/teams");
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Fetch player rankings dossier when nominated
  useEffect(() => {
    if (currentPlayer?.player_id) {
      fetch(`/api/rankings/player/${currentPlayer.player_id}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d && d.rankings) setPlayerRankings(d.rankings);
          else setPlayerRankings(null);
        })
        .catch(() => setPlayerRankings(null));
    } else {
      setPlayerRankings(null);
    }
  }, [currentPlayer]);

  // Connect WebSocket
  useEffect(() => {
    const token = localStorage.getItem("epl_auction_token") || "";
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/auction/ws${token ? `?token=${token}` : ""}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setAuthError(null);
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const ev = data.event;

        if (ev === "CONNECTION_ESTABLISHED") {
          const st = data.auction_state;
          if (st) {
            setAuctionState(st.state || "IDLE");
            setCurrentPlayer(st.current_player);
            setCurrentBid(st.current_bid || 0);
            setCurrentBidder(st.current_bidder);
            if (st.bid_history) setBidHistory(st.bid_history);
            if (st.bid_increment) setBidIncrement(st.bid_increment);
          }
        } else if (ev === "PLAYER_NOMINATED") {
          setCurrentPlayer(data.player);
          setCurrentBid(data.base_price || 2.0);
          setCurrentBidder(null);
          setAuctionState("BIDDING_ACTIVE");
          setBidHistory([]);
          if (data.bid_increment) setBidIncrement(data.bid_increment);
        } else if (ev === "NEW_HIGHEST_BID") {
          setCurrentBid(data.bid_amount);
          setCurrentBidder({
            team_id: data.bidder_team_id,
            team_name: data.bidder_team_name,
            owner_name: data.bidder_owner,
          });
          setBidHistory(prev => [
            {
              bidder_team_name: data.bidder_team_name,
              bidder_owner: data.bidder_owner,
              bid_amount: data.bid_amount,
              timestamp: new Date().toLocaleTimeString(),
            },
            ...prev.slice(0, 24)
          ]);
          fetchTeams();
        } else if (ev === "PLAYER_SOLD") {
          setAuctionState("SOLD");
          fetchTeams();
        } else if (ev === "PLAYER_UNSOLD") {
          setAuctionState("UNSOLD");
        } else if (ev === "AUCTION_PAUSED") {
          setAuctionState("PAUSED");
        } else if (ev === "AUCTION_RESUMED") {
          setAuctionState("BIDDING_ACTIVE");
        } else if (ev === "NOMINATION_CANCELLED") {
          setAuctionState("IDLE");
          setCurrentPlayer(null);
          setCurrentBid(0);
          setCurrentBidder(null);
        } else if (ev === "AUTH_ERROR") {
          setAuthError(data.message);
          setTimeout(() => setAuthError(null), 5000);
        } else if (ev === "BID_REJECTED") {
          setAuthError(`Bid Rejected: ${data.reason}`);
          setTimeout(() => setAuthError(null), 5000);
        }
      } catch {}
    };

    return () => {
      ws.close();
    };
  }, [fetchTeams]);

  // Place Bid Handler
  const handlePlaceBid = () => {
    if (!currentUser || currentUser.role !== "team_owner" || !currentUser.team_id) {
      setAuthError("Only verified Team Owners can submit bids.");
      return;
    }
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setAuthError("Auction network connection offline.");
      return;
    }

    const nextAmount = currentBid > 0 && currentBidder ? (currentBid + bidIncrement) : (currentBid || 2.0);

    const payload = {
      action: "BID",
      team_id: currentUser.team_id,
      team_name: currentUser.display_name,
      owner_name: currentUser.username,
      bid_amount: nextAmount
    };

    wsRef.current.send(JSON.stringify(payload));
  };

  const nextBidAmount = currentBid > 0 && currentBidder ? (currentBid + bidIncrement) : (currentBid || 2.0);
  const isOwner = currentUser?.role === "team_owner";
  const myTeam = teams.find(t => t.id === currentUser?.team_id);
  const canAfford = myTeam ? myTeam.purse_remaining >= nextBidAmount : true;
  const isHighestBidder = currentBidder?.team_id === currentUser?.team_id;

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#F1EBDD] flex flex-col">
      {/* Top Bar */}
      <header className="bg-[#111318]/90 backdrop-blur-md border-b border-[#2A2E38] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-['Space_Grotesk'] font-bold text-lg text-[#F1EBDD] tracking-tight">
                EPL<span className="text-[#FF4B35]">.</span>AUCTION
              </span>
            </Link>
            <div className="h-4 w-px bg-[#2A2E38]" />
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
              <span className="text-xs font-mono text-[#A8A295] hidden sm:inline">
                {connected ? "LIVE SYNCHRONIZATION" : "DISCONNECTED"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-[#F1EBDD]">{currentUser.display_name}</div>
                  <div className="text-[10px] font-mono text-[#FF4B35] uppercase">{currentUser.role}</div>
                </div>
                {currentUser.role === "team_owner" && (
                  <Link
                    href={`/auction-portal/owner/${currentUser.team_id}`}
                    className="px-3 py-1.5 rounded-lg bg-[#181A20] border border-[#2A2E38] text-xs font-semibold text-[#A8A295] hover:text-[#F1EBDD]"
                  >
                    Franchise Hub
                  </Link>
                )}
                {currentUser.role === "auctioneer" && (
                  <Link
                    href="/auction-portal/auctioneer"
                    className="px-3 py-1.5 rounded-lg bg-[#FF4B35]/20 border border-[#FF4B35]/40 text-xs font-semibold text-[#FF4B35]"
                  >
                    Controller
                  </Link>
                )}
              </div>
            ) : (
              <Link
                href="/auction-portal/login"
                className="px-3 py-1.5 rounded-lg bg-[#FF4B35] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#E03D28]"
              >
                Owner Sign In
              </Link>
            )}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-lg bg-[#181A20] text-[#A8A295] hover:text-[#F1EBDD]"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
            </button>
          </div>
        </div>
      </header>

      {authError && (
        <div className="bg-red-500/15 border-b border-red-500/30 text-red-400 text-xs py-2 px-4 text-center font-mono">
          {authError}
        </div>
      )}

      {/* Main Terminal Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Live Stage & Current Player (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-6">

          {/* Player Display & Bidding Card */}
          <div className="bg-[#111318] border border-[#2A2E38] rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="p-6 sm:p-8">

              {/* Status Header Badge */}
              <div className="flex items-center justify-between mb-6">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider font-mono border ${
                  auctionState === "BIDDING_ACTIVE" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse" :
                  auctionState === "PAUSED" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                  auctionState === "SOLD" ? "bg-blue-500/15 text-blue-400 border-blue-500/30" :
                  auctionState === "UNSOLD" ? "bg-red-500/15 text-red-400 border-red-500/30" :
                  "bg-[#2A2E38]/40 text-[#A8A295] border-[#2A2E38]"
                }`}>
                  STATUS: {auctionState}
                </span>

                <div className="text-right">
                  <span className="text-[11px] font-mono text-[#5C584E] uppercase">BASE PRICE</span>
                  <div className="text-sm font-bold font-mono text-[#A8A295]">
                    ₹{((currentPlayer?.base_price || 2.0) * 100000).toLocaleString()} (₹{(currentPlayer?.base_price || 2.0).toFixed(1)}L)
                  </div>
                </div>
              </div>

              {/* Player Identity */}
              {currentPlayer ? (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-3 mb-2">
                    <h1 className="text-3xl sm:text-4xl font-extrabold font-['Space_Grotesk'] text-[#F1EBDD] tracking-tight">
                      {currentPlayer.name}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-[#FF4B35]/15 text-[#FF4B35] border border-[#FF4B35]/30 w-fit">
                      {currentPlayer.primary_role}
                    </span>
                  </div>

                  {/* Player 4-Tier Dossier Mini Bar */}
                  {playerRankings ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
                      <div className="bg-[#181A20] border border-[#2A2E38] rounded-xl p-3">
                        <div className="flex items-center justify-between text-[10px] text-[#A8A295] uppercase font-mono">
                          <span>BAT SCORE</span>
                          <span>#{playerRankings.batting.rank || "—"}</span>
                        </div>
                        <div className="text-lg font-bold font-mono text-blue-400 mt-0.5">
                          {playerRankings.batting.score ? playerRankings.batting.score.toFixed(1) : "—"}
                        </div>
                        <div className="text-[9px] text-[#5C584E] uppercase">{playerRankings.batting.confidence_level} CONF</div>
                      </div>

                      <div className="bg-[#181A20] border border-[#2A2E38] rounded-xl p-3">
                        <div className="flex items-center justify-between text-[10px] text-[#A8A295] uppercase font-mono">
                          <span>BOWL SCORE</span>
                          <span>#{playerRankings.bowling.rank || "—"}</span>
                        </div>
                        <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                          {playerRankings.bowling.score ? playerRankings.bowling.score.toFixed(1) : "—"}
                        </div>
                        <div className="text-[9px] text-[#5C584E] uppercase">{playerRankings.bowling.confidence_level} CONF</div>
                      </div>

                      <div className="bg-[#181A20] border border-[#2A2E38] rounded-xl p-3">
                        <div className="flex items-center justify-between text-[10px] text-[#A8A295] uppercase font-mono">
                          <span>AR SCORE</span>
                          <span>#{playerRankings.allround.rank || "—"}</span>
                        </div>
                        <div className="text-lg font-bold font-mono text-purple-400 mt-0.5">
                          {playerRankings.allround.score ? playerRankings.allround.score.toFixed(1) : "—"}
                        </div>
                        <div className="text-[9px] text-[#5C584E] uppercase">
                          {playerRankings.allround.eligible ? "QUALIFIED" : "INELIGIBLE"}
                        </div>
                      </div>

                      <div className="bg-[#181A20] border border-[#2A2E38] rounded-xl p-3">
                        <div className="flex items-center justify-between text-[10px] text-[#A8A295] uppercase font-mono">
                          <span>OVERALL</span>
                          <span>#{playerRankings.overall.rank || "—"}</span>
                        </div>
                        <div className="text-lg font-bold font-mono text-[#FF4B35] mt-0.5">
                          {playerRankings.overall.score ? playerRankings.overall.score.toFixed(1) : "—"}
                        </div>
                        <div className="text-[9px] text-[#5C584E] uppercase">{playerRankings.overall.path}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="my-6 p-4 rounded-xl bg-[#181A20]/50 border border-[#2A2E38] text-xs text-[#5C584E]">
                      Athletic dossier indexing in progress...
                    </div>
                  )}

                  {/* Highest Current Bid Display */}
                  <div className="mt-8 pt-8 border-t border-[#2A2E38]">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div>
                        <div className="text-xs uppercase tracking-widest text-[#A8A295] font-mono">CURRENT LEADING BID</div>
                        <div className="text-5xl sm:text-6xl font-extrabold font-mono text-[#FF4B35] mt-1 tracking-tight">
                          ₹{(currentBid * 100000).toLocaleString()}
                        </div>
                        <div className="text-xs text-[#5C584E] mt-1 font-mono">
                          Equivalent: ₹{currentBid.toFixed(2)} Lakhs
                        </div>
                      </div>

                      <div className="bg-[#181A20] border border-[#2A2E38] p-4 rounded-xl sm:min-w-[240px]">
                        <div className="text-[10px] uppercase font-mono text-[#5C584E]">HELD BY FRANCHISE</div>
                        <div className="text-base font-bold text-[#F1EBDD] mt-0.5">
                          {currentBidder?.team_name || "Awaiting Initial Bid"}
                        </div>
                        {currentBidder?.owner_name && (
                          <div className="text-xs text-[#A8A295]">{currentBidder.owner_name}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bid Button Action Box */}
                  <div className="mt-8">
                    {isOwner ? (
                      <div className="space-y-3">
                        <button
                          onClick={handlePlaceBid}
                          disabled={auctionState !== "BIDDING_ACTIVE" || isHighestBidder || !canAfford}
                          className="w-full py-4 px-6 rounded-2xl bg-[#FF4B35] hover:bg-[#E03D28] text-white font-black text-lg uppercase tracking-wider shadow-lg shadow-[#FF4B35]/25 transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-mono"
                        >
                          <Gavel className="w-6 h-6" />
                          {isHighestBidder ? "YOU HOLD LEADING BID" :
                           !canAfford ? "INSUFFICIENT FRANCHISE PURSE" :
                           auctionState !== "BIDDING_ACTIVE" ? "BIDDING CURRENTLY PAUSED" :
                           `BID ₹${(nextBidAmount * 100000).toLocaleString()} (₹${nextBidAmount.toFixed(1)}L)`}
                        </button>
                        <div className="flex justify-between text-[11px] font-mono text-[#5C584E] px-2">
                          <span>Next Bid Step: +₹{(bidIncrement * 100000).toLocaleString()}</span>
                          <span>My Remaining Purse: ₹{((myTeam?.purse_remaining || 0) * 100000).toLocaleString()}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-[#181A20] border border-[#2A2E38] text-center">
                        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#A8A295]">
                          <Lock className="w-4 h-4 text-[#FF4B35]" />
                          Spectator Mode Active
                        </div>
                        <p className="text-[11px] text-[#5C584E] mt-1">
                          Only verified Franchise Owners logged in with team credentials may submit live bids.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#181A20] border border-[#2A2E38] flex items-center justify-center mx-auto text-[#5C584E]">
                    <Clock className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-['Space_Grotesk'] text-[#F1EBDD]">Waiting for Next Athlete</h3>
                    <p className="text-xs text-[#5C584E] max-w-sm mx-auto mt-1">
                      The official auctioneer is preparing the next player pool nomination.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Bid History Feed */}
          <div className="bg-[#111318] border border-[#2A2E38] rounded-2xl p-6 flex-1">
            <h2 className="text-sm font-bold font-['Space_Grotesk'] text-[#F1EBDD] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#FF4B35]" />
              Real-Time Bidding Log
            </h2>

            {bidHistory.length === 0 ? (
              <div className="text-xs text-[#5C584E] font-mono italic py-4">
                No active bids placed in this lot yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto font-mono text-xs pr-2">
                {bidHistory.map((bid, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-[#181A20] border border-[#2A2E38]/50">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF4B35]" />
                      <span className="font-bold text-[#F1EBDD]">{bid.bidder_team_name}</span>
                      {bid.bidder_owner && <span className="text-[#5C584E]">({bid.bidder_owner})</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#FF4B35]">₹{(bid.bid_amount * 100000).toLocaleString()}</span>
                      <span className="text-[10px] text-[#5C584E]">{bid.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: All Franchise Purse & Squad Dashboard (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#111318] border border-[#2A2E38] rounded-2xl p-6">
            <h2 className="text-sm font-bold font-['Space_Grotesk'] text-[#F1EBDD] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#FF4B35]" />
              Franchise Standings
            </h2>

            <div className="space-y-3">
              {teams.length === 0 ? (
                <div className="text-xs text-[#5C584E]">Loading team data...</div>
              ) : (
                teams.map(t => {
                  const isCurrent = currentBidder?.team_id === t.id;
                  const isMine = currentUser?.team_id === t.id;
                  return (
                    <div
                      key={t.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isCurrent ? "bg-[#FF4B35]/10 border-[#FF4B35]/50" :
                        isMine ? "bg-[#181A20] border-[#3B82F6]/50" :
                        "bg-[#181A20]/60 border-[#2A2E38]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-[#F1EBDD] flex items-center gap-1.5">
                            {t.name}
                            {isMine && <span className="text-[9px] px-1 rounded bg-[#3B82F6]/20 text-[#3B82F6] font-mono">YOU</span>}
                          </div>
                          <div className="text-[10px] text-[#5C584E] mt-0.5">{t.owner_name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-[#FF4B35]">
                            ₹{(t.purse_remaining * 100000).toLocaleString()}
                          </div>
                          <div className="text-[10px] font-mono text-[#5C584E]">
                            ₹{t.purse_remaining.toFixed(1)}L | {t.squad_count} Signed
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Links Card */}
          <div className="bg-[#111318] border border-[#2A2E38] rounded-2xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#A8A295] font-mono mb-3">Intelligence Portals</h3>
            <div className="space-y-2">
              <Link
                href="/rankings"
                target="_blank"
                className="flex items-center justify-between p-3 rounded-xl bg-[#181A20] hover:bg-[#22252D] text-xs font-semibold text-[#F1EBDD] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#FF4B35]" />
                  Four-Tier Player Rankings
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#5C584E]" />
              </Link>
              <Link
                href="/players"
                target="_blank"
                className="flex items-center justify-between p-3 rounded-xl bg-[#181A20] hover:bg-[#22252D] text-xs font-semibold text-[#F1EBDD] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#FF4B35]" />
                  Historical Player Dossiers
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#5C584E]" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
