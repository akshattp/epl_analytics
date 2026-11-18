"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Trophy, Flame, Shield, TrendingUp,
  ExternalLink, DollarSign, Sparkles, CheckCircle2, AlertCircle,
  FileText, Share2, Copy, Check, Globe, Lock
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { RatingBadge } from "@/components/RatingBadge";
import { StatCard } from "@/components/StatCard";
import {
  PlayerSeasonProgressionChart,
  PlayerRatingRadarChart,
  PlayerScatterChart,
  SimpleComparisonBarChart,
  EPL_PALETTE,
} from "@/components/EplCharts";

export default function PlayerProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const [profile, setProfile] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"career" | "seasons" | "matches" | "auction">("career");
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isPublicMode, setIsPublicMode] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [sharePublicToggle, setSharePublicToggle] = useState(true);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const [isLocalHost, setIsLocalHost] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      setIsPrintMode(sp.get("print") === "1");
      setIsPublicMode(sp.get("public") === "1");
      setOrigin(window.location.origin);
      const h = window.location.hostname;
      setIsLocalHost(h === "localhost" || h === "127.0.0.1" || h.startsWith("192.168.") || h.startsWith("10."));
    }
  }, []);

  useEffect(() => {
    async function loadProfile() {
      try {
        const [res, chartRes] = await Promise.all([
          fetchApi(`/api/players/${id}`),
          fetchApi(`/api/advanced/charts/player/${id}`).catch(() => null),
        ]);
        setProfile(res);
        setCharts(chartRes);
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      loadProfile();
    }
  }, [id]);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const res = await fetch(`/api/exports/player/${id}/pdf`);
      if (!res.ok) throw new Error(`PDF generation failed (${res.status})`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `EPL_Player_Report_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download error:", err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const shareUrl = `${origin}/players/${id}${sharePublicToggle ? "?public=1" : ""}`;
  const handleCopyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#07203F] border-t-transparent rounded-full mb-4"></div>
        <p className="font-serif text-lg text-[#07203F]">Loading Player Analytics Profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="font-serif text-2xl text-[#02000D]">Player Not Found</p>
        <Link href="/players" className="text-xs font-semibold text-[#A65E46] hover:underline">
          ← Return to Player Directory
        </Link>
      </div>
    );
  }

  const b = profile.career_batting;
  const bw = profile.career_bowling;
  const r = profile.ratings;
  const v = profile.valuation;

  return (
    <div className="space-y-8" data-profile-ready="true">
      {/* Public Read-Only Notice */}
      {isPublicMode && !isPrintMode && (
        <div className="bg-[#07203F] text-[#EBDED4] px-4 py-2 rounded-lg text-xs flex items-center justify-between border border-[#D9AA90]/30 no-print">
          <span className="inline-flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-[#D9AA90]" />
            <span><strong>Public Read-Only Player Profile</strong> — Verified EPL Historical Dossier. Private franchise shortlists and auction credentials are excluded.</span>
          </span>
          <Link href="/players" className="text-[#D9AA90] underline hover:text-white">Directory</Link>
        </div>
      )}

      {/* Navigation Breadcrumb + Report Export & Share Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Link href="/players" className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#07203F]/70 hover:text-[#A65E46] transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Player Directory</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#A65E46] text-[#EBDED4] hover:bg-[#A65E46]/90 text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{downloadingPdf ? "Rendering Chromium PDF..." : "Download Player Report (PDF)"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#07203F] text-[#EBDED4] hover:bg-[#02000D] text-xs font-semibold shadow-sm transition"
          >
            <Share2 className="w-3.5 h-3.5 text-[#D9AA90]" />
            <span>Share Profile</span>
          </button>
        </div>
      </div>

      {/* Share Profile Modal */}
      {shareOpen && (
        <div className="fixed inset-0 z-50 bg-[#02000D]/70 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-xl border border-[#07203F]/20 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#07203F]/10 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#07203F]">Share Player Profile</h3>
                <p className="text-xs text-[#07203F]/70">Stable permanent profile URL for {profile.name} ({profile.player_id})</p>
              </div>
              <button onClick={() => setShareOpen(false)} className="text-xs font-bold text-[#07203F] hover:text-[#A65E46] px-2 py-1">✕</button>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs text-[#07203F] cursor-pointer">
                <input
                  type="checkbox"
                  checked={sharePublicToggle}
                  onChange={(e) => setSharePublicToggle(e.target.checked)}
                  className="accent-[#A65E46]"
                />
                <span>Use read-only Public Profile mode (<code className="font-mono text-[11px]">?public=1</code> — hides private owner/admin controls)</span>
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 text-xs font-mono rounded border border-[#07203F]/20 bg-[#EBDED4]/40 text-[#02000D]"
                />
                <button
                  type="button"
                  onClick={handleCopyShareUrl}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#07203F] text-[#EBDED4] hover:bg-[#A65E46] text-xs font-semibold transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy URL"}</span>
                </button>
              </div>

              {isLocalHost ? (
                <div className="bg-[#EBDED4]/70 border-l-4 border-[#A65E46] p-3 rounded text-[11px] text-[#07203F] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#A65E46]" />
                    <span>Local Environment Notice</span>
                  </div>
                  <p>
                    This instance is currently running locally (<code>{origin}</code>). Recipients outside your machine can only open this link via your local Wi-Fi network IP or an active reverse tunnel (e.g., Cloudflare Tunnel / ngrok) or once deployed to a public domain.
                  </p>
                </div>
              ) : (
                <div className="bg-[#EBDED4]/50 border-l-4 border-[#07203F] p-3 rounded text-[11px] text-[#07203F]">
                  Publicly accessible direct URL. Recipients can open this player profile directly without navigating the directory.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header Profile Card */}
      <div className="bg-[#07203F] text-[#EBDED4] rounded-lg p-6 sm:p-8 border border-[#D9AA90]/20 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-[#D9AA90] font-semibold bg-[#02000D]/50 px-2.5 py-0.5 rounded border border-[#D9AA90]/20">
                {profile.player_id}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider bg-[#A65E46] text-[#EBDED4] px-2.5 py-0.5 rounded">
                {profile.primary_role}
              </span>
              <span className="text-xs font-medium text-[#EBDED4]/70 bg-[#02000D]/30 px-2.5 py-0.5 rounded">
                {profile.batting_hand}
              </span>
              {profile.is_new_player && (
                <span className="text-xs font-bold bg-[#D9AA90] text-[#02000D] px-2.5 py-0.5 rounded">
                  NEW UNCAPPED PLAYER
                </span>
              )}
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#EBDED4]">
              {profile.name}
            </h1>

            {profile.aliases && profile.aliases.length > 1 && (
              <p className="text-xs text-[#D9AA90]/80">
                Scorecard Aliases: {profile.aliases.join(", ")}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#EBDED4]/80 pt-1">
              <span>Seasons: <strong className="text-[#EBDED4]">{profile.career_seasons?.join(", ") || "N/A"}</strong></span>
              <span>•</span>
              <span>Matches: <strong className="text-[#EBDED4]">{profile.matches_played}</strong></span>
              <span>•</span>
              <span>Innings: <strong className="text-[#EBDED4]">{b.innings}</strong></span>
              <span>•</span>
              <span>Overs Bowled: <strong className="text-[#EBDED4]">{bw.overs}</strong></span>
            </div>
          </div>

          {/* Rating & Valuation Pills */}
          <div className="flex items-center gap-4 bg-[#02000D]/60 p-4 rounded-lg border border-[#D9AA90]/20">
            <div className="text-center px-3 border-r border-[#D9AA90]/20">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#D9AA90] block mb-1">
                EPL Rating
              </span>
              <RatingBadge score={r.overall_rating} size="lg" />
            </div>
            <div className="text-center px-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#D9AA90] block mb-1">
                Auction Value
              </span>
              <div className="font-mono text-2xl font-bold text-[#A65E46]">
                {v.estimated_valuation.toFixed(1)} <span className="text-xs text-[#EBDED4]/70">pts</span>
              </div>
              <div className="text-[10px] text-[#EBDED4]/50">Base: {v.base_price.toFixed(1)} pts</div>
            </div>
          </div>
        </div>

        {/* Secondary styles tags */}
        {profile.secondary_roles && profile.secondary_roles.length > 0 && (
          <div className="mt-6 pt-4 border-t border-[#D9AA90]/15 flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#D9AA90] font-medium mr-1">Playing Style:</span>
            {profile.secondary_roles.map((tag: string, idx: number) => (
              <span key={idx} className="text-[11px] font-semibold bg-[#EBDED4]/10 text-[#EBDED4] px-2.5 py-0.5 rounded border border-[#EBDED4]/15">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#07203F]/20 flex space-x-6 text-sm no-print">
        <button
          onClick={() => setActiveTab("career")}
          className={`pb-3 font-semibold transition border-b-2 ${
            activeTab === "career"
              ? "border-[#A65E46] text-[#A65E46]"
              : "border-transparent text-[#07203F]/70 hover:text-[#07203F]"
          }`}
        >
          Career Statistics &amp; Visual Charts
        </button>
        <button
          onClick={() => setActiveTab("seasons")}
          className={`pb-3 font-semibold transition border-b-2 ${
            activeTab === "seasons"
              ? "border-[#A65E46] text-[#A65E46]"
              : "border-transparent text-[#07203F]/70 hover:text-[#07203F]"
          }`}
        >
          Season-wise Breakdown
        </button>
        <button
          onClick={() => setActiveTab("matches")}
          className={`pb-3 font-semibold transition border-b-2 ${
            activeTab === "matches"
              ? "border-[#A65E46] text-[#A65E46]"
              : "border-transparent text-[#07203F]/70 hover:text-[#07203F]"
          }`}
        >
          Match History Log
        </button>
        <button
          onClick={() => setActiveTab("auction")}
          className={`pb-3 font-semibold transition border-b-2 ${
            activeTab === "auction"
              ? "border-[#A65E46] text-[#A65E46]"
              : "border-transparent text-[#07203F]/70 hover:text-[#07203F]"
          }`}
        >
          Auction Intelligence &amp; Valuation
        </button>
      </div>

      {/* TAB CONTENT 1: CAREER STATISTICS */}
      {(activeTab === "career" || isPrintMode) && (
        <div className="space-y-8">
          {/* Key Stat Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title="Career Runs"
              value={b.total_runs}
              subtitle={`${b.innings} innings, HS: ${b.highest_score}`}
              icon={<Flame className="w-4 h-4" />}
            />
            <StatCard
              title="Strike Rate"
              value={b.strike_rate.toFixed(1)}
              subtitle={`${b.boundary_percentage.toFixed(1)}% boundary scoring`}
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <StatCard
              title="Career Wickets"
              value={bw.wickets}
              subtitle={`${bw.overs} overs bowled`}
              icon={<Shield className="w-4 h-4" />}
            />
            <StatCard
              title="Bowling Economy"
              value={bw.legal_balls > 0 ? bw.economy.toFixed(2) : "-"}
              subtitle={`${bw.dot_ball_percentage.toFixed(1)}% dot balls`}
              icon={<Trophy className="w-4 h-4" />}
            />
          </div>

          {/* Batting & Bowling Deep Analysis Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Batting Metrics Card */}
            <div className="bg-white/80 backdrop-blur rounded-lg p-5 border border-[#07203F]/15 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#07203F]/10 pb-2">
                <h3 className="font-serif text-lg font-bold text-[#07203F]">Batting Performance Metrics</h3>
                <span className="font-mono text-xs font-bold text-[#A65E46]">{r.batting_rating.toFixed(1)} / 100</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#07203F]/5">
                  <span className="text-[#07203F]/60">Batting Average</span>
                  <span className="font-mono font-bold text-[#02000D]">{b.batting_average.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#07203F]/5">
                  <span className="text-[#07203F]/60">Balls Faced</span>
                  <span className="font-mono font-bold text-[#02000D]">{b.total_balls} balls</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#07203F]/5">
                  <span className="text-[#07203F]/60">Dismissals / Not-Outs</span>
                  <span className="font-mono font-bold text-[#02000D]">{b.outs} outs / {b.not_outs} NO</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#07203F]/5">
                  <span className="text-[#07203F]/60">Fours / Sixes</span>
                  <span className="font-mono font-bold text-[#02000D]">{b.fours} 4s / {b.sixes} 6s</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#07203F]/5">
                  <span className="text-[#07203F]/60">Balls Per Boundary</span>
                  <span className="font-mono font-bold text-[#02000D]">{b.balls_per_boundary.toFixed(1)} balls</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#07203F]/60">Consistency Index</span>
                  <span className="font-mono font-bold text-[#02000D]">{b.consistency_index.toFixed(1)} / 100</span>
                </div>
              </div>
            </div>

            {/* Bowling Metrics Card */}
            <div className="bg-white/80 backdrop-blur rounded-lg p-5 border border-[#07203F]/15 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#07203F]/10 pb-2">
                <h3 className="font-serif text-lg font-bold text-[#07203F]">Bowling Performance Metrics</h3>
                <span className="font-mono text-xs font-bold text-[#A65E46]">{r.bowling_rating.toFixed(1)} / 100</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#07203F]/5">
                  <span className="text-[#07203F]/60">Runs Conceded</span>
                  <span className="font-mono font-bold text-[#02000D]">{bw.runs_conceded} runs</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#07203F]/5">
                  <span className="text-[#07203F]/60">Bowling Average</span>
                  <span className="font-mono font-bold text-[#02000D]">{bw.bowling_average ? bw.bowling_average.toFixed(2) : "N/A"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#07203F]/5">
                  <span className="text-[#07203F]/60">Bowling Strike Rate</span>
                  <span className="font-mono font-bold text-[#02000D]">{bw.bowling_strike_rate ? `${bw.bowling_strike_rate.toFixed(1)} balls/wkt` : "N/A"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#07203F]/5">
                  <span className="text-[#07203F]/60">Dot Balls (Frequency)</span>
                  <span className="font-mono font-bold text-[#02000D]">{bw.dot_balls} dots ({bw.dot_ball_percentage.toFixed(1)}%)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#07203F]/5">
                  <span className="text-[#07203F]/60">Best Bowling Figures</span>
                  <span className="font-mono font-bold text-[#02000D]">{bw.best_figures}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#07203F]/60">Extras Conceded (WD / NB)</span>
                  <span className="font-mono font-bold text-[#02000D]">{bw.wides} wides / {bw.no_balls} no-balls</span>
                </div>
              </div>
            </div>
          </div>

          {/* 100-Point Ratings Component Breakdown */}
          <div className="bg-[#07203F] text-[#EBDED4] rounded-lg p-6 border border-[#D9AA90]/20 space-y-4 shadow-sm">
            <h3 className="font-serif text-xl font-bold text-[#EBDED4]">
              Transparent Rating Breakdown (100-Point Scale)
            </h3>
            <p className="text-xs text-[#EBDED4]/70">
              Ratings use normalized Bayesian shrinkage against EPL benchmarks to avoid sample-size distortion.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-[#02000D]/40 p-4 rounded border border-[#D9AA90]/15 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase text-[#D9AA90] font-semibold">Batting Rating</span>
                  <span className="font-mono text-lg font-bold text-[#EBDED4]">{r.batting_rating.toFixed(1)}</span>
                </div>
                <div className="text-[11px] text-[#EBDED4]/70 space-y-1">
                  <div>Volume: {r.batting_breakdown.scoring_volume_score} / 35</div>
                  <div>Velocity (SR): {r.batting_breakdown.scoring_velocity_score} / 35</div>
                  <div>Reliability: {r.batting_breakdown.reliability_score} / 15</div>
                  <div>Boundaries: {r.batting_breakdown.boundary_prowess_score} / 15</div>
                </div>
              </div>

              <div className="bg-[#02000D]/40 p-4 rounded border border-[#D9AA90]/15 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase text-[#D9AA90] font-semibold">Bowling Rating</span>
                  <span className="font-mono text-lg font-bold text-[#EBDED4]">{r.bowling_rating.toFixed(1)}</span>
                </div>
                <div className="text-[11px] text-[#EBDED4]/70 space-y-1">
                  <div>Wickets: {r.bowling_breakdown.wicket_threat_score} / 40</div>
                  <div>Economy: {r.bowling_breakdown.economy_control_score} / 35</div>
                  <div>Dots: {r.bowling_breakdown.dot_ball_score} / 15</div>
                  <div>Multi-Wkts: {r.bowling_breakdown.multi_wicket_score} / 10</div>
                </div>
              </div>

              <div className="bg-[#02000D]/40 p-4 rounded border border-[#D9AA90]/15 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase text-[#D9AA90] font-semibold">All-Rounder Rating</span>
                  <span className="font-mono text-lg font-bold text-[#EBDED4]">{r.all_rounder_rating.toFixed(1)}</span>
                </div>
                <div className="text-[11px] text-[#EBDED4]/70 space-y-1">
                  <div>Consistency: {r.consistency_rating.toFixed(1)} / 100</div>
                  <div>Knockout Rating: {r.knockout_rating.toFixed(1)} / 100</div>
                  <div>Overall Index: {r.overall_rating.toFixed(1)} / 100</div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 6B: VISUAL ANALYTICS CHARTS */}
          {charts && (
            <div className="space-y-5 pt-2">
              <div className="border-b border-[#07203F]/20 pb-2">
                <h3 className="font-serif text-xl font-bold text-[#02000D]">
                  Visual Performance Analytics
                </h3>
                <p className="text-xs text-[#07203F]/70">
                  Season trajectory, multi-dimensional radar ratings, league scatter positioning, consistency log, and win/loss splits.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <PlayerSeasonProgressionChart
                  data={charts.season_progression || []}
                  playerName={profile.name}
                />
                <PlayerRatingRadarChart
                  data={charts.radar || []}
                  series={[{ dataKey: "score", name: profile.name, color: EPL_PALETTE.terracotta }]}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <PlayerScatterChart
                  title="Batting Average vs Strike Rate (League Context)"
                  definition="Positions this player (terracotta) against all EPL batters with >= 15 balls faced."
                  interpretation="Upper-right quadrant represents high-average, high-velocity batters who sustain scoring without sacrificing tempo."
                  data={charts.batting_scatter || []}
                  xKey="average"
                  yKey="strike_rate"
                  xLabel="Batting Average"
                  yLabel="Strike Rate"
                />
                <PlayerScatterChart
                  title="Bowling Economy vs Wickets (League Context)"
                  definition="Positions this player (terracotta) against all EPL bowlers with >= 12 legal balls bowled."
                  interpretation="Upper-left quadrant represents elite bowlers combining restrictive economy rates with frequent wicket-taking."
                  data={charts.bowling_scatter || []}
                  xKey="economy"
                  yKey="wickets"
                  xLabel="Economy (RPO)"
                  yLabel="Wickets"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <SimpleComparisonBarChart
                  title="Innings-by-Innings Scoring Consistency"
                  definition="Chronological regulation batting scores across every innings played."
                  interpretation="Visualizes run-scoring variance and high-impact innings clusters across seasons."
                  data={charts.innings_consistency || []}
                  xKey="label"
                  bars={[{ dataKey: "runs", name: "Runs Scored", color: EPL_PALETTE.navy }]}
                />
                <SimpleComparisonBarChart
                  title="Performance in Wins vs Losses"
                  definition="Comparison of batting output and bowling economy in team victories versus defeats."
                  interpretation="Highlights descriptive output differences between winning and losing team outcomes (correlation, not sole causation)."
                  data={charts.wins_vs_losses || []}
                  xKey="metric"
                  bars={[
                    { dataKey: "In Wins", name: "In Team Wins", color: EPL_PALETTE.navy },
                    { dataKey: "In Losses", name: "In Team Losses", color: EPL_PALETTE.peach },
                  ]}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: SEASONS */}
      {(activeTab === "seasons" || isPrintMode) && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {Object.keys(profile.season_breakdown || {}).map((sKey) => {
              const sData = profile.season_breakdown[sKey];
              const sBat = sData.batting;
              const sBowl = sData.bowling;
              return (
                <div key={sKey} className="bg-white/80 backdrop-blur rounded-lg p-5 border border-[#07203F]/15 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-[#07203F]/10 pb-2">
                    <span className="font-serif text-xl font-bold text-[#07203F]">Season {sKey}</span>
                    <span className="text-xs font-semibold bg-[#A65E46] text-[#EBDED4] px-2 py-0.5 rounded">
                      {sBat.matches || sBowl.matches} matches
                    </span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="font-semibold text-[#07203F] mb-1">Batting Performance</div>
                      <div className="grid grid-cols-2 gap-2 text-[#07203F]/80">
                        <div>Runs: <strong>{sBat.total_runs}</strong> ({sBat.innings} inn)</div>
                        <div>SR: <strong>{sBat.strike_rate.toFixed(1)}</strong></div>
                        <div>Avg: <strong>{sBat.batting_average.toFixed(1)}</strong></div>
                        <div>HS: <strong>{sBat.highest_score}</strong></div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-[#07203F]/10">
                      <div className="font-semibold text-[#07203F] mb-1">Bowling Performance</div>
                      <div className="grid grid-cols-2 gap-2 text-[#07203F]/80">
                        <div>Wickets: <strong>{sBowl.wickets}</strong> ({sBowl.overs} ov)</div>
                        <div>Economy: <strong>{sBowl.legal_balls > 0 ? sBowl.economy.toFixed(2) : "-"}</strong></div>
                        <div>Runs C: <strong>{sBowl.runs_conceded}</strong></div>
                        <div>Dots: <strong>{sBowl.dot_balls}</strong></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: MATCH HISTORY */}
      {activeTab === "matches" && (
        <div 
          tabIndex={0} 
          role="region" 
          aria-label="Player Match History Log"
          className="table-wrapper bg-white/90 backdrop-blur rounded-lg border border-[#07203F]/15 shadow-sm"
        >
          <table className="w-full text-left table-editorial table-sticky-col">
            <thead className="bg-[#07203F] text-[#EBDED4]">
              <tr>
                <th scope="col" className="p-3">Season / Stage</th>
                <th scope="col" className="p-3">Opponent</th>
                <th scope="col" className="p-3">Batting</th>
                <th scope="col" className="p-3">SR</th>
                <th scope="col" className="p-3">Dismissal</th>
                <th scope="col" className="p-3">Bowling</th>
                <th scope="col" className="p-3">Figures</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#07203F]/10 text-xs">
              {profile.match_history?.map((m: any, idx: number) => (
                <tr key={idx} className="hover:bg-[#EBDED4]/40 transition">
                  <td className="p-3 font-medium">
                    <span className="font-bold text-[#07203F]">EPL {m.season}</span>
                    <span className="text-[10px] text-[#07203F]/60 block">{m.stage}</span>
                  </td>
                  <td className="p-3 font-semibold text-[#02000D]">{m.opponent}</td>
                  <td className="p-3 font-mono font-bold text-[#02000D]">
                    {m.runs !== undefined ? `${m.runs} (${m.balls}b)` : "-"}
                  </td>
                  <td className="p-3 font-mono text-[#07203F]">
                    {m.strike_rate ? m.strike_rate.toFixed(1) : "-"}
                  </td>
                  <td className="p-3 text-[#07203F]/80">
                    {m.dismissal || "-"}
                  </td>
                  <td className="p-3 font-mono text-[#07203F]">
                    {m.overs !== undefined ? `${m.overs} ov` : "-"}
                  </td>
                  <td className="p-3 font-mono font-bold text-[#A65E46]">
                    {m.wickets !== undefined ? `${m.wickets}/${m.runs_conceded}` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT 4: AUCTION INTELLIGENCE */}
      {(activeTab === "auction" || isPrintMode) && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Valuation Card */}
            <div className="bg-[#07203F] text-[#EBDED4] rounded-lg p-6 border border-[#D9AA90]/20 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#D9AA90]/20 pb-3">
                <span className="text-xs uppercase font-bold text-[#D9AA90] tracking-wider">
                  Auction Intelligence Report
                </span>
                <span className="text-xs font-semibold bg-[#A65E46] text-[#EBDED4] px-2.5 py-0.5 rounded">
                  {v.category}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-xs text-[#EBDED4]/60 block">Projected Bidding Valuation</span>
                  <div className="font-mono text-3xl font-bold text-[#A65E46] mt-1">
                    {v.estimated_valuation.toFixed(1)} <span className="text-sm text-[#EBDED4]">Auction Points</span>
                  </div>
                  <div className="text-xs text-[#D9AA90] mt-0.5">
                    Target Bidding Range: {v.valuation_range} pts (Base Price: {v.base_price.toFixed(1)} pts)
                  </div>
                </div>

                <div className="text-xs text-[#EBDED4]/80 space-y-1.5 pt-2 border-t border-[#D9AA90]/15">
                  <div className="flex justify-between">
                    <span>Scarcity Multiplier</span>
                    <strong className="text-[#EBDED4] font-mono">{v.scarcity_multiplier}x</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Knockout Playoff Premium</span>
                    <strong className="text-[#EBDED4] font-mono">+{v.knockout_premium} pts</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Valuation Confidence</span>
                    <strong className="text-[#D9AA90]">{v.valuation_confidence}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="bg-white/80 backdrop-blur rounded-lg p-6 border border-[#07203F]/15 space-y-4 shadow-sm">
              <h3 className="font-serif text-xl font-bold text-[#07203F]">
                Scouting Strengths & Considerations
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-emerald-800 flex items-center space-x-1 mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Core Strengths</span>
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-[#07203F]/80 pl-1">
                    {v.strengths.map((str: string, i: number) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-[#07203F]/10">
                  <span className="font-semibold text-[#A65E46] flex items-center space-x-1 mb-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-[#A65E46]" />
                    <span>Tactical Considerations</span>
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-[#07203F]/80 pl-1">
                    {v.weaknesses.map((w: string, i: number) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Similar Players / Auction Alternatives */}
          {profile.similar_players && profile.similar_players.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="border-b border-[#07203F]/20 pb-2">
                <h3 className="font-serif text-xl font-bold text-[#02000D]">
                  Auction Bidding Substitutes (Similar Profiles)
                </h3>
                <p className="text-xs text-[#07203F]/70">
                  If bidding for {profile.name} becomes too expensive, these statistical alternatives offer similar functional profiles.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {profile.similar_players.map((sp: any) => (
                  <div key={sp.player_id} className="bg-white/80 backdrop-blur rounded p-4 border border-[#07203F]/15 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-[#07203F]">{sp.player_name}</span>
                      <RatingBadge score={sp.overall_rating} size="sm" />
                    </div>
                    <div className="text-xs text-[#A65E46] font-semibold">
                      {sp.similarity_score}% Statistical Match
                    </div>
                    <p className="text-[11px] text-[#07203F]/70 leading-relaxed">
                      {sp.key_differences.join("; ")}
                    </p>
                    <Link
                      href={`/players/${sp.player_id}`}
                      className="block text-center text-xs font-semibold text-[#07203F] bg-[#EBDED4] hover:bg-[#D9AA90]/40 py-1 rounded transition"
                    >
                      Compare Profile →
                    </Link>
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
