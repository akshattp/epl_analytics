"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Gavel, Shield, Clock, AlertCircle, RotateCcw, TrendingUp, Zap, Play,
  Check, X, Sparkles, CheckCircle2, Sliders, Trophy, Pause, FastForward,
  FileText, FileSpreadsheet
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { RatingBadge } from "@/components/RatingBadge";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { AuctionSetupWizard } from "@/components/AuctionSetupWizard";

interface UserAccount {
  username: string;
  role: string;
  team_id?: number | null;
  display_name: string;
}

export default function AuctionCenterPage() {
  const [activeTab, setActiveTab] = useState<"setup" | "live" | "dashboard" | "results" | "simulation">("setup");

  // Core Data
  const [config, setConfig] = useState<any>(null);
  const [pool, setPool] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [persistedBids, setPersistedBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Authentication & Persona
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [loginUsername, setLoginUsername] = useState<string>("auctioneer");
  const [loginPin, setLoginPin] = useState<string>("");

  // Live WebSocket State
  const [wsConnected, setWsConnected] = useState(false);
  const [auctionState, setAuctionState] = useState<string>("IDLE");
  const [podiumPlayer, setPodiumPlayer] = useState<any>(null);
  const [currentBid, setCurrentBid] = useState<number>(0);
  const [currentBidder, setCurrentBidder] = useState<any>(null);
  const [bidHistory, setBidHistory] = useState<any[]>([]);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [bidAlert, setBidAlert] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [scarcityInfo, setScarcityInfo] = useState<any>(null);

  // Controls
  const [selectedNominationId, setSelectedNominationId] = useState<string>("");
  const [customBasePrice, setCustomBasePrice] = useState<number>(2.0);
  const [customBidAmount, setCustomBidAmount] = useState<string>("");

  // Dashboard & Results
  const [dashboardTeamId, setDashboardTeamId] = useState<number>(1);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [resultsData, setResultsData] = useState<any>(null);
  const [exportingResults, setExportingResults] = useState<string | null>(null);

  // Simulation
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const notify = (message: string, type: "success" | "error" | "info" = "info") => {
    setBidAlert({ message, type });
  };

  const refreshCore = async (autoRouteTab = false) => {
    try {
      const [cfgRes, pRes, poolRes, tRes, aRes, bhRes] = await Promise.all([
        fetchApi("/api/auction/config"),
        fetchApi("/api/auction/players"),
        fetchApi("/api/auction/pool"),
        fetchApi("/api/auction/teams"),
        fetchApi("/api/auth/accounts"),
        fetchApi("/api/auction/bid-history?limit=100"),
      ]);
      setConfig(cfgRes);
      setPlayers(pRes.players || []);
      setPool(poolRes.pool || []);
      setTeams(tRes.teams || []);
      setAccounts(aRes.personas || aRes.accounts || []);
      setPersistedBids(bhRes.bids || []);

      const nextPending = (poolRes.pool || []).find((e: any) => e.is_available && e.auction_status === "PENDING");
      if (nextPending) {
        setSelectedNominationId(nextPending.player_id);
        setCustomBasePrice(nextPending.base_price || 2.0);
      } else if (pRes.players?.length > 0 && !selectedNominationId) {
        setSelectedNominationId(pRes.players[0].player_id);
        setCustomBasePrice(pRes.players[0].base_price || 2.0);
      }

      if (autoRouteTab) {
        if (cfgRes?.status === "IN_PROGRESS" || cfgRes?.status === "PAUSED") {
          setActiveTab("live");
        } else if (cfgRes?.status === "COMPLETED") {
          setActiveTab("results");
        }
      }
    } catch (err) {
      console.error("Error refreshing core auction data:", err);
    }
  };

  useEffect(() => {
    refreshCore(true).finally(() => setLoading(false));

    // Restore saved auth token if present
    const savedToken = typeof window !== "undefined" ? window.localStorage.getItem("epl_auction_token") : null;
    const savedUser = typeof window !== "undefined" ? window.localStorage.getItem("epl_auction_user") : null;
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        // ignore
      }
    }
  }, []);

  // Connect WebSocket for live sync
  useEffect(() => {
    let unmounted = false;

    function connectWs() {
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/auction`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (unmounted) return;
          setWsConnected(true);
          // Sync current state
          ws.send(JSON.stringify({ action: "SYNC" }));
        };

        ws.onmessage = (event) => {
          if (unmounted) return;
          try {
            const msg = JSON.parse(event.data);
            handleWsMessage(msg);
          } catch (e) {
            console.error("Malformed WS message:", e);
          }
        };

        ws.onerror = (err) => {
          console.error("WebSocket error:", err);
        };

        ws.onclose = () => {
          if (unmounted) return;
          setWsConnected(false);
          // Try reconnect after 2 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWs();
          }, 2000);
        };
      } catch (err) {
        console.error("Failed to initialize WebSocket:", err);
      }
    }

    connectWs();

    return () => {
      unmounted = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Handle live incoming messages
  const handleWsMessage = (msg: any) => {
    switch (msg.type) {
      case "AUCTION_STATE_SYNC":
      case "STATE_UPDATE":
        setAuctionState(msg.state || "IDLE");
        setPodiumPlayer(msg.current_player || null);
        setCurrentBid(msg.current_bid || 0);
        setCurrentBidder(msg.current_bidder || null);
        setTimerSeconds(msg.timer_remaining ?? 0);
        setBidHistory(msg.bid_history || []);
        if (msg.teams) setTeams(msg.teams);
        if (msg.scarcity_intel) setScarcityInfo(msg.scarcity_intel);
        break;

      case "NEW_BID":
        setCurrentBid(msg.bid_amount);
        setCurrentBidder({
          team_id: msg.team_id,
          team_name: msg.team_name,
          owner_name: msg.owner_name,
        });
        setBidHistory((prev) => [
          ...prev,
          {
            team_id: msg.team_id,
            team_name: msg.team_name,
            owner_name: msg.owner_name,
            amount: msg.bid_amount,
            timestamp: new Date().toISOString(),
          },
        ]);
        if (msg.timer_remaining !== undefined) setTimerSeconds(msg.timer_remaining);
        notify(`New leading bid: ₹${msg.bid_amount}L by ${msg.team_name}`, "info");
        break;

      case "TIMER_TICK":
        setTimerSeconds(msg.seconds);
        break;

      case "PLAYER_SOLD":
        notify(`SOLD! ${msg.player_name} bought by ${msg.team_name} for ₹${msg.amount}L`, "success");
        refreshCore(false);
        break;

      case "PLAYER_UNSOLD":
        notify(`${msg.player_name} remains UNSOLD at base price ₹${msg.base_price}L`, "error");
        refreshCore(false);
        break;

      case "AUCTION_PAUSED":
        setAuctionState("PAUSED");
        notify("Auctioneer has PAUSED the bidding session.", "info");
        break;

      case "AUCTION_RESUMED":
        setAuctionState("BIDDING_ACTIVE");
        notify("Bidding session has RESUMED.", "info");
        break;

      case "NOMINATION_CLEARED":
        setAuctionState("IDLE");
        setPodiumPlayer(null);
        setCurrentBid(0);
        setCurrentBidder(null);
        notify("Active nomination was canceled by the auctioneer.", "info");
        refreshCore(false);
        break;

      case "ERROR":
        notify(`Auction Warning: ${msg.message}`, "error");
        break;

      default:
        break;
    }
  };

  const sendWsAction = (payload: any) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      notify("WebSocket connection offline. Action queued for retry.", "error");
      return;
    }
    const envelope = {
      ...payload,
      token: token || undefined,
    };
    wsRef.current.send(JSON.stringify(envelope));
  };

  // Auth Handling
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPin.trim()) {
      notify("Please enter your secret account PIN.", "error");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetchApi("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: loginUsername,
          pin: loginPin.trim(),
        }),
      });

      if (res.token) {
        setToken(res.token);
        setCurrentUser(res.user);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("epl_auction_token", res.token);
          window.localStorage.setItem("epl_auction_user", JSON.stringify(res.user));
        }
        notify(`Welcome, ${res.user.display_name}! Authorized as ${res.user.role.toUpperCase()}.`, "success");
        setLoginPin("");
      }
    } catch (err: any) {
      notify(err.message || "Authentication failed. Verify PIN.", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("epl_auction_token");
      window.localStorage.removeItem("epl_auction_user");
    }
    notify("Logged out. Switched to spectator view.", "info");
  };

  // Bidding Actions
  const bidStep = config?.min_bid_increment || 0.5;
  const roundBid = (v: number) => Math.round(v * 10) / 10;

  const handlePlaceBid = (incrementAmount: number) => {
    if (!token) {
      notify("Sign in as a franchise team owner to place bids.", "error");
      return;
    }
    const targetAmount = roundBid(currentBid + incrementAmount);
    sendWsAction({
      action: "PLACE_BID",
      bid_amount: targetAmount,
    });
  };

  const handleCustomBid = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(customBidAmount);
    if (isNaN(parsed) || parsed <= currentBid) {
      notify(`Custom bid must be strictly greater than current bid (₹${currentBid}L).`, "error");
      return;
    }
    sendWsAction({
      action: "PLACE_BID",
      bid_amount: roundBid(parsed),
    });
    setCustomBidAmount("");
  };

  // Auctioneer Controls
  const nominateById = (playerId: string, basePrice: number) => {
    sendWsAction({
      action: "NOMINATE",
      player_id: playerId,
      base_price: basePrice,
    });
  };

  const pendingQueue = pool.filter((p) => p.is_available && p.auction_status === "PENDING");

  const handleAdvanceNext = () => {
    if (pendingQueue.length === 0) {
      notify("Player nomination queue is exhausted.", "info");
      return;
    }
    const nextP = pendingQueue[0];
    nominateById(nextP.player_id, nextP.base_price || 2.0);
  };

  const handleCompleteAuction = async () => {
    if (!confirm("Are you certain you want to officially conclude the auction and lock final squads?")) return;
    try {
      await fetchApi("/api/auction/complete", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      await refreshCore(true);
      setActiveTab("results");
      notify("Auction session marked COMPLETED. Final squads and reports generated.", "success");
    } catch (err: any) {
      notify(`Failed to complete auction: ${err.message}`, "error");
    }
  };

  const handleAdminReset = async () => {
    const confirmation = prompt("Type 'RESET' to erase all live auction progress, restore 100L team purses, and return to DRAFT mode:");
    if (confirmation !== "RESET") return;

    try {
      await fetchApi("/api/auction/reset", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      await refreshCore(true);
      notify("Auction reset cleanly to editable pre-auction DRAFT state.", "success");
    } catch (err: any) {
      notify(`Reset failed: ${err.message}`, "error");
    }
  };

  const handleExportResults = async (format: "pdf" | "xlsx") => {
    setExportingResults(format);
    try {
      const res = await fetch(`/api/exports/auction-results?format=${format}`);
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `EPL_Auction_Results.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      notify(`Export error: ${err.message}`, "error");
    } finally {
      setExportingResults(null);
    }
  };

  const handleRunSimulation = async () => {
    setSimulationRunning(true);
    try {
      const res = await fetchApi("/api/auction/simulate", { method: "POST" });
      setSimulationResult(res);
      notify("Zero-mutation 6-team AI simulation completed!", "success");
    } catch (err: any) {
      notify(`Simulation failed: ${err.message}`, "error");
    } finally {
      setSimulationRunning(false);
    }
  };

  const isAuctioneer = currentUser?.role === "auctioneer";
  const isOwner = currentUser?.role === "team_owner";
  const currentOwnerTeam = isOwner ? teams.find((t) => t.team_id === currentUser.team_id) : null;
  const unfilledSlots = currentOwnerTeam ? Math.max(0, currentOwnerTeam.max_squad_size - currentOwnerTeam.squad_size) : 0;
  const minBase = config?.min_base_price || 2.0;
  const reserveRequired = unfilledSlots > 1 ? (unfilledSlots - 1) * minBase : 0.0;
  const maxBidPossible = currentOwnerTeam ? Math.max(0, currentOwnerTeam.purse_remaining - reserveRequired) : 0;

  const bidAuditCols: DataTableColumn<any>[] = [
    { key: "player_name", header: "Player", minWidth: "160px", render: (r) => <span className="font-bold text-[#101828] dark:text-[#F8FAFC]">{r.player_name}</span> },
    { key: "team_name", header: "Franchise", minWidth: "150px" },
    { key: "bid_amount", header: "Bid (L)", align: "right", minWidth: "90px", render: (r) => <span className="font-mono font-bold text-[#2563EB] dark:text-[#3B82F6]">₹{Number(r.bid_amount).toFixed(1)}L</span> },
    {
      key: "status",
      header: "Status",
      align: "center",
      minWidth: "95px",
      render: (r) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          r.status === "SOLD" ? "bg-[#2563EB] text-white" : "bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8]"
        }`}>
          {r.status}
        </span>
      ),
    },
    {
      key: "timestamp",
      header: "Timestamp",
      minWidth: "140px",
      render: (r) => <span className="font-mono text-[10px] text-[#64748B] dark:text-[#94A3B8]">{r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : "—"}</span>,
    },
  ];

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="inline-block animate-spin w-9 h-9 border-4 border-[#2563EB] border-t-transparent rounded-full"></div>
        <p className="font-display text-lg text-[#101828] dark:text-[#F8FAFC]">Initializing EPL Auction Management Suite...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Persona Authentication */}
      <div className="bg-[#FAF7F0] dark:bg-[#181A20] text-[#111318] dark:text-[#F1EBDD] p-5 sm:p-6 rounded-xl border border-[#DDD5C3] dark:border-[#2A2E38] shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#5C584E] dark:text-[#A8A296] uppercase tracking-wider mb-1">
              <Gavel className="w-4 h-4 text-[#FF4B35]" />
              <span>{config?.auction_name || "EPL Official Player Auction"}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#F1EBDD] dark:bg-[#111318] border border-[#DDD5C3] dark:border-[#2A2E38] font-mono text-[10px]">
                LIFECYCLE: {config?.status || "DRAFT"}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] border ${
                wsConnected ? "bg-[#FF4B35]/10 text-[#FF4B35] border-[#FF4B35]/30" : "bg-[#F1EBDD] dark:bg-[#111318] text-[#5C584E] dark:text-[#A8A296] border-[#DDD5C3] dark:border-[#2A2E38]"
              }`}>
                {wsConnected ? "● LIVE SYNC" : "○ CONNECTING"}
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111318] dark:text-[#F1EBDD]">
              Tournament Auction Management Center
            </h1>
            <p className="text-xs text-[#5C584E] dark:text-[#A8A296] mt-1 max-w-2xl leading-relaxed">
              Full pre-auction setup wizard, authenticated six-owner live bidding, atomic reserve enforcement, and final squad reporting.
            </p>
          </div>

          {/* Persona Authentication Switcher */}
          <div className="bg-[#F1EBDD] dark:bg-[#111318] p-3.5 rounded-xl border border-[#DDD5C3] dark:border-[#2A2E38] min-w-[310px]">
            <div className="text-[10px] uppercase font-bold text-[#5C584E] dark:text-[#A8A296] flex justify-between items-center mb-1.5 font-mono">
              <span>AUTHENTICATED IDENTITY</span>
              {currentUser ? (
                <button onClick={handleLogout} className="text-[10px] text-[#FF4B35] hover:underline font-semibold">
                  Switch Account
                </button>
              ) : (
                <span className="text-[#5C584E] dark:text-[#A8A296]">SPECTATOR MODE</span>
              )}
            </div>
            {currentUser ? (
              <div className="space-y-1">
                <div className="font-display font-bold text-sm text-[#111318] dark:text-[#F1EBDD] flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#5C584E] dark:text-[#A8A296]" />
                  <span>{currentUser.display_name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF4B35] text-white">
                    {currentUser.role === "auctioneer" ? "AUCTIONEER" : `TEAM ${currentUser.team_id}`}
                  </span>
                </div>
                {isOwner && currentOwnerTeam && (
                  <div className="text-[11px] text-[#5C584E] dark:text-[#A8A296] flex justify-between pt-1 border-t border-[#DDD5C3] dark:border-[#2A2E38] font-mono">
                    <span>Purse: <strong>₹{currentOwnerTeam.purse_remaining}L</strong></span>
                    <span>Slots: <strong>{currentOwnerTeam.squad_size}/{currentOwnerTeam.max_squad_size}</strong></span>
                    <span>Max Bid: <strong className="text-[#FF4B35]">₹{maxBidPossible.toFixed(1)}L</strong></span>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleLoginSubmit} className="space-y-1.5">
                <select
                  aria-label="Select Auction Account"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full px-2.5 py-1 text-[11px] rounded-lg bg-[#FAF7F0] dark:bg-[#181A20] text-[#111318] dark:text-[#F1EBDD] border border-[#DDD5C3] dark:border-[#2A2E38]"
                >
                  {accounts.map((acc) => (
                    <option key={acc.username} value={acc.username}>
                      {acc.role === "auctioneer" ? "Official Auctioneer (Admin)" : `Team ${acc.team_id}: ${acc.display_name}`}
                    </option>
                  ))}
                </select>
                <div className="flex gap-1.5">
                  <input
                    type="password"
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                    placeholder="Enter account PIN..."
                    aria-label="Account PIN"
                    className="flex-1 px-2.5 py-1 text-[11px] font-mono rounded-lg bg-[#FAF7F0] dark:bg-[#181A20] text-[#111318] dark:text-[#F1EBDD] border border-[#DDD5C3] dark:border-[#2A2E38] focus:outline-none focus:border-[#FF4B35]"
                  />
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="px-3.5 py-1 rounded-lg bg-[#FF4B35] text-white hover:bg-[#E03E29] text-[11px] font-bold transition disabled:opacity-50"
                  >
                    {authLoading ? "..." : "Sign In"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Alert Banner */}
        {bidAlert && (
          <div className={`mt-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between border ${
            bidAlert.type === "error"
              ? "bg-[#FF4B35] text-white border-[#FF4B35]"
              : "bg-[#F1EBDD] dark:bg-[#111318] text-[#111318] dark:text-[#F1EBDD] border-[#DDD5C3] dark:border-[#2A2E38]"
          }`}>
            <div className="flex items-center gap-2">
              {bidAlert.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-[#FF4B35]" />}
              <span>{bidAlert.message}</span>
            </div>
            <button onClick={() => setBidAlert(null)} className="text-xs hover:opacity-75 px-1">✕</button>
          </div>
        )}

        {/* 5-Stage Lifecycle Tabs */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#DDD5C3] dark:border-[#2A2E38] text-xs">
          {[
            { id: "setup", label: "1. Pre-Auction Setup Wizard", icon: Sliders },
            { id: "live", label: "2. Live Bidding Room", icon: Gavel },
            { id: "dashboard", label: "3. Owner Intelligence Dashboard", icon: Shield },
            { id: "results", label: "4. Auction Results & Reports", icon: Trophy },
            { id: "simulation", label: "5. AI Mock Sandbox", icon: Sparkles },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition inline-flex items-center gap-1.5 ${
                  activeTab === t.id
                    ? "bg-[#FF4B35] text-white shadow-sm"
                    : "bg-[#F1EBDD] dark:bg-[#111318] text-[#5C584E] dark:text-[#A8A296] border border-[#DDD5C3] dark:border-[#2A2E38] hover:border-[#FF4B35] hover:text-[#111318] dark:hover:text-[#F1EBDD]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: PRE-AUCTION SETUP WIZARD */}
      {activeTab === "setup" && (
        <AuctionSetupWizard
          token={token}
          isAuctioneer={isAuctioneer}
          onAuctionStarted={() => {
            refreshCore(false);
            setActiveTab("live");
          }}
          onNotify={notify}
        />
      )}

      {/* TAB 2: LIVE BIDDING ROOM */}
      {activeTab === "live" && (
        <div className="space-y-6">
          {config?.status === "DRAFT" || config?.status === "CONFIGURED" ? (
            <div className="bg-white dark:bg-[#151F32] rounded-xl border border-[#2563EB] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#101828] dark:text-[#F8FAFC]">
              <div>
                <h3 className="font-display text-lg font-bold text-[#101828] dark:text-[#F8FAFC]">Auction Has Not Started Yet ({config.status})</h3>
                <p className="text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  Complete the Pre-Auction Setup Wizard and click <strong>START AUCTION</strong> to lock configuration and officially open bidding.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("setup")}
                className="px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold hover:bg-[#1D4ED8] shrink-0"
              >
                Go to Setup Wizard →
              </button>
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Stage (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Podium */}
              <div className="bg-white dark:bg-[#151F32] rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-xl overflow-hidden text-[#101828] dark:text-[#F8FAFC]">
                <div className="bg-[#F8FAFC] dark:bg-[#0B1120] text-[#101828] dark:text-[#F8FAFC] px-5 py-3 flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#334155]">
                  <span className="font-display font-bold text-sm tracking-wide text-[#64748B] dark:text-[#94A3B8]">
                    PODIUM STATUS: <span className="text-[#101828] dark:text-[#F8FAFC]">{auctionState}</span>
                  </span>
                  {auctionState === "BIDDING_ACTIVE" && (
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono font-bold text-xs ${
                      timerSeconds <= 5 ? "bg-[#2563EB] text-white animate-pulse" : "bg-white dark:bg-[#151F32] text-[#64748B] dark:text-[#94A3B8] border border-[#E2E8F0] dark:border-[#334155]"
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timerSeconds}s</span>
                    </div>
                  )}
                </div>

                {auctionState === "BIDDING_ACTIVE" && (
                  <div className="w-full bg-[#F8FAFC] dark:bg-[#0B1120] h-1.5">
                    <div
                      className="h-full bg-[#2563EB] transition-all duration-1000"
                      style={{ width: `${Math.min(100, (timerSeconds / (config?.timer_duration || 15)) * 100)}%` }}
                    ></div>
                  </div>
                )}

                <div className="p-6">
                  {podiumPlayer ? (
                    <div className="space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#E2E8F0] dark:border-[#334155] pb-4">
                        <div>
                          <div className="text-[10px] font-mono font-bold uppercase text-[#2563EB] dark:text-[#3B82F6] tracking-wider">
                            ON THE BLOCK • {podiumPlayer.player_id}
                          </div>
                          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#101828] dark:text-[#F8FAFC] mt-0.5">
                            {podiumPlayer.name}
                          </h2>
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                            <span className="bg-[#2563EB] text-white px-2.5 py-0.5 rounded-full font-semibold">
                              {podiumPlayer.primary_role}
                            </span>
                            <span className="bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] px-2.5 py-0.5 rounded-full font-medium">
                              {podiumPlayer.category}
                            </span>
                            <span className="font-mono text-[#64748B] dark:text-[#94A3B8]">{podiumPlayer.batting_hand || "RHB"}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] block mb-1">EPL PIS RATING</span>
                          <RatingBadge score={podiumPlayer.overall_rating || podiumPlayer.rating || 65} size="lg" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-[#F8FAFC] dark:bg-[#0B1120] p-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] text-center">
                        <div><span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block">Matches</span><strong className="font-mono text-sm text-[#101828] dark:text-[#F8FAFC]">{podiumPlayer.matches || 0}</strong></div>
                        <div><span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block">Runs</span><strong className="font-mono text-sm text-[#101828] dark:text-[#F8FAFC]">{podiumPlayer.total_runs || 0}</strong></div>
                        <div><span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block">Bat SR</span><strong className="font-mono text-sm text-[#101828] dark:text-[#F8FAFC]">{podiumPlayer.strike_rate ? Number(podiumPlayer.strike_rate).toFixed(1) : "—"}</strong></div>
                        <div><span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block">Wickets</span><strong className="font-mono text-sm text-[#101828] dark:text-[#F8FAFC]">{podiumPlayer.wickets || 0}</strong></div>
                        <div><span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block">Economy</span><strong className="font-mono text-sm text-[#101828] dark:text-[#F8FAFC]">{podiumPlayer.economy ? Number(podiumPlayer.economy).toFixed(2) : "—"}</strong></div>
                      </div>

                      {scarcityInfo && (
                        <div className="bg-[#F8FAFC] dark:bg-[#0B1120] border-l-4 border-[#2563EB] p-3 rounded-r-lg text-xs text-[#101828] dark:text-[#F8FAFC]">
                          <strong className="inline-flex items-center gap-1 text-[#2563EB] dark:text-[#3B82F6]">
                            <Zap className="w-3.5 h-3.5" /> Market Scarcity: {scarcityInfo.scarcity_level} • Recommended Ceiling ₹{scarcityInfo.recommended_valuation_ceiling}L
                          </strong>
                          <span className="block text-[11px] mt-0.5 text-[#64748B] dark:text-[#94A3B8]">{scarcityInfo.tactical_bidding_advice}</span>
                        </div>
                      )}

                      {/* Leading Bid Callout (Projector-Optimized) */}
                      <div className="bg-[#F8FAFC] dark:bg-[#0B1120] text-[#101828] dark:text-[#F8FAFC] p-6 rounded-2xl border-2 border-[#2563EB] text-center shadow-2xl">
                        <div className="text-[11px] font-mono uppercase tracking-widest text-[#64748B] dark:text-[#94A3B8]">
                          CURRENT HIGHEST BID
                        </div>
                        <div className="font-display text-5xl sm:text-6xl font-bold my-2 text-[#101828] dark:text-[#F8FAFC] tracking-tight">
                          ₹{currentBid.toFixed(1)} <span className="text-xl font-normal text-[#64748B] dark:text-[#94A3B8]">Lakhs</span>
                        </div>
                        {currentBidder ? (
                          <div className="inline-flex items-center gap-2 bg-white dark:bg-[#151F32] px-4 py-1.5 rounded-full border border-blue-200 dark:border-[#334155] text-xs">
                            <Shield className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
                            <strong className="text-[#101828] dark:text-[#F8FAFC]">{currentBidder.team_name}</strong>
                            <span className="text-[#64748B] dark:text-[#94A3B8]">({currentBidder.owner_name})</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#64748B] dark:text-[#94A3B8] italic">Awaiting opening bid above base price</span>
                        )}
                      </div>

                      {/* Owner Bid Panel */}
                      {isOwner && auctionState === "BIDDING_ACTIVE" && (
                        <div className="bg-[#F8FAFC] dark:bg-[#0B1120] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155] space-y-3">
                          <div className="flex flex-wrap justify-between items-center text-xs">
                            <strong className="text-[#64748B] dark:text-[#94A3B8]">BID AS: {currentOwnerTeam?.team_name}</strong>
                            <span className="font-mono text-[#64748B] dark:text-[#94A3B8]">
                              Max Cap: <strong className="text-[#2563EB] dark:text-[#3B82F6]">₹{maxBidPossible.toFixed(1)}L</strong> (Reserve ₹{reserveRequired.toFixed(1)}L)
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {[bidStep, roundBid(bidStep * 2), roundBid(bidStep * 4)].map((inc) => (
                              <button
                                key={inc}
                                onClick={() => handlePlaceBid(inc)}
                                disabled={currentBid + inc > maxBidPossible}
                                className="bg-[#2563EB] text-white hover:bg-[#1D4ED8] py-3 rounded-lg text-xs font-bold transition disabled:opacity-30 shadow-md"
                              >
                                +₹{inc}L (₹{roundBid(currentBid + inc)}L)
                              </button>
                            ))}
                          </div>
                          <form onSubmit={handleCustomBid} className="flex gap-2">
                            <input
                              type="number"
                              step="0.1"
                              min={roundBid(currentBid + bidStep)}
                              max={maxBidPossible}
                              value={customBidAmount}
                              onChange={(e) => setCustomBidAmount(e.target.value)}
                              placeholder={`Custom bid (min ₹${roundBid(currentBid + bidStep)}L)...`}
                              className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#2563EB]"
                            />
                            <button type="submit" className="px-4 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] transition">
                              Place Bid
                            </button>
                          </form>
                        </div>
                      )}

                      {/* Auctioneer Controls */}
                      {isAuctioneer && (
                        <div className="bg-[#F8FAFC] dark:bg-[#0B1120] text-[#101828] dark:text-[#F8FAFC] p-4 rounded-xl border border-[#2563EB]/70 space-y-3">
                          <div className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider border-b border-[#E2E8F0] dark:border-[#334155] pb-1.5">
                            Auctioneer Command Deck
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => sendWsAction({ action: "SOLD" })}
                              disabled={!currentBidder}
                              className="px-3.5 py-2 rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-35 shadow"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Declare SOLD</span>
                            </button>
                            <button
                              onClick={() => sendWsAction({ action: "UNSOLD" })}
                              className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] border border-blue-200 dark:border-[#334155] hover:bg-white dark:bg-[#151F32]/80 text-xs font-bold inline-flex items-center gap-1.5"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Declare UNSOLD</span>
                            </button>
                            {auctionState === "PAUSED" ? (
                              <button
                                onClick={() => sendWsAction({ action: "RESUME" })}
                                className="px-3.5 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-bold inline-flex items-center gap-1.5"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>Resume Bidding</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => sendWsAction({ action: "PAUSE" })}
                                className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#151F32] text-[#64748B] dark:text-[#94A3B8] border border-[#E2E8F0] dark:border-[#334155] text-xs font-semibold inline-flex items-center gap-1.5"
                              >
                                <Pause className="w-3.5 h-3.5" />
                                <span>Pause Bidding</span>
                              </button>
                            )}
                            <button
                              onClick={() => sendWsAction({ action: "SET_TIMER", seconds: config?.timer_duration || 15 })}
                              className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] border border-[#E2E8F0] dark:border-[#334155] text-xs font-semibold inline-flex items-center gap-1.5"
                            >
                              <Clock className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8]" />
                              <span>Reset Timer</span>
                            </button>
                            <button
                              onClick={() => sendWsAction({ action: "UNDO" })}
                              className="px-3.5 py-2 rounded-lg bg-transparent text-[#64748B] dark:text-[#94A3B8] border border-[#E2E8F0] dark:border-[#334155] hover:bg-white/10 text-xs font-semibold inline-flex items-center gap-1.5"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Cancel Nomination</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-16 text-center space-y-3">
                      <Gavel className="w-12 h-12 mx-auto text-[#64748B] dark:text-[#94A3B8]" />
                      <h3 className="font-display text-2xl font-bold text-[#101828] dark:text-[#F8FAFC]">Auction Podium Clear</h3>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] max-w-md mx-auto">
                        Auctioneer can advance the next player in queue or select any player from the pool below.
                      </p>
                      {isAuctioneer && pendingQueue.length > 0 && (
                        <button
                          onClick={handleAdvanceNext}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] transition shadow-md"
                        >
                          <FastForward className="w-3.5 h-3.5" />
                          <span>Advance Next in Queue: {pendingQueue[0].name}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Auctioneer Nomination & Lifecycle Console */}
              {isAuctioneer && (
                <div className="bg-white dark:bg-[#151F32] p-5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-md space-y-4 text-[#101828] dark:text-[#F8FAFC]">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] dark:border-[#334155] pb-2.5">
                    <h3 className="font-display text-base font-bold text-[#101828] dark:text-[#F8FAFC]">Nominate Player &amp; Session Lifecycle</h3>
                    <div className="flex gap-2">
                      <button onClick={handleAdvanceNext} className="px-3 py-1 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] text-xs font-semibold inline-flex items-center gap-1 hover:text-[#101828] dark:text-[#F8FAFC]">
                        <FastForward className="w-3 h-3" />
                        <span>Next Queue ({pendingQueue.length})</span>
                      </button>
                      <button onClick={handleCompleteAuction} className="px-3 py-1 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8]">
                        Complete Auction
                      </button>
                      <button onClick={handleAdminReset} className="px-3 py-1 rounded-lg border border-[#2563EB] text-[#2563EB] dark:text-[#3B82F6] text-xs font-semibold hover:bg-[#F8FAFC] dark:bg-[#0B1120]">
                        Reset Draft
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-7">
                      <label className="text-[10px] font-bold uppercase text-[#64748B] dark:text-[#94A3B8] block mb-1">Select Player</label>
                      <select
                        value={selectedNominationId}
                        onChange={(e) => {
                          setSelectedNominationId(e.target.value);
                          const pe = pool.find((x) => x.player_id === e.target.value);
                          if (pe) setCustomBasePrice(pe.base_price);
                        }}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B1120] text-[#101828] dark:text-[#F8FAFC]"
                      >
                        {pool.filter((x) => x.is_available).map((p) => (
                          <option key={p.player_id} value={p.player_id}>
                            [{p.auction_status}] {p.name} • {p.category} • ₹{p.base_price}L
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold uppercase text-[#64748B] dark:text-[#94A3B8] block mb-1">Base (L)</label>
                      <input type="number" step="0.5" min="1" value={customBasePrice} onChange={(e) => setCustomBasePrice(parseFloat(e.target.value) || 2)} className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B1120] text-[#101828] dark:text-[#F8FAFC]" />
                    </div>
                    <div className="sm:col-span-3">
                      <button onClick={() => nominateById(selectedNominationId, customBasePrice)} className="w-full py-2 rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-bold transition shadow-sm">
                        Nominate Player
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Complete Persisted Bid Audit Table */}
              <DataTable
                data={persistedBids}
                columns={bidAuditCols}
                rowKey={(r) => r.id}
                title="Persisted SQLite Bid Audit History"
                subtitle="Every accepted bid and completed sale is transactionally persisted across backend restarts"
                defaultPageSize={15}
                stickyFirstColumn
              />
            </div>

            {/* Right Sidebar (4 cols): 6-Team Purse Trackers, Next Queue, Live Round Feed */}
            <div className="lg:col-span-4 space-y-6">
              {/* Six Franchise Purse Trackers */}
              <div className="bg-white dark:bg-[#151F32] rounded-xl border border-[#E2E8F0] dark:border-[#334155] p-4 shadow-md space-y-2.5 text-[#101828] dark:text-[#F8FAFC]">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#334155] pb-2">
                  <span className="font-display font-bold text-sm text-[#101828] dark:text-[#F8FAFC]">Six Franchise Purses</span>
                  <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]">LIVE SYNC</span>
                </div>
                {teams.map((t) => (
                  <div
                    key={t.team_id}
                    onClick={() => {
                      setDashboardTeamId(t.team_id);
                      setActiveTab("dashboard");
                    }}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition flex justify-between items-center ${
                      currentBidder?.team_id === t.team_id
                        ? "bg-[#F8FAFC] dark:bg-[#0B1120] text-[#101828] dark:text-[#F8FAFC] border-[#2563EB] ring-1 ring-[#2563EB]"
                        : "bg-slate-50 dark:bg-[#0B1120] hover:bg-[#F8FAFC] dark:bg-[#0B1120] text-[#101828] dark:text-[#F8FAFC] border-[#E2E8F0] dark:border-[#334155]"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-[#101828] dark:text-[#F8FAFC]">{t.team_name}</div>
                      <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">{t.owner_name} • {t.squad_size}/{t.max_squad_size} slots</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-sm text-[#2563EB] dark:text-[#3B82F6]">₹{t.purse_remaining}L</div>
                      <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Spent ₹{t.purse_spent}L</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Next Player Queue */}
              <div className="bg-white dark:bg-[#151F32] rounded-xl border border-[#E2E8F0] dark:border-[#334155] p-4 shadow-md space-y-2.5 text-[#101828] dark:text-[#F8FAFC]">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#334155] pb-2">
                  <span className="font-display font-bold text-sm text-[#101828] dark:text-[#F8FAFC]">Next Player Queue</span>
                  <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]">{pendingQueue.length} Pending</span>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 text-xs">
                  {pendingQueue.slice(0, 8).map((q, idx) => (
                    <div key={q.entry_id} className="p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#334155] flex justify-between items-center">
                      <div>
                        <span className="font-mono text-[10px] text-[#2563EB] dark:text-[#3B82F6] mr-1.5 font-bold">#{idx + 1}</span>
                        <strong className="text-[#101828] dark:text-[#F8FAFC]">{q.name}</strong>
                        <span className="block text-[10px] text-[#64748B] dark:text-[#94A3B8]">{q.primary_role} • {q.category}</span>
                      </div>
                      <span className="font-mono font-bold text-[#2563EB] dark:text-[#3B82F6]">₹{q.base_price}L</span>
                    </div>
                  ))}
                  {pendingQueue.length === 0 && (
                    <p className="text-xs italic text-[#64748B] dark:text-[#94A3B8] text-center py-4">Queue empty.</p>
                  )}
                </div>
              </div>

              {/* Current Round Bid Stream */}
              <div className="bg-white dark:bg-[#151F32] rounded-xl border border-[#E2E8F0] dark:border-[#334155] p-4 shadow-md space-y-2.5 text-[#101828] dark:text-[#F8FAFC]">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#334155] pb-2">
                  <span className="font-display font-bold text-sm text-[#101828] dark:text-[#F8FAFC] flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
                    <span>Active Round Bids</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]">{bidHistory.length}</span>
                </div>
                <div className="space-y-1.5 max-h-52 overflow-y-auto text-xs">
                  {bidHistory.length > 0 ? (
                    [...bidHistory].reverse().map((bh, idx) => (
                      <div key={idx} className={`p-2 rounded-lg border flex justify-between items-center ${idx === 0 ? "bg-[#F8FAFC] dark:bg-[#0B1120] text-[#101828] dark:text-[#F8FAFC] border-[#2563EB]" : "bg-slate-50 dark:bg-[#0B1120] text-[#101828] dark:text-[#F8FAFC] border-[#E2E8F0] dark:border-[#334155]"}`}>
                        <div>
                          <div className="font-bold text-[#101828] dark:text-[#F8FAFC]">{bh.team_name}</div>
                          <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">{bh.owner_name}</div>
                        </div>
                        <span className="font-mono font-bold text-[#2563EB] dark:text-[#3B82F6]">₹{Number(bh.amount).toFixed(1)}L</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-6 text-xs italic text-[#64748B] dark:text-[#94A3B8]">No bids placed in active round.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FRANCHISE OWNER DASHBOARD */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#151F32] p-5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[#101828] dark:text-[#F8FAFC]">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#2563EB] dark:text-[#3B82F6] tracking-wider">Private Franchise Owner Intelligence</span>
              <h2 className="font-display text-2xl font-bold text-[#101828] dark:text-[#F8FAFC]">Squad Balance &amp; Target Recommendations</h2>
            </div>
            {isAuctioneer ? (
              <select
                value={dashboardTeamId}
                onChange={(e) => setDashboardTeamId(Number(e.target.value))}
                className="px-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B1120] font-bold text-[#101828] dark:text-[#F8FAFC]"
              >
                {teams.map((t) => (
                  <option key={t.team_id} value={t.team_id}>Team {t.team_id}: {t.team_name} ({t.owner_name})</option>
                ))}
              </select>
            ) : isOwner && currentOwnerTeam ? (
              <span className="px-3 py-1.5 text-xs rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] font-semibold">
                Private View: {currentOwnerTeam.team_name} ({currentOwnerTeam.owner_name})
              </span>
            ) : null}
          </div>

          {!token ? (
            <div className="bg-white dark:bg-[#151F32] p-8 rounded-xl border border-[#E2E8F0] dark:border-[#334155] text-center space-y-2 text-[#101828] dark:text-[#F8FAFC]">
              <Shield className="w-8 h-8 mx-auto text-[#2563EB] dark:text-[#3B82F6]" />
              <h3 className="font-display text-lg font-bold text-[#101828] dark:text-[#F8FAFC]">Owner Authentication Required</h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] max-w-md mx-auto">
                Franchise squad recommendations and deficit diagnostics are private to each team owner. Sign in with your franchise PIN in the top-right panel to inspect your dashboard.
              </p>
            </div>
          ) : dashboardLoading ? (
            <div className="py-16 text-center text-sm text-[#64748B] dark:text-[#94A3B8]">Loading owner dashboard...</div>
          ) : dashboardData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155]">
                  <span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] block">Remaining Purse</span>
                  <span className="font-mono text-2xl font-bold text-[#2563EB] dark:text-[#3B82F6]">₹{Number(dashboardData.purse_remaining || 0).toFixed(1)}L</span>
                  <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] block">Spent ₹{Number(dashboardData.purse_spent || 0).toFixed(1)}L</span>
                </div>
                <div className="bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155]">
                  <span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] block">Squad Slots</span>
                  <span className="font-mono text-2xl font-bold">{dashboardData.squad_size_current} / {dashboardData.squad_size_target}</span>
                  <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] block">{dashboardData.remaining_slots} unfilled</span>
                </div>
                <div className="bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155]">
                  <span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] block">Max Single Bid</span>
                  <span className="font-mono text-2xl font-bold text-[#64748B] dark:text-[#94A3B8]">₹{Number(dashboardData.max_bid_capacity || 0).toFixed(1)}L</span>
                </div>
                <div className="bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155]">
                  <span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] block">Squad Balance Score</span>
                  <span className="font-mono text-2xl font-bold">{dashboardData.squad_strengths?.squad_balance_score || 0} / 100</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Batting Strength", val: dashboardData.squad_strengths?.batting_strength || 0, color: "#2563EB" },
                  { label: "Bowling Strength", val: dashboardData.squad_strengths?.bowling_strength || 0, color: "#0891B2" },
                  { label: "All-Rounder Strength", val: dashboardData.squad_strengths?.all_rounder_strength || 0, color: "#8B5CF6" },
                ].map((s) => (
                  <div key={s.label} className="bg-white dark:bg-[#151F32] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155] space-y-2 text-[#101828] dark:text-[#F8FAFC]">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[#64748B] dark:text-[#94A3B8]">{s.label}</span>
                      <span className="font-mono">{s.val}</span>
                    </div>
                    <div className="w-full bg-[#F8FAFC] dark:bg-[#0B1120] h-2 rounded-full overflow-hidden border border-[#E2E8F0] dark:border-[#334155]">
                      <div className="h-full" style={{ width: `${Math.min(100, s.val)}%`, backgroundColor: s.color }}></div>
                    </div>
                  </div>
                ))}
              </div>

              {(dashboardData.squad_weaknesses || []).length > 0 && (
                <div className="bg-white dark:bg-[#151F32] border-l-4 border-[#2563EB] p-4 rounded-r-xl text-xs text-[#101828] dark:text-[#F8FAFC] space-y-1">
                  <strong className="uppercase text-[10px] tracking-wider text-[#2563EB] dark:text-[#3B82F6] block">Squad Deficit Diagnostics</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-[#64748B] dark:text-[#94A3B8]">
                    {dashboardData.squad_weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}

              <DataTable
                data={dashboardData.squad_members || []}
                columns={[
                  { key: "name", header: "Player", minWidth: "160px", render: (r) => <Link href={`/players/${r.player_id}`} className="font-bold text-[#101828] dark:text-[#F8FAFC] hover:text-[#64748B] dark:text-[#94A3B8]">{r.name}</Link> },
                  { key: "primary_role", header: "Role", minWidth: "120px" },
                  { key: "category", header: "Category", minWidth: "120px" },
                  { key: "purchase_price", header: "Cost (L)", align: "right", minWidth: "85px", render: (r) => <span className="font-mono font-bold text-[#2563EB] dark:text-[#3B82F6]">₹{r.purchase_price}L</span> },
                ]}
                rowKey={(r) => r.player_id}
                title={`Acquired Squad (${(dashboardData.squad_members || []).length} Players)`}
                emptyMessage="No players acquired yet for this franchise."
              />

              <div className="bg-white dark:bg-[#151F32] p-5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] space-y-3 text-[#101828] dark:text-[#F8FAFC]">
                <h3 className="font-display text-base font-bold text-[#101828] dark:text-[#F8FAFC]">Recommended Remaining Targets</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(dashboardData.tailored_recommendations || []).map((tgt: any) => (
                    <div key={tgt.player_id} className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#334155] space-y-1 text-xs">
                      <div className="flex justify-between items-start">
                        <Link href={`/players/${tgt.player_id}`} className="font-bold text-[#101828] dark:text-[#F8FAFC] hover:text-[#64748B] dark:text-[#94A3B8]">{tgt.name}</Link>
                        <span className="font-mono text-[10px] bg-white dark:bg-[#151F32] text-[#64748B] dark:text-[#94A3B8] px-1.5 py-0.5 rounded">{tgt.overall_rating}</span>
                      </div>
                      <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">{tgt.primary_role} • {tgt.category}</div>
                      <div className="font-mono font-bold text-[#2563EB] dark:text-[#3B82F6]">Est: ₹{tgt.estimated_valuation}L • Priority: {tgt.fit_urgency}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 4: AUCTION RESULTS & REPORTING */}
      {activeTab === "results" && resultsData && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] p-6 rounded-xl border border-[#E2E8F0] dark:border-[#334155] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#64748B] dark:text-[#94A3B8] font-bold">Post-Auction Analytics &amp; Squad Valuation</span>
              <h2 className="font-display text-2xl font-bold mt-0.5">{resultsData.auction_name} – Results Report</h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                Sold: {resultsData.total_sold} • Unsold: {resultsData.total_unsold} • Combined League Spend: ₹{resultsData.total_spend} Lakhs
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleExportResults("pdf")}
                disabled={exportingResults !== null}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-semibold transition shadow"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{exportingResults === "pdf" ? "Generating PDF..." : "Export Results (PDF)"}</span>
              </button>
              <button
                onClick={() => handleExportResults("xlsx")}
                disabled={exportingResults !== null}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#2563EB] hover:text-[#101828] dark:text-[#F8FAFC] text-xs font-semibold transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{exportingResults === "xlsx" ? "Generating Excel..." : "Export Results (Excel)"}</span>
              </button>
            </div>
          </div>

          {/* Highlights: Most Expensive & Best Value Buys */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-[#151F32] p-5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] space-y-2 text-[#101828] dark:text-[#F8FAFC]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#2563EB] dark:text-[#3B82F6]">Most Expensive Acquisition</span>
              {resultsData.most_expensive_player ? (
                <div>
                  <div className="font-display text-2xl font-bold text-[#101828] dark:text-[#F8FAFC]">{resultsData.most_expensive_player.player_name}</div>
                  <div className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                    Sold to <strong>{resultsData.most_expensive_player.team_name}</strong> for{" "}
                    <strong className="font-mono text-[#2563EB] dark:text-[#3B82F6]">₹{resultsData.most_expensive_player.purchase_price}L</strong> (Est. Value ₹{resultsData.most_expensive_player.estimated_valuation}L)
                  </div>
                </div>
              ) : (
                <p className="text-xs italic text-[#64748B] dark:text-[#94A3B8]">No players sold yet in this auction session.</p>
              )}
            </div>

            <div className="bg-white dark:bg-[#151F32] p-5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] space-y-2 text-[#101828] dark:text-[#F8FAFC]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#2563EB] dark:text-[#3B82F6]">Top Best-Value Purchases</span>
              {(resultsData.best_value_buys || []).length > 0 ? (
                <div className="space-y-1.5 text-xs">
                  {resultsData.best_value_buys.map((bv: any) => (
                    <div key={bv.player_id} className="flex justify-between items-center py-1 border-b border-[#E2E8F0] dark:border-[#334155]">
                      <span><strong>{bv.player_name}</strong> → {bv.team_name}</span>
                      <span className="font-mono">
                        Paid ₹{bv.purchase_price}L vs Est ₹{bv.estimated_valuation}L{" "}
                        <strong className="text-[#2563EB] dark:text-[#3B82F6]">({bv.value_delta >= 0 ? `+${bv.value_delta}L` : `${bv.value_delta}L`})</strong>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-[#64748B] dark:text-[#94A3B8]">Complete player sales in the Live Room to generate value analytics.</p>
              )}
            </div>
          </div>

          {/* 6 Franchise Squad Summaries */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(resultsData.teams || []).map((t: any) => (
              <div key={t.team_id} className="bg-white dark:bg-[#151F32] rounded-xl border border-[#E2E8F0] dark:border-[#334155] p-4 shadow-md space-y-3 text-[#101828] dark:text-[#F8FAFC]">
                <div className="flex justify-between items-start border-b border-[#E2E8F0] dark:border-[#334155] pb-2">
                  <div>
                    <h4 className="font-display font-bold text-base text-[#101828] dark:text-[#F8FAFC]">{t.team_name}</h4>
                    <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">{t.owner_name} • Avg Rtg: <strong>{t.average_rating}</strong></span>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <div className="font-bold text-[#2563EB] dark:text-[#3B82F6]">Spent ₹{t.purse_spent}L</div>
                    <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Left ₹{t.purse_remaining}L</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center bg-[#F8FAFC] dark:bg-[#0B1120] p-2 rounded-lg border border-[#E2E8F0] dark:border-[#334155] text-[10px] font-mono">
                  <div>Bat Depth<strong className="block text-xs text-[#101828] dark:text-[#F8FAFC]">{t.batting_depth}</strong></div>
                  <div>Bowl Depth<strong className="block text-xs text-[#101828] dark:text-[#F8FAFC]">{t.bowling_depth}</strong></div>
                  <div>All-Rounders<strong className="block text-xs text-[#2563EB] dark:text-[#3B82F6]">{t.all_rounder_count}</strong></div>
                </div>
                <div className="space-y-1 max-h-44 overflow-y-auto text-xs">
                  {(t.squad || []).length > 0 ? t.squad.map((p: any) => (
                    <div key={p.player_id} className="flex justify-between py-1 border-b border-[#E2E8F0] dark:border-[#334155]">
                      <span className="font-semibold text-[#101828] dark:text-[#F8FAFC]">{p.player_name} <span className="text-[10px] font-normal text-[#64748B] dark:text-[#94A3B8]">({p.role})</span></span>
                      <span className="font-mono font-bold text-[#2563EB] dark:text-[#3B82F6]">₹{p.purchase_price}L</span>
                    </div>
                  )) : (
                    <p className="text-[11px] italic text-[#64748B] dark:text-[#94A3B8] py-2">No acquisitions yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <DataTable
            data={resultsData.unsold_players || []}
            columns={[
              { key: "name", header: "Player", minWidth: "165px", render: (r) => <Link href={`/players/${r.player_id}`} className="font-bold text-[#101828] dark:text-[#F8FAFC] hover:text-[#64748B] dark:text-[#94A3B8]">{r.name}</Link> },
              { key: "primary_role", header: "Role", minWidth: "120px" },
              { key: "category", header: "Category", minWidth: "130px" },
              { key: "base_price", header: "Base Price (L)", align: "right", minWidth: "90px", render: (r) => <span className="font-mono text-[#64748B] dark:text-[#94A3B8]">₹{r.base_price}L</span> },
              { key: "overall_rating", header: "PIS Rtg", align: "right", minWidth: "80px" },
              { key: "auction_status", header: "Pool Status", align: "center", minWidth: "95px" },
            ]}
            rowKey={(r) => r.player_id}
            title={`Remaining / Unsold Player Pool (${(resultsData.unsold_players || []).length})`}
            searchable
            defaultSortKey="overall_rating"
          />
        </div>
      )}

      {/* TAB 5: AI MOCK AUCTION SANDBOX */}
      {activeTab === "simulation" && (
        <div className="space-y-6">
          <div className="bg-[#F8FAFC] dark:bg-[#0B1120] text-[#101828] dark:text-[#F8FAFC] p-6 rounded-xl border border-[#E2E8F0] dark:border-[#334155] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#64748B] dark:text-[#94A3B8]">ZERO-MUTATION SANDBOX ENGINE</span>
              <h2 className="font-display text-2xl font-bold mt-0.5">6-Team AI Auction Simulation</h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-xl leading-relaxed">
                Runs an entire 73-player auction in-memory across 6 AI franchises (Aggressive Hunter, Value Investor, Balanced Builder) with zero SQLite database mutations.
              </p>
            </div>
            <button
              onClick={handleRunSimulation}
              disabled={simulationRunning}
              className="px-5 py-2.5 rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-bold inline-flex items-center gap-2 disabled:opacity-50 shrink-0 shadow"
            >
              <Sparkles className={`w-4 h-4 ${simulationRunning ? "animate-spin" : ""}`} />
              <span>{simulationRunning ? "Simulating..." : "Run AI Mock Auction"}</span>
            </button>
          </div>

          {simulationResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155]"><span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] block">Nominated</span><span className="font-mono text-2xl font-bold">{simulationResult.summary.total_players_nominated}</span></div>
                <div className="bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155]"><span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] block">Sold</span><span className="font-mono text-2xl font-bold">{simulationResult.summary.total_players_sold}</span></div>
                <div className="bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155]"><span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] block">Unsold</span><span className="font-mono text-2xl font-bold text-[#2563EB] dark:text-[#3B82F6]">{simulationResult.summary.total_players_unsold}</span></div>
                <div className="bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155]"><span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] block">Total Purse Spent</span><span className="font-mono text-2xl font-bold text-[#64748B] dark:text-[#94A3B8]">₹{simulationResult.summary.total_purse_spent}L</span></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {simulationResult.teams.map((st: any) => (
                  <div key={st.team_id} className="bg-white dark:bg-[#151F32] rounded-xl border border-[#E2E8F0] dark:border-[#334155] p-4 space-y-2.5 text-[#101828] dark:text-[#F8FAFC]">
                    <div className="flex justify-between border-b border-[#E2E8F0] dark:border-[#334155] pb-2">
                      <div>
                        <h4 className="font-display font-bold text-sm text-[#101828] dark:text-[#F8FAFC]">{st.team_name}</h4>
                        <span className="text-[10px] font-mono text-[#2563EB] dark:text-[#3B82F6]">{st.strategy_archetype}</span>
                      </div>
                      <div className="text-right font-mono text-xs">
                        <strong>Spent ₹{st.purse_spent}L</strong>
                        <span className="block text-[10px] text-[#64748B] dark:text-[#94A3B8]">Left ₹{st.purse_remaining}L</span>
                      </div>
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto text-xs">
                      {st.squad.map((sm: any) => (
                        <div key={sm.player_id} className="flex justify-between p-1.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#334155]">
                          <span className="font-semibold text-[#101828] dark:text-[#F8FAFC]">{sm.name}</span>
                          <span className="font-mono font-bold text-[#2563EB] dark:text-[#3B82F6]">₹{sm.purchase_price}L</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
