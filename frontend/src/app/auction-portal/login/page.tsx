"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle, Shield } from "lucide-react";
import { EplBrandLogo } from "@/components/EplBrandLogo";

interface LoginResponse {
  status: string;
  token: string;
  user: {
    id: number;
    username: string;
    role: string;
    team_id: number | null;
    display_name: string;
  };
  team: {
    team_id: number;
    team_name: string;
    purse_remaining: number;
  } | null;
}

export default function AuctionPortalLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If already authenticated, redirect
  useEffect(() => {
    const token = localStorage.getItem("epl_auction_token");
    const role = localStorage.getItem("epl_auction_role");
    const teamId = localStorage.getItem("epl_auction_team_id");
    if (token && role) {
      redirectByRole(role, teamId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function redirectByRole(role: string, teamId: string | null) {
    if (role === "super_admin") router.replace("/auction-portal/admin");
    else if (role === "auctioneer") router.replace("/auction-portal/auctioneer");
    else if (role === "team_owner" && teamId) router.replace(`/auction-portal/owner/${teamId}`);
    else router.replace("/auction-portal/live");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Login failed");
      }
      const data: LoginResponse = await res.json();
      localStorage.setItem("epl_auction_token", data.token);
      localStorage.setItem("epl_auction_role", data.user.role);
      localStorage.setItem("epl_auction_user", JSON.stringify(data.user));
      localStorage.setItem("epl_auction_team_id", data.user.team_id?.toString() || "");
      if (data.team) localStorage.setItem("epl_auction_team", JSON.stringify(data.team));
      redirectByRole(data.user.role, data.user.team_id?.toString() || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a0a04_0%,_#0A0C10_60%)] opacity-80" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 39px, #FF4B35 39px, #FF4B35 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, #FF4B35 39px, #FF4B35 40px)",
        }}
      />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF4B35]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-4">
            <EplBrandLogo variant="full" size="lg" />
          </div>
          <div className="text-[11px] font-mono text-[#FF4B35] uppercase tracking-[0.3em] mt-3">
            Auction Intelligence Portal
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#111318]/80 backdrop-blur-xl border border-[#2A2E38] rounded-2xl p-8 shadow-2xl shadow-black/50">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-[#FF4B35]" />
            <h1 className="text-lg font-bold text-[#F1EBDD] font-['Space_Grotesk']">
              Secure Access
            </h1>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 mb-5 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#A8A295] mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. vipers, auctioneer, admin"
                required
                className="w-full bg-[#0D1017] border border-[#2A2E38] rounded-xl px-4 py-3 text-sm text-[#F1EBDD] placeholder:text-[#4A5068] focus:outline-none focus:border-[#FF4B35] focus:ring-1 focus:ring-[#FF4B35]/30 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#A8A295] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  className="w-full bg-[#0D1017] border border-[#2A2E38] rounded-xl px-4 py-3 text-sm text-[#F1EBDD] placeholder:text-[#4A5068] focus:outline-none focus:border-[#FF4B35] focus:ring-1 focus:ring-[#FF4B35]/30 transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A5068] hover:text-[#A8A295] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full py-3 px-6 rounded-xl bg-[#FF4B35] text-white font-bold text-sm uppercase tracking-widest transition-all hover:bg-[#E03D28] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#FF4B35]/20 mt-2"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating…</span>
                </div>
              ) : (
                "Enter Portal"
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#2A2E38]">
            <p className="text-[11px] text-[#4A5068] text-center">
              Access is restricted to authorised EPL franchise representatives and officials.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-[#2A2E38] mt-6 font-mono">
          EPL Analytics · Auction Portal v2.1-dev
        </p>
      </div>
    </div>
  );
}
