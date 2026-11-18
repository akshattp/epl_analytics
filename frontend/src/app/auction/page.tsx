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

      if (autoRouteTab && cfgRes) {
        if (cfgRes.status === "LIVE" || cfgRes.status === "PAUSED") {
          setActiveTab("live");
        } else if (cfgRes.status === "COMPLETED") {
          setActiveTab("results");
        } else {
          setActiveTab("setup");
        }
      }
    } catch (err) {
      console.error("Failed loading auction state:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCore(true);
    // Restore verified Bearer session from localStorage if still valid
    try {
      const savedToken = window.localStorage.getItem("epl_auth_token");
      if (savedToken) {
        fetchApi("/api/auth/me", { headers: { Authorization: `Bearer ${savedToken}` } })
          .then((res) => {
            setToken(savedToken);
            setCurrentUser(res.user);
            if (res.user?.team_id) setDashboardTeamId(res.user.team_id);
          })
          .catch(() => {
            window.localStorage.removeItem("epl_auth_token");
            window.localStorage.removeItem("epl_auth_user");
          });
      }
    } catch {
      // Ignore storage restrictions
    }
  }, []);

  // Countdown tick when BIDDING_ACTIVE
  useEffect(() => {
    if (auctionState !== "BIDDING_ACTIVE" || timerSeconds <= 0) return;
    const t = setInterval(() => {
      setTimerSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [auctionState, timerSeconds]);

  // Credentialed Authentication Handler (No plaintext PINs exposed by backend)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPin.trim()) {
      notify("Enter your official account PIN to sign in.", "error");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetchApi("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: loginUsername, password: loginPin.trim() }),
      });
      setToken(res.token);
      setCurrentUser(res.user);
      setLoginPin("");
      try {
        window.localStorage.setItem("epl_auth_token", res.token);
        window.localStorage.setItem("epl_auth_user", JSON.stringify(res.user));
      } catch {
        // Ignore storage restrictions
      }
      if (res.user.team_id) {
        setDashboardTeamId(res.user.team_id);
      }
      notify(`Authenticated as ${res.user.display_name}`, "success");
    } catch (err: any) {
      notify(err.message || "Invalid username or PIN", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    setDashboardData(null);
    try {
      window.localStorage.removeItem("epl_auth_token");
      window.localStorage.removeItem("epl_auth_user");
    } catch {
      // Ignore
    }
    notify("Signed out of auction persona.", "info");
  };

  // WebSocket Synchronization
  useEffect(() => {
    let ws: WebSocket | null = null;
    let isMounted = true;

    function connectWs() {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const isDirectLocalDev =
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") &&
        window.location.port === "3000";
      const wsHost = isDirectLocalDev ? `${window.location.hostname}:8000` : window.location.host;
      let url = `${protocol}//${wsHost}/api/auction/ws`;
      const params = new URLSearchParams();
      if (token) params.append("token", token);
      if (currentUser?.team_id) params.append("team_id", String(currentUser.team_id));
      if (params.toString()) url += `?${params.toString()}`;

      try {
        ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isMounted) setWsConnected(true);
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            handleWsMessage(JSON.parse(event.data));
          } catch (e) {
            console.error("WS parse error:", e);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setWsConnected(false);
          reconnectTimeoutRef.current = setTimeout(connectWs, 3000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch {
        reconnectTimeoutRef.current = setTimeout(connectWs, 3000);
      }
    }

    connectWs();
    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [token, currentUser]);

  const handleWsMessage = (data: any) => {
    switch (data.event) {
      case "CONNECTION_ESTABLISHED":
        if (data.auction_state) {
          setAuctionState(data.auction_state.state || "IDLE");
          setPodiumPlayer(data.auction_state.current_player);
          setCurrentBid(data.auction_state.current_bid || 0);
          setCurrentBidder(data.auction_state.current_bidder);
          setBidHistory(data.auction_state.bid_history || []);
        }
        break;

      case "AUCTION_STARTED":
        setConfig(data.config);
        setActiveTab("live");
        notify("Official Auction is now LIVE!", "success");
        break;

      case "AUCTION_PAUSED":
        setAuctionState("PAUSED");
        notify(data.message || "Auction paused by auctioneer.", "info");
        break;

      case "AUCTION_RESUMED":
        setAuctionState(data.state || "BIDDING_ACTIVE");
        notify(data.message || "Auction resumed.", "success");
        break;

      case "AUCTION_COMPLETED":
        setAuctionState("IDLE");
        refreshCore(false);
        setActiveTab("results");
        notify("Auction completed! Final franchise reports generated.", "success");
        break;

      case "PLAYER_NOMINATED":
        setAuctionState("BIDDING_ACTIVE");
        setPodiumPlayer(data.player);
        setCurrentBid(data.current_bid ?? data.base_price ?? 2.0);
        setCurrentBidder(null);
        setBidHistory([]);
        setTimerSeconds(data.bid_timer || config?.timer_duration || 15);
        notify(`Nominated: ${data.player.name} (Base ₹${data.base_price ?? data.current_bid}L)`, "info");
        if (data.player?.player_id) {
          fetchApi(`/api/auction/scarcity/${data.player.player_id}`)
            .then((sc) => setScarcityInfo(sc))
            .catch(() => setScarcityInfo(null));
        }
        break;

      case "NOMINATION_CANCELLED":
        setAuctionState("IDLE");
        setPodiumPlayer(null);
        setCurrentBid(0);
        setCurrentBidder(null);
        setScarcityInfo(null);
        refreshCore(false);
        notify("Nomination cancelled by auctioneer.", "info");
        break;

      case "NEW_HIGHEST_BID":
      case "BID_PLACED": {
        const amt = data.current_bid ?? data.bid_amount;
        const bidder = data.current_bidder || {
          team_id: data.team_id,
          team_name: data.team_name,
          owner_name: data.owner_name,
        };
        setCurrentBid(amt);
        setCurrentBidder(bidder);
        setTimerSeconds(data.bid_timer || config?.timer_duration || 15);
        if (data.bid_history) {
          setBidHistory(data.bid_history);
        } else if (data.bid_entry) {
          setBidHistory((prev) => [...prev, data.bid_entry]);
        }
        notify(`Leading Bid: ₹${Number(amt).toFixed(1)}L by ${bidder.team_name}`, "success");
        fetchApi("/api/auction/bid-history?limit=100").then((r) => setPersistedBids(r.bids || [])).catch(() => {});
        break;
      }

      case "BID_REJECTED":
        notify(`Bid Rejected: ${data.reason}`, "error");
        break;

      case "TIMER_UPDATED":
      case "TIMER_UPDATE":
        setTimerSeconds(data.seconds_remaining ?? data.seconds_left ?? 15);
        break;

      case "PLAYER_SOLD": {
        setAuctionState("SOLD");
        const wname = data.winning_team_name || data.winning_team?.team_name || "Franchise";
        notify(`SOLD! ${data.player?.name} acquired by ${wname} for ₹${Number(data.final_price || 0).toFixed(1)}L`, "success");
        refreshCore(false);
        break;
      }

      case "PLAYER_UNSOLD":
        setAuctionState("UNSOLD");
        notify(`UNSOLD: ${data.player?.name}`, "info");
        refreshCore(false);
        break;

      case "AUTH_ERROR":
        notify(`Authorization Error: ${data.message}`, "error");
        break;
    }
  };

  // Load Owner Dashboard / Auction Results when switching tabs
  useEffect(() => {
    if (activeTab === "dashboard") {
      if (!token) {
        setDashboardData(null);
        setDashboardLoading(false);
        return;
      }
      const targetTid = currentUser?.role === "team_owner" ? currentUser.team_id : dashboardTeamId;
      setDashboardLoading(true);
      fetchApi(`/api/auction/dashboard/${targetTid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => setDashboardData(res))
        .catch(() => setDashboardData(null))
        .finally(() => setDashboardLoading(false));
    }
    if (activeTab === "results") {
      fetchApi("/api/auction/results")
        .then((res) => setResultsData(res))
        .catch(() => setResultsData(null));
    }
  }, [activeTab, dashboardTeamId, token, currentUser]);

  const sendWsAction = (payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    } else {
      notify("WebSocket is offline. Reconnecting...", "error");
    }
  };

  const nominateById = (pid: string, bpOverride?: number) => {
    const pl = players.find((p) => p.player_id === pid);
    const poolItem = pool.find((e) => e.player_id === pid);
    if (!pl) return;
    const bp = bpOverride ?? poolItem?.base_price ?? pl.base_price ?? config?.min_base_price ?? 2.0;
    sendWsAction({
      action: "NOMINATE",
      player: {
        player_id: pl.player_id,
        name: pl.name,
        primary_role: pl.primary_role,
        batting_hand: pl.batting_hand,
        rating: pl.overall_rating,
        overall_rating: pl.overall_rating,
        category: poolItem?.category || pl.category,
        matches: pl.matches,
        total_runs: pl.total_runs,
        strike_rate: pl.strike_rate,
        wickets: pl.wickets,
        economy: pl.economy,
        estimated_valuation: pl.estimated_valuation,
        scarcity_multiplier: pl.scarcity_multiplier,
      },
      base_price: Number(bp),
    });
  };

  const pendingQueue = pool.filter((e) => e.is_available && e.auction_status === "PENDING");
  const handleAdvanceNext = () => {
    if (pendingQueue.length === 0) {
      notify("No remaining PENDING players in the queue.", "info");
      return;
    }
    const nxt = pendingQueue[0];
    setSelectedNominationId(nxt.player_id);
    setCustomBasePrice(nxt.base_price);
    nominateById(nxt.player_id, nxt.base_price);
  };

  const roundBid = (val: number) => Math.round(val * 10) / 10;
  const bidStep = config?.min_bid_increment || 0.5;

  const handlePlaceBid = (increment: number) => {
    if (!currentUser || currentUser.role !== "team_owner") {
      notify("Sign in as a Franchise Owner to place bids.", "error");
      return;
    }
    const teamObj = teams.find((t) => t.team_id === currentUser.team_id);
    const nextAmount = roundBid(currentBid + increment);
    sendWsAction({
      action: "BID",
      team_id: currentUser.team_id,
      team_name: teamObj?.team_name || currentUser.display_name,
      owner_name: teamObj?.owner_name || currentUser.username,
      bid_amount: nextAmount,
    });
  };

  const handleCustomBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.role !== "team_owner") return;
    const amount = parseFloat(customBidAmount);
    if (isNaN(amount) || amount <= currentBid) {
      notify(`Bid must exceed ₹${currentBid}L.`, "error");
      return;
    }
    const teamObj = teams.find((t) => t.team_id === currentUser.team_id);
    sendWsAction({
      action: "BID",
      team_id: currentUser.team_id,
      team_name: teamObj?.team_name || currentUser.display_name,
      owner_name: teamObj?.owner_name || currentUser.username,
      bid_amount: roundBid(amount),
    });
    setCustomBidAmount("");
  };

  const handleCompleteAuction = async () => {
    if (!token || currentUser?.role !== "auctioneer") return;
    if (!window.confirm("Mark this auction COMPLETED and lock final squads?")) return;
    try {
      await fetchApi("/api/auction/lifecycle/complete", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      refreshCore(false);
      setActiveTab("results");
    } catch (err: any) {
      notify(`Failed to complete auction: ${err.message}`, "error");
    }
  };

  const handleAdminReset = async () => {
    if (!token || currentUser?.role !== "auctioneer") {
      notify("Only the Official Auctioneer can reset the auction database.", "error");
      return;
    }
    if (!window.confirm("Reset all squads, bid audits, pool statuses, and purses back to initial DRAFT state?")) return;
    try {
      await fetchApi("/api/auction/admin/reset", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setPodiumPlayer(null);
      setCurrentBid(0);
      setCurrentBidder(null);
      setBidHistory([]);
      setAuctionState("IDLE");
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
    { key: "player_name", header: "Player", minWidth: "150px", render: (r) => <span className="font-bold text-[#07203F]">{r.player_name}</span> },
    { key: "team_name", header: "Franchise", minWidth: "145px" },
    { key: "bid_amount", header: "Bid (L)", align: "right", minWidth: "80px", render: (r) => <span className="font-mono font-bold text-[#A65E46]">₹{Number(r.bid_amount).toFixed(1)}L</span> },
    {
      key: "status",
      header: "Status",
      align: "center",
      minWidth: "90px",
      render: (r) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          r.status === "SOLD" ? "bg-[#A65E46] text-[#EBDED4]" : "bg-[#EBDED4] text-[#07203F]"
        }`}>
          {r.status}
        </span>
      ),
    },
    {
      key: "timestamp",
      header: "Timestamp",
      minWidth: "140px",
      render: (r) => <span className="font-mono text-[10px] text-[#07203F]/70">{r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : "—"}</span>,
    },
  ];

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin w-10 h-10 border-4 border-[#07203F] border-t-transparent rounded-full mb-4"></div>
        <p className="font-serif text-xl text-[#07203F]">Initializing EPL Auction Management Suite...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* TOP BANNER & PERSONA AUTHENTICATION */}
      <div className="bg-[#02000D] text-[#EBDED4] p-5 sm:p-6 rounded-xl border border-[#D9AA90]/30 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#D9AA90] uppercase tracking-wider mb-1">
              <Gavel className="w-4 h-4 text-[#A65E46]" />
              <span>{config?.auction_name || "EPL Official Player Auction"}</span>
              <span className="px-2 py-0.5 rounded bg-[#07203F] border border-[#D9AA90]/35 font-mono text-[10px]">
                LIFECYCLE: {config?.status || "DRAFT"}
              </span>
              <span className={`px-2 py-0.5 rounded font-mono text-[10px] border ${
                wsConnected ? "bg-[#07203F] text-[#D9AA90] border-[#D9AA90]/40" : "bg-[#A65E46]/30 text-[#EBDED4] border-[#A65E46]"
              }`}>
                {wsConnected ? "● WS CONNECTED" : "○ RECONNECTING"}
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#EBDED4]">
              Tournament Auction Management Center
            </h1>
            <p className="text-xs text-[#EBDED4]/75 mt-1">
              Full pre-auction setup wizard, authenticated six-owner live bidding, atomic reserve enforcement, and final squad reporting.
            </p>
          </div>

          {/* Persona Authentication Switcher */}
          <div className="bg-[#07203F] p-3.5 rounded-lg border border-[#D9AA90]/30 min-w-[300px]">
            <div className="text-[10px] uppercase font-bold text-[#D9AA90] flex justify-between items-center mb-1.5">
              <span>AUTHENTICATED IDENTITY</span>
              {currentUser ? (
                <button onClick={handleLogout} className="text-[10px] text-[#D9AA90] hover:text-white underline">
                  Switch / Logout
                </button>
              ) : (
                <span className="text-[#D9AA90]/75">SPECTATOR MODE</span>
              )}
            </div>
            {currentUser ? (
              <div className="space-y-1">
                <div className="font-serif font-bold text-sm text-[#EBDED4] flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#D9AA90]" />
                  <span>{currentUser.display_name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#A65E46] text-[#EBDED4]">
                    {currentUser.role === "auctioneer" ? "AUCTIONEER" : `TEAM ${currentUser.team_id}`}
                  </span>
                </div>
                {isOwner && currentOwnerTeam && (
                  <div className="text-[11px] text-[#EBDED4]/85 flex justify-between pt-1 border-t border-[#D9AA90]/20 font-mono">
                    <span>Purse: <strong>₹{currentOwnerTeam.purse_remaining}L</strong></span>
                    <span>Slots: <strong>{currentOwnerTeam.squad_size}/{currentOwnerTeam.max_squad_size}</strong></span>
                    <span>Max Bid: <strong className="text-[#D9AA90]">₹{maxBidPossible.toFixed(1)}L</strong></span>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleLoginSubmit} className="space-y-1.5">
                <select
                  aria-label="Select Auction Account"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full px-2 py-1 text-[11px] rounded bg-[#02000D] text-[#EBDED4] border border-[#D9AA90]/30"
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
                    placeholder="Enter secret PIN..."
                    aria-label="Account PIN"
                    className="flex-1 px-2 py-1 text-[11px] font-mono rounded bg-[#02000D] text-[#EBDED4] border border-[#D9AA90]/30 focus:outline-none focus:border-[#A65E46]"
                  />
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="px-3 py-1 rounded bg-[#A65E46] text-[#EBDED4] hover:bg-[#A65E46]/85 text-[11px] font-bold transition disabled:opacity-50"
                  >
                    {authLoading ? "..." : "Sign In"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Alert Banner (Strict 5-color palette) */}
        {bidAlert && (
          <div className={`mt-3 px-3.5 py-2.5 rounded text-xs font-semibold flex items-center justify-between border ${
            bidAlert.type === "error"
              ? "bg-[#A65E46] text-[#EBDED4] border-[#D9AA90]"
              : "bg-[#07203F] text-[#EBDED4] border-[#D9AA90]/45"
          }`}>
            <div className="flex items-center gap-2">
              {bidAlert.type === "success" ? <CheckCircle2 className="w-4 h-4 text-[#D9AA90]" /> : <AlertCircle className="w-4 h-4 text-[#D9AA90]" />}
              <span>{bidAlert.message}</span>
            </div>
            <button onClick={() => setBidAlert(null)} className="text-xs hover:text-white px-1">✕</button>
          </div>
        )}

        {/* 5-Stage Lifecycle Tabs */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#D9AA90]/20 text-xs">
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
                className={`px-3 py-1.5 rounded font-semibold transition inline-flex items-center gap-1.5 ${
                  activeTab === t.id
                    ? "bg-[#D9AA90] text-[#02000D]"
                    : "bg-[#07203F]/70 text-[#EBDED4] hover:bg-[#07203F]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================================================================= */}
      {/* TAB 1: PRE-AUCTION SETUP WIZARD */}
      {/* ================================================================= */}
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

      {/* ================================================================= */}
      {/* TAB 2: LIVE BIDDING ROOM */}
      {/* ================================================================= */}
      {activeTab === "live" && (
        <div className="space-y-6">
          {config?.status === "DRAFT" || config?.status === "CONFIGURED" ? (
            <div className="bg-white/95 rounded-xl border border-[#A65E46] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#07203F]">Auction Has Not Started Yet ({config.status})</h3>
                <p className="text-[#07203F]/80 mt-0.5">
                  Complete the Pre-Auction Setup Wizard and click <strong>START AUCTION</strong> to lock configuration and officially open bidding.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("setup")}
                className="px-4 py-2 rounded bg-[#A65E46] text-[#EBDED4] font-semibold hover:bg-[#A65E46]/90 shrink-0"
              >
                Go to Setup Wizard →
              </button>
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Stage (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Podium */}
              <div className="bg-white/95 rounded-xl border border-[#07203F]/20 shadow-md overflow-hidden">
                <div className="bg-[#07203F] text-[#EBDED4] px-5 py-3 flex items-center justify-between">
                  <span className="font-serif font-bold text-sm tracking-wide">
                    PODIUM STATUS: {auctionState}
                  </span>
                  {auctionState === "BIDDING_ACTIVE" && (
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded font-mono font-bold text-xs ${
                      timerSeconds <= 5 ? "bg-[#A65E46] text-[#EBDED4]" : "bg-[#02000D]/60 text-[#D9AA90]"
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timerSeconds}s</span>
                    </div>
                  )}
                </div>

                {auctionState === "BIDDING_ACTIVE" && (
                  <div className="w-full bg-[#EBDED4] h-1.5">
                    <div
                      className="h-full bg-[#A65E46] transition-all duration-1000"
                      style={{ width: `${Math.min(100, (timerSeconds / (config?.timer_duration || 15)) * 100)}%` }}
                    ></div>
                  </div>
                )}

                <div className="p-6">
                  {podiumPlayer ? (
                    <div className="space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#07203F]/10 pb-4">
                        <div>
                          <div className="text-[10px] font-mono font-bold uppercase text-[#A65E46]">
                            ON THE BLOCK • {podiumPlayer.player_id}
                          </div>
                          <h2 className="font-serif text-3xl font-bold text-[#02000D] mt-0.5">
                            {podiumPlayer.name}
                          </h2>
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                            <span className="bg-[#07203F] text-[#EBDED4] px-2.5 py-0.5 rounded font-semibold">
                              {podiumPlayer.primary_role}
                            </span>
                            <span className="bg-[#EBDED4] text-[#07203F] px-2.5 py-0.5 rounded font-medium">
                              {podiumPlayer.category}
                            </span>
                            <span className="font-mono text-[#07203F]/70">{podiumPlayer.batting_hand || "RHB"}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-[#07203F]/60 block mb-1">EPL RATING</span>
                          <RatingBadge score={podiumPlayer.overall_rating || podiumPlayer.rating || 65} size="lg" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-[#EBDED4]/40 p-3 rounded-lg border border-[#07203F]/10 text-center">
                        <div><span className="text-[10px] text-[#07203F]/65 block">Matches</span><strong className="font-mono text-sm text-[#07203F]">{podiumPlayer.matches || 0}</strong></div>
                        <div><span className="text-[10px] text-[#07203F]/65 block">Runs</span><strong className="font-mono text-sm text-[#07203F]">{podiumPlayer.total_runs || 0}</strong></div>
                        <div><span className="text-[10px] text-[#07203F]/65 block">Bat SR</span><strong className="font-mono text-sm text-[#07203F]">{podiumPlayer.strike_rate ? Number(podiumPlayer.strike_rate).toFixed(1) : "—"}</strong></div>
                        <div><span className="text-[10px] text-[#07203F]/65 block">Wickets</span><strong className="font-mono text-sm text-[#07203F]">{podiumPlayer.wickets || 0}</strong></div>
                        <div><span className="text-[10px] text-[#07203F]/65 block">Economy</span><strong className="font-mono text-sm text-[#07203F]">{podiumPlayer.economy ? Number(podiumPlayer.economy).toFixed(2) : "—"}</strong></div>
                      </div>

                      {scarcityInfo && (
                        <div className="bg-[#EBDED4]/45 border-l-4 border-[#A65E46] p-3 rounded text-xs text-[#07203F]">
                          <strong className="inline-flex items-center gap-1 text-[#A65E46]">
                            <Zap className="w-3.5 h-3.5" /> Market Scarcity: {scarcityInfo.scarcity_level} • Ceiling ₹{scarcityInfo.recommended_valuation_ceiling}L
                          </strong>
                          <span className="block text-[11px] mt-0.5">{scarcityInfo.tactical_bidding_advice}</span>
                        </div>
                      )}

                      {/* Leading Bid Callout */}
                      <div className="bg-[#07203F] text-[#EBDED4] p-6 rounded-xl border border-[#D9AA90]/40 text-center">
                        <div className="text-[10px] font-mono uppercase tracking-widest text-[#D9AA90]">
                          CURRENT HIGHEST BID
                        </div>
                        <div className="font-serif text-4xl sm:text-5xl font-bold my-2">
                          ₹{currentBid.toFixed(1)} <span className="text-lg font-normal text-[#D9AA90]">Lakhs</span>
                        </div>
                        {currentBidder ? (
                          <div className="inline-flex items-center gap-2 bg-[#02000D]/60 px-3.5 py-1.5 rounded-full border border-[#D9AA90]/35 text-xs">
                            <Shield className="w-3.5 h-3.5 text-[#D9AA90]" />
                            <strong>{currentBidder.team_name}</strong>
                            <span className="text-[#D9AA90]">({currentBidder.owner_name})</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#D9AA90]/80 italic">Awaiting opening bid above base price</span>
                        )}
                      </div>

                      {/* Owner Bid Panel */}
                      {isOwner && auctionState === "BIDDING_ACTIVE" && (
                        <div className="bg-[#EBDED4]/45 p-4 rounded-xl border border-[#07203F]/20 space-y-3">
                          <div className="flex flex-wrap justify-between items-center text-xs">
                            <strong className="text-[#07203F]">BID AS: {currentOwnerTeam?.team_name}</strong>
                            <span className="font-mono text-[#07203F]/80">
                              Max Cap: <strong>₹{maxBidPossible.toFixed(1)}L</strong> (Reserve ₹{reserveRequired.toFixed(1)}L)
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {[bidStep, roundBid(bidStep * 2), roundBid(bidStep * 4)].map((inc) => (
                              <button
                                key={inc}
                                onClick={() => handlePlaceBid(inc)}
                                disabled={currentBid + inc > maxBidPossible}
                                className="bg-[#07203F] text-[#EBDED4] hover:bg-[#A65E46] py-2.5 rounded text-xs font-bold transition disabled:opacity-35"
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
                              className="flex-1 px-3 py-1.5 text-xs font-mono rounded border border-[#07203F]/20 bg-white"
                            />
                            <button type="submit" className="px-4 py-1.5 rounded bg-[#A65E46] text-[#EBDED4] text-xs font-bold hover:bg-[#A65E46]/90">
                              Place Bid
                            </button>
                          </form>
                        </div>
                      )}

                      {/* Auctioneer Controls */}
                      {isAuctioneer && (
                        <div className="bg-[#02000D] text-[#EBDED4] p-4 rounded-xl border border-[#A65E46]/60 space-y-3">
                          <div className="text-[11px] font-bold text-[#D9AA90] uppercase tracking-wider border-b border-[#D9AA90]/20 pb-1.5">
                            Auctioneer Command Deck
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => sendWsAction({ action: "SOLD" })}
                              disabled={!currentBidder}
                              className="px-3.5 py-2 rounded bg-[#A65E46] text-[#EBDED4] hover:bg-[#A65E46]/85 text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-35"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Declare SOLD</span>
                            </button>
                            <button
                              onClick={() => sendWsAction({ action: "UNSOLD" })}
                              className="px-3.5 py-2 rounded bg-[#07203F] text-[#EBDED4] border border-[#D9AA90]/40 hover:bg-[#07203F]/80 text-xs font-bold inline-flex items-center gap-1.5"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Declare UNSOLD</span>
                            </button>
                            {auctionState === "PAUSED" ? (
                              <button
                                onClick={() => sendWsAction({ action: "RESUME" })}
                                className="px-3 py-2 rounded bg-[#D9AA90] text-[#02000D] text-xs font-bold inline-flex items-center gap-1.5"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>Resume Bidding</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => sendWsAction({ action: "PAUSE" })}
                                className="px-3 py-2 rounded bg-[#07203F] text-[#D9AA90] border border-[#D9AA90]/30 text-xs font-semibold inline-flex items-center gap-1.5"
                              >
                                <Pause className="w-3.5 h-3.5" />
                                <span>Pause Bidding</span>
                              </button>
                            )}
                            <button
                              onClick={() => sendWsAction({ action: "SET_TIMER", seconds: config?.timer_duration || 15 })}
                              className="px-3 py-2 rounded bg-[#07203F] text-[#EBDED4] border border-[#D9AA90]/30 text-xs font-semibold inline-flex items-center gap-1.5"
                            >
                              <Clock className="w-3.5 h-3.5 text-[#D9AA90]" />
                              <span>Reset Timer</span>
                            </button>
                            <button
                              onClick={() => sendWsAction({ action: "UNDO" })}
                              className="px-3 py-2 rounded bg-transparent text-[#D9AA90] border border-[#D9AA90]/30 hover:bg-white/10 text-xs font-semibold inline-flex items-center gap-1.5"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Cancel Nomination</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-14 text-center space-y-3">
                      <Gavel className="w-10 h-10 mx-auto text-[#07203F]/45" />
                      <h3 className="font-serif text-xl font-bold text-[#07203F]">Auction Podium Clear</h3>
                      <p className="text-xs text-[#07203F]/70 max-w-md mx-auto">
                        Auctioneer can advance the next player in queue or select any player from the pool below.
                      </p>
                      {isAuctioneer && pendingQueue.length > 0 && (
                        <button
                          onClick={handleAdvanceNext}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#A65E46] text-[#EBDED4] text-xs font-bold hover:bg-[#A65E46]/90"
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
                <div className="bg-white/95 p-5 rounded-xl border border-[#07203F]/20 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#07203F]/10 pb-2.5">
                    <h3 className="font-serif text-base font-bold text-[#07203F]">Nominate Player &amp; Session Lifecycle</h3>
                    <div className="flex gap-2">
                      <button onClick={handleAdvanceNext} className="px-3 py-1 rounded bg-[#07203F] text-[#EBDED4] text-xs font-semibold inline-flex items-center gap-1">
                        <FastForward className="w-3 h-3" />
                        <span>Next Queue ({pendingQueue.length})</span>
                      </button>
                      <button onClick={handleCompleteAuction} className="px-3 py-1 rounded bg-[#A65E46] text-[#EBDED4] text-xs font-semibold">
                        Complete Auction
                      </button>
                      <button onClick={handleAdminReset} className="px-3 py-1 rounded border border-[#A65E46] text-[#A65E46] text-xs font-semibold hover:bg-[#EBDED4]">
                        Reset Draft
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-7">
                      <label className="text-[10px] font-bold uppercase text-[#07203F] block mb-1">Select Player</label>
                      <select
                        value={selectedNominationId}
                        onChange={(e) => {
                          setSelectedNominationId(e.target.value);
                          const pe = pool.find((x) => x.player_id === e.target.value);
                          if (pe) setCustomBasePrice(pe.base_price);
                        }}
                        className="w-full px-3 py-2 text-xs rounded border border-[#07203F]/20 bg-[#EBDED4]/30"
                      >
                        {pool.filter((x) => x.is_available).map((p) => (
                          <option key={p.player_id} value={p.player_id}>
                            [{p.auction_status}] {p.name} • {p.category} • ₹{p.base_price}L
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold uppercase text-[#07203F] block mb-1">Base (L)</label>
                      <input type="number" step="0.5" min="1" value={customBasePrice} onChange={(e) => setCustomBasePrice(parseFloat(e.target.value) || 2)} className="w-full px-3 py-2 text-xs font-mono rounded border border-[#07203F]/20 bg-[#EBDED4]/30" />
                    </div>
                    <div className="sm:col-span-3">
                      <button onClick={() => nominateById(selectedNominationId, customBasePrice)} className="w-full py-2 rounded bg-[#07203F] text-[#EBDED4] hover:bg-[#A65E46] text-xs font-bold transition">
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

            {/* Right Sidebar (4 cols): Next Queue, Live Round Feed & 6-Team Purse Trackers */}
            <div className="lg:col-span-4 space-y-6">
              {/* Six Franchise Purse Trackers */}
              <div className="bg-white/95 rounded-xl border border-[#07203F]/20 p-4 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#07203F]/10 pb-2">
                  <span className="font-serif font-bold text-sm text-[#07203F]">Six Franchise Purses</span>
                  <span className="text-[10px] font-mono text-[#A65E46]">LIVE SYNC</span>
                </div>
                {teams.map((t) => (
                  <div
                    key={t.team_id}
                    onClick={() => {
                      setDashboardTeamId(t.team_id);
                      setActiveTab("dashboard");
                    }}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex justify-between items-center ${
                      currentBidder?.team_id === t.team_id
                        ? "bg-[#07203F] text-[#EBDED4] border-[#A65E46]"
                        : "bg-[#EBDED4]/30 hover:bg-[#D9AA90]/30 text-[#07203F] border-[#07203F]/12"
                    }`}
                  >
                    <div>
                      <div className="font-bold">{t.team_name}</div>
                      <div className="text-[10px] opacity-75">{t.owner_name} • {t.squad_size}/{t.max_squad_size} slots</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-sm">₹{t.purse_remaining}L</div>
                      <div className="text-[10px] opacity-70">Spent ₹{t.purse_spent}L</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Next Player Queue */}
              <div className="bg-white/95 rounded-xl border border-[#07203F]/20 p-4 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#07203F]/10 pb-2">
                  <span className="font-serif font-bold text-sm text-[#07203F]">Next Player Queue</span>
                  <span className="text-[10px] font-mono text-[#07203F]/70">{pendingQueue.length} Pending</span>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 text-xs">
                  {pendingQueue.slice(0, 8).map((q, idx) => (
                    <div key={q.entry_id} className="p-2 rounded bg-[#EBDED4]/35 border border-[#07203F]/10 flex justify-between items-center">
                      <div>
                        <span className="font-mono text-[10px] text-[#A65E46] mr-1.5">#{idx + 1}</span>
                        <strong className="text-[#07203F]">{q.name}</strong>
                        <span className="block text-[10px] text-[#07203F]/65">{q.primary_role} • {q.category}</span>
                      </div>
                      <span className="font-mono font-bold text-[#07203F]">₹{q.base_price}L</span>
                    </div>
                  ))}
                  {pendingQueue.length === 0 && (
                    <p className="text-xs italic text-[#07203F]/60 text-center py-4">Queue empty.</p>
                  )}
                </div>
              </div>

              {/* Current Round Bid Stream */}
              <div className="bg-white/95 rounded-xl border border-[#07203F]/20 p-4 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#07203F]/10 pb-2">
                  <span className="font-serif font-bold text-sm text-[#07203F] flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[#A65E46]" />
                    <span>Active Round Bids</span>
                  </span>
                  <span className="text-[10px] font-mono">{bidHistory.length}</span>
                </div>
                <div className="space-y-1.5 max-h-52 overflow-y-auto text-xs">
                  {bidHistory.length > 0 ? (
                    [...bidHistory].reverse().map((bh, idx) => (
                      <div key={idx} className={`p-2 rounded border flex justify-between items-center ${idx === 0 ? "bg-[#07203F] text-[#EBDED4] border-[#A65E46]" : "bg-[#EBDED4]/30 text-[#07203F] border-[#07203F]/10"}`}>
                        <div>
                          <div className="font-bold">{bh.team_name}</div>
                          <div className="text-[10px] opacity-75">{bh.owner_name}</div>
                        </div>
                        <span className="font-mono font-bold">₹{Number(bh.amount).toFixed(1)}L</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-6 text-xs italic text-[#07203F]/55">No bids placed in active round.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: FRANCHISE OWNER DASHBOARD */}
      {/* ================================================================= */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="bg-white/95 p-5 rounded-xl border border-[#07203F]/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#A65E46] tracking-wider">Private Franchise Owner Intelligence</span>
              <h2 className="font-serif text-2xl font-bold text-[#07203F]">Squad Balance &amp; Target Recommendations</h2>
            </div>
            {isAuctioneer ? (
              <select
                value={dashboardTeamId}
                onChange={(e) => setDashboardTeamId(Number(e.target.value))}
                className="px-3 py-1.5 text-xs rounded border border-[#07203F]/20 bg-[#EBDED4]/45 font-bold text-[#07203F]"
              >
                {teams.map((t) => (
                  <option key={t.team_id} value={t.team_id}>Team {t.team_id}: {t.team_name} ({t.owner_name})</option>
                ))}
              </select>
            ) : isOwner && currentOwnerTeam ? (
              <span className="px-3 py-1.5 text-xs rounded bg-[#07203F] text-[#EBDED4] font-semibold">
                Private View: {currentOwnerTeam.team_name} ({currentOwnerTeam.owner_name})
              </span>
            ) : null}
          </div>

          {!token ? (
            <div className="bg-white/95 p-8 rounded-xl border border-[#07203F]/20 text-center space-y-2">
              <Shield className="w-8 h-8 mx-auto text-[#A65E46]" />
              <h3 className="font-serif text-lg font-bold text-[#07203F]">Owner Authentication Required</h3>
              <p className="text-xs text-[#07203F]/75 max-w-md mx-auto">
                Franchise squad recommendations and deficit diagnostics are private to each team owner. Sign in with your franchise PIN in the top-right panel to inspect your dashboard.
              </p>
            </div>
          ) : dashboardLoading ? (
            <div className="py-16 text-center text-sm text-[#07203F]">Loading owner dashboard...</div>
          ) : dashboardData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#07203F] text-[#EBDED4] p-4 rounded-xl">
                  <span className="text-[10px] uppercase text-[#D9AA90] block">Remaining Purse</span>
                  <span className="font-mono text-2xl font-bold">₹{Number(dashboardData.purse_remaining || 0).toFixed(1)}L</span>
                  <span className="text-[11px] text-[#EBDED4]/75 block">Spent ₹{Number(dashboardData.purse_spent || 0).toFixed(1)}L</span>
                </div>
                <div className="bg-[#07203F] text-[#EBDED4] p-4 rounded-xl">
                  <span className="text-[10px] uppercase text-[#D9AA90] block">Squad Slots</span>
                  <span className="font-mono text-2xl font-bold">{dashboardData.squad_size_current} / {dashboardData.squad_size_target}</span>
                  <span className="text-[11px] text-[#D9AA90] block">{dashboardData.remaining_slots} unfilled</span>
                </div>
                <div className="bg-[#07203F] text-[#EBDED4] p-4 rounded-xl">
                  <span className="text-[10px] uppercase text-[#D9AA90] block">Max Single Bid</span>
                  <span className="font-mono text-2xl font-bold text-[#D9AA90]">₹{Number(dashboardData.max_bid_capacity || 0).toFixed(1)}L</span>
                </div>
                <div className="bg-[#07203F] text-[#EBDED4] p-4 rounded-xl">
                  <span className="text-[10px] uppercase text-[#D9AA90] block">Squad Balance Score</span>
                  <span className="font-mono text-2xl font-bold">{dashboardData.squad_strengths?.squad_balance_score || 0} / 100</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Batting Strength", val: dashboardData.squad_strengths?.batting_strength || 0, color: "#A65E46" },
                  { label: "Bowling Strength", val: dashboardData.squad_strengths?.bowling_strength || 0, color: "#07203F" },
                  { label: "All-Rounder Strength", val: dashboardData.squad_strengths?.all_rounder_strength || 0, color: "#02000D" },
                ].map((s) => (
                  <div key={s.label} className="bg-white/95 p-4 rounded-xl border border-[#07203F]/15 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-[#07203F]">
                      <span>{s.label}</span>
                      <span className="font-mono">{s.val}</span>
                    </div>
                    <div className="w-full bg-[#EBDED4] h-2 rounded-full overflow-hidden">
                      <div className="h-full" style={{ width: `${Math.min(100, s.val)}%`, backgroundColor: s.color }}></div>
                    </div>
                  </div>
                ))}
              </div>

              {(dashboardData.squad_weaknesses || []).length > 0 && (
                <div className="bg-[#EBDED4] border-l-4 border-[#A65E46] p-4 rounded-r-lg text-xs text-[#07203F] space-y-1">
                  <strong className="uppercase text-[10px] tracking-wider text-[#A65E46] block">Squad Deficit Diagnostics</strong>
                  <ul className="list-disc list-inside">
                    {dashboardData.squad_weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}

              <DataTable
                data={dashboardData.squad_members || []}
                columns={[
                  { key: "name", header: "Player", minWidth: "160px", render: (r) => <Link href={`/players/${r.player_id}`} className="font-bold text-[#07203F] hover:text-[#A65E46]">{r.name}</Link> },
                  { key: "primary_role", header: "Role", minWidth: "120px" },
                  { key: "category", header: "Category", minWidth: "120px" },
                  { key: "purchase_price", header: "Cost (L)", align: "right", minWidth: "85px", render: (r) => <span className="font-mono font-bold text-[#A65E46]">₹{r.purchase_price}L</span> },
                ]}
                rowKey={(r) => r.player_id}
                title={`Acquired Squad (${(dashboardData.squad_members || []).length} Players)`}
                emptyMessage="No players acquired yet for this franchise."
              />

              <div className="bg-white/95 p-5 rounded-xl border border-[#07203F]/15 space-y-3">
                <h3 className="font-serif text-base font-bold text-[#07203F]">Recommended Remaining Targets</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(dashboardData.tailored_recommendations || []).map((tgt: any) => (
                    <div key={tgt.player_id} className="p-3 rounded-lg bg-[#EBDED4]/40 border border-[#07203F]/15 space-y-1 text-xs">
                      <div className="flex justify-between items-start">
                        <Link href={`/players/${tgt.player_id}`} className="font-bold text-[#07203F] hover:text-[#A65E46]">{tgt.name}</Link>
                        <span className="font-mono text-[10px] bg-[#07203F] text-[#EBDED4] px-1.5 py-0.5 rounded">{tgt.overall_rating}</span>
                      </div>
                      <div className="text-[10px] text-[#07203F]/70">{tgt.primary_role} • {tgt.category}</div>
                      <div className="font-mono font-bold text-[#A65E46]">Est: ₹{tgt.estimated_valuation}L • Priority: {tgt.fit_urgency}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 4: AUCTION RESULTS & REPORTING (PDF + EXCEL EXPORT) */}
      {/* ================================================================= */}
      {activeTab === "results" && resultsData && (
        <div className="space-y-6">
          <div className="bg-[#07203F] text-[#EBDED4] p-6 rounded-xl border border-[#D9AA90]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#D9AA90] font-bold">Post-Auction Analytics &amp; Squad Valuation</span>
              <h2 className="font-serif text-2xl font-bold mt-0.5">{resultsData.auction_name} – Results Report</h2>
              <p className="text-xs text-[#EBDED4]/80 mt-1">
                Sold: {resultsData.total_sold} • Unsold: {resultsData.total_unsold} • Combined League Spend: ₹{resultsData.total_spend} Lakhs
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleExportResults("pdf")}
                disabled={exportingResults !== null}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#A65E46] text-[#EBDED4] hover:bg-[#A65E46]/90 text-xs font-semibold transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{exportingResults === "pdf" ? "Generating PDF..." : "Export Results (PDF)"}</span>
              </button>
              <button
                onClick={() => handleExportResults("xlsx")}
                disabled={exportingResults !== null}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#EBDED4] text-[#07203F] hover:bg-[#D9AA90] text-xs font-semibold transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{exportingResults === "xlsx" ? "Generating Excel..." : "Export Results (Excel)"}</span>
              </button>
            </div>
          </div>

          {/* Highlights: Most Expensive & Best Value Buys */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white/95 p-5 rounded-xl border border-[#07203F]/15 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#A65E46]">Most Expensive Acquisition</span>
              {resultsData.most_expensive_player ? (
                <div>
                  <div className="font-serif text-2xl font-bold text-[#07203F]">{resultsData.most_expensive_player.player_name}</div>
                  <div className="text-xs text-[#07203F]/80 mt-1">
                    Sold to <strong>{resultsData.most_expensive_player.team_name}</strong> for{" "}
                    <strong className="font-mono text-[#A65E46]">₹{resultsData.most_expensive_player.purchase_price}L</strong> (Est. Value ₹{resultsData.most_expensive_player.estimated_valuation}L)
                  </div>
                </div>
              ) : (
                <p className="text-xs italic text-[#07203F]/60">No players sold yet in this auction session.</p>
              )}
            </div>

            <div className="bg-white/95 p-5 rounded-xl border border-[#07203F]/15 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#A65E46]">Top Best-Value Purchases (vs Historical Valuation)</span>
              {(resultsData.best_value_buys || []).length > 0 ? (
                <div className="space-y-1.5 text-xs">
                  {resultsData.best_value_buys.map((bv: any) => (
                    <div key={bv.player_id} className="flex justify-between items-center py-1 border-b border-[#07203F]/10">
                      <span><strong>{bv.player_name}</strong> → {bv.team_name}</span>
                      <span className="font-mono">
                        Paid ₹{bv.purchase_price}L vs Est ₹{bv.estimated_valuation}L{" "}
                        <strong className="text-[#A65E46]">({bv.value_delta >= 0 ? `+${bv.value_delta}L` : `${bv.value_delta}L`})</strong>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-[#07203F]/60">Complete player sales in the Live Room to generate value analytics.</p>
              )}
            </div>
          </div>

          {/* 6 Franchise Squad Summaries */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(resultsData.teams || []).map((t: any) => (
              <div key={t.team_id} className="bg-white/95 rounded-xl border border-[#07203F]/20 p-4 shadow-sm space-y-3">
                <div className="flex justify-between items-start border-b border-[#07203F]/10 pb-2">
                  <div>
                    <h4 className="font-serif font-bold text-base text-[#07203F]">{t.team_name}</h4>
                    <span className="text-[10px] text-[#07203F]/65">{t.owner_name} • Avg Rtg: <strong>{t.average_rating}</strong></span>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <div className="font-bold text-[#A65E46]">Spent ₹{t.purse_spent}L</div>
                    <div className="text-[10px] text-[#07203F]/65">Left ₹{t.purse_remaining}L</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center bg-[#EBDED4]/40 p-2 rounded text-[10px] font-mono">
                  <div>Bat Depth<strong className="block text-xs text-[#07203F]">{t.batting_depth}</strong></div>
                  <div>Bowl Depth<strong className="block text-xs text-[#07203F]">{t.bowling_depth}</strong></div>
                  <div>All-Rounders<strong className="block text-xs text-[#A65E46]">{t.all_rounder_count}</strong></div>
                </div>
                <div className="space-y-1 max-h-44 overflow-y-auto text-xs">
                  {(t.squad || []).length > 0 ? t.squad.map((p: any) => (
                    <div key={p.player_id} className="flex justify-between py-1 border-b border-[#07203F]/8">
                      <span className="font-semibold text-[#07203F]">{p.player_name} <span className="text-[10px] font-normal opacity-70">({p.role})</span></span>
                      <span className="font-mono font-bold text-[#A65E46]">₹{p.purchase_price}L</span>
                    </div>
                  )) : (
                    <p className="text-[11px] italic text-[#07203F]/55 py-2">No acquisitions yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <DataTable
            data={resultsData.unsold_players || []}
            columns={[
              { key: "name", header: "Player", minWidth: "165px", render: (r) => <Link href={`/players/${r.player_id}`} className="font-bold text-[#07203F] hover:text-[#A65E46]">{r.name}</Link> },
              { key: "primary_role", header: "Role", minWidth: "120px" },
              { key: "category", header: "Category", minWidth: "130px" },
              { key: "base_price", header: "Base Price (L)", align: "right", minWidth: "90px", render: (r) => <span className="font-mono">₹{r.base_price}L</span> },
              { key: "overall_rating", header: "EPL Rtg", align: "right", minWidth: "80px" },
              { key: "auction_status", header: "Pool Status", align: "center", minWidth: "95px" },
            ]}
            rowKey={(r) => r.player_id}
            title={`Remaining / Unsold Player Pool (${(resultsData.unsold_players || []).length})`}
            searchable
            defaultSortKey="overall_rating"
          />
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 5: AI MOCK AUCTION SANDBOX */}
      {/* ================================================================= */}
      {activeTab === "simulation" && (
        <div className="space-y-6">
          <div className="bg-[#02000D] text-[#EBDED4] p-6 rounded-xl border border-[#D9AA90]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#D9AA90]">ZERO-MUTATION SANDBOX ENGINE</span>
              <h2 className="font-serif text-2xl font-bold mt-0.5">6-Team AI Auction Simulation</h2>
              <p className="text-xs text-[#EBDED4]/75 mt-1 max-w-xl">
                Runs an entire 73-player auction in-memory across 6 AI franchises (Aggressive Hunter, Value Investor, Balanced Builder) with zero SQLite database mutations.
              </p>
            </div>
            <button
              onClick={handleRunSimulation}
              disabled={simulationRunning}
              className="px-5 py-2.5 rounded-lg bg-[#A65E46] text-[#EBDED4] hover:bg-[#A65E46]/90 text-xs font-bold inline-flex items-center gap-2 disabled:opacity-50 shrink-0"
            >
              <Sparkles className={`w-4 h-4 ${simulationRunning ? "animate-spin" : ""}`} />
              <span>{simulationRunning ? "Simulating..." : "Run AI Mock Auction"}</span>
            </button>
          </div>

          {simulationResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#07203F] text-[#EBDED4] p-4 rounded-xl"><span className="text-[10px] uppercase text-[#D9AA90] block">Nominated</span><span className="font-mono text-2xl font-bold">{simulationResult.summary.total_players_nominated}</span></div>
                <div className="bg-[#07203F] text-[#EBDED4] p-4 rounded-xl"><span className="text-[10px] uppercase text-[#D9AA90] block">Sold</span><span className="font-mono text-2xl font-bold">{simulationResult.summary.total_players_sold}</span></div>
                <div className="bg-[#07203F] text-[#EBDED4] p-4 rounded-xl"><span className="text-[10px] uppercase text-[#D9AA90] block">Unsold</span><span className="font-mono text-2xl font-bold text-[#D9AA90]">{simulationResult.summary.total_players_unsold}</span></div>
                <div className="bg-[#07203F] text-[#EBDED4] p-4 rounded-xl"><span className="text-[10px] uppercase text-[#D9AA90] block">Total Purse Spent</span><span className="font-mono text-2xl font-bold text-[#D9AA90]">₹{simulationResult.summary.total_purse_spent}L</span></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {simulationResult.teams.map((st: any) => (
                  <div key={st.team_id} className="bg-white/95 rounded-xl border border-[#07203F]/20 p-4 space-y-2.5">
                    <div className="flex justify-between border-b border-[#07203F]/10 pb-2">
                      <div>
                        <h4 className="font-serif font-bold text-sm text-[#07203F]">{st.team_name}</h4>
                        <span className="text-[10px] font-mono text-[#A65E46]">{st.strategy_archetype}</span>
                      </div>
                      <div className="text-right font-mono text-xs">
                        <strong>Spent ₹{st.purse_spent}L</strong>
                        <span className="block text-[10px] text-[#07203F]/65">Left ₹{st.purse_remaining}L</span>
                      </div>
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto text-xs">
                      {st.squad.map((sm: any) => (
                        <div key={sm.player_id} className="flex justify-between p-1.5 rounded bg-[#EBDED4]/35">
                          <span className="font-semibold text-[#07203F]">{sm.name}</span>
                          <span className="font-mono font-bold text-[#A65E46]">₹{sm.purchase_price}L</span>
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
