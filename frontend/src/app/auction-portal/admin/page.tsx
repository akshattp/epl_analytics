"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert, Users, Settings, Database,
  RotateCcw, CheckCircle2, AlertTriangle, LogOut,
  ExternalLink, BarChart3, Gavel
} from "lucide-react";

interface UserAccount {
  id: number;
  username: string;
  role: string;
  team_id: number | null;
  display_name: string;
}

export default function AdminAuctionPortal() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("epl_auction_role");
    const token = localStorage.getItem("epl_auction_token");
    if (!token || (role !== "super_admin" && role !== "admin")) {
      router.replace("/auction-portal/login");
      return;
    }
    setAuthed(true);

    // Fetch initial config & system overview
    fetch("/api/auction/config")
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(() => {});

    // Default users catalog (since we have canonical users)
    setUsers([
      { id: 1, username: "admin", role: "super_admin", team_id: null, display_name: "EPL System Administrator" },
      { id: 2, username: "auctioneer", role: "auctioneer", team_id: null, display_name: "Official Auctioneer & Controller" },
      { id: 3, username: "vipers", role: "team_owner", team_id: 1, display_name: "Victory Vipers (Sandeep Dalvi)" },
      { id: 4, username: "warriors", role: "team_owner", team_id: 2, display_name: "Exotica Warriors (Aryan Shetty)" },
      { id: 5, username: "ultimates", role: "team_owner", team_id: 3, display_name: "The Ultimates (Anurag Jain)" },
      { id: 6, username: "panthers", role: "team_owner", team_id: 4, display_name: "Exotica Panthers (Ashish Chhawchharia)" },
      { id: 7, username: "legends", role: "team_owner", team_id: 5, display_name: "Exotica Living Legenda (Vijay Limbachiya)" },
      { id: 8, username: "lions", role: "team_owner", team_id: 6, display_name: "Exotica Lions Pride (Yash Patel)" },
    ]);
  }, [router]);

  const handleResetAuction = async () => {
    if (!confirm("Are you sure you want to reset the live auction? All bids will be archived and squad allocations cleared to baseline.")) {
      return;
    }
    setResetting(true);
    setResetSuccess(null);
    try {
      const token = localStorage.getItem("epl_auction_token");
      const res = await fetch("/api/auction/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        setResetSuccess("Auction state has been safely reset to pre-auction baseline.");
      } else {
        const err = await res.json();
        alert(`Reset error: ${err.detail || "Failed to reset"}`);
      }
    } catch (e: any) {
      alert(`Network error: ${e.message}`);
    } finally {
      setResetting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.replace("/auction-portal/login");
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#111318] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF4B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#F1EBDD]">
      {/* Header */}
      <div className="bg-[#111318] border-b border-[#2A2E38]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF4B35]/15 border border-[#FF4B35]/30 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-[#FF4B35]" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#FF4B35]">Super Admin Console</div>
                <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#F1EBDD]">Auction Governance & Control</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/auction-portal/live"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#181A20] border border-[#2A2E38] text-xs font-semibold text-[#A8A295] hover:text-[#F1EBDD] transition-colors"
              >
                <Gavel className="w-3.5 h-3.5 text-[#FF4B35]" />
                Live Terminal
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#181A20] border border-[#2A2E38] text-xs font-semibold text-[#A8A295] hover:text-[#FF4B35] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {resetSuccess && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{resetSuccess}</span>
          </div>
        )}

        {/* Global Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#111318] border border-[#2A2E38] rounded-2xl p-5">
            <div className="text-xs text-[#A8A295] uppercase font-mono tracking-wider">Total Franchises</div>
            <div className="text-2xl font-bold font-mono text-[#F1EBDD] mt-1">6 Teams</div>
            <div className="text-[11px] text-[#5C584E] mt-1">₹100.0L Purse allocation each</div>
          </div>
          <div className="bg-[#111318] border border-[#2A2E38] rounded-2xl p-5">
            <div className="text-xs text-[#A8A295] uppercase font-mono tracking-wider">Total Player Pool</div>
            <div className="text-2xl font-bold font-mono text-[#FF4B35] mt-1">73 Athletes</div>
            <div className="text-[11px] text-[#5C584E] mt-1">Four-tier Bayesian classified</div>
          </div>
          <div className="bg-[#111318] border border-[#2A2E38] rounded-2xl p-5">
            <div className="text-xs text-[#A8A295] uppercase font-mono tracking-wider">Default Bid Step</div>
            <div className="text-2xl font-bold font-mono text-[#F1EBDD] mt-1">₹25,000 / ₹50,000</div>
            <div className="text-[11px] text-[#5C584E] mt-1">Dynamic rule thresholds</div>
          </div>
          <div className="bg-[#111318] border border-[#2A2E38] rounded-2xl p-5">
            <div className="text-xs text-[#A8A295] uppercase font-mono tracking-wider">Security State</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">PBKDF2-HMAC</div>
            <div className="text-[11px] text-[#5C584E] mt-1">24-hr Bearer Sessions Active</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Accounts & RBAC Matrix */}
          <div className="lg:col-span-2 bg-[#111318] border border-[#2A2E38] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#FF4B35]" />
                <h2 className="text-base font-bold font-['Space_Grotesk'] text-[#F1EBDD]">Identity & Access Registry</h2>
              </div>
              <span className="text-xs font-mono text-[#5C584E]">{users.length} Active Accounts</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#2A2E38] text-[#A8A295] uppercase font-mono">
                    <th className="py-2.5 px-3">Username</th>
                    <th className="py-2.5 px-3">Display Identity</th>
                    <th className="py-2.5 px-3">RBAC Role</th>
                    <th className="py-2.5 px-3">Team Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2E38]/50 font-mono">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-[#181A20]/60 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-[#F1EBDD]">{u.username}</td>
                      <td className="py-2.5 px-3 text-[#A8A295] font-sans">{u.display_name}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                          u.role === "super_admin" ? "bg-red-500/10 text-red-400 border-red-500/30" :
                          u.role === "auctioneer" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                          "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#5C584E]">{u.team_id ? `Team #${u.team_id}` : "Global"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Critical Emergency Operations */}
          <div className="space-y-6">
            <div className="bg-[#111318] border border-[#2A2E38] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4 text-[#FF4B35]">
                <AlertTriangle className="w-5 h-5" />
                <h2 className="text-base font-bold font-['Space_Grotesk'] text-[#F1EBDD]">Emergency Operations</h2>
              </div>
              <p className="text-xs text-[#A8A295] leading-relaxed mb-6">
                Resetting will restore all team purses to ₹100,000,000, remove all current squad allocations, reset player pool availability to &apos;available&apos;, and archive audit logs.
              </p>

              <button
                onClick={handleResetAuction}
                disabled={resetting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 font-bold text-xs uppercase tracking-wider hover:bg-red-600/30 transition-all disabled:opacity-50"
              >
                <RotateCcw className={`w-4 h-4 ${resetting ? "animate-spin" : ""}`} />
                {resetting ? "Executing Reset..." : "Reset Auction State"}
              </button>
            </div>

            <div className="bg-[#111318] border border-[#2A2E38] rounded-2xl p-6">
              <h3 className="text-sm font-bold text-[#F1EBDD] font-['Space_Grotesk'] mb-3">Quick Navigation</h3>
              <div className="space-y-2">
                <Link
                  href="/rankings"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#181A20] hover:bg-[#22252D] text-xs font-semibold text-[#F1EBDD] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#FF4B35]" />
                    Four-Tier Player Rankings
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#5C584E]" />
                </Link>
                <Link
                  href="/auction-portal/auctioneer"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#181A20] hover:bg-[#22252D] text-xs font-semibold text-[#F1EBDD] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Gavel className="w-4 h-4 text-[#FF4B35]" />
                    Auctioneer Terminal
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#5C584E]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
