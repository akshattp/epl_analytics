"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Trophy, Flame, Shield, TrendingUp,
  ExternalLink, DollarSign, Sparkles, CheckCircle2, AlertCircle,
  FileText, Share2, Copy, Check, Globe, Lock, Info, ChevronDown,
  ChevronUp, Target, Award, Zap, Crosshair, BarChart2
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
  const [activeTab, setActiveTab] = useState<"career" | "situational" | "seasons" | "matches" | "auction">("career");
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isPublicMode, setIsPublicMode] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [sharePublicToggle, setSharePublicToggle] = useState(true);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const [isLocalHost, setIsLocalHost] = useState(false);
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

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

  const b = profile.career_batting || {};
  const bw = profile.career_bowling || {};
  const r = profile.ratings || {};
  const v = profile.valuation || {};
  const pi = profile.player_intelligence || {};
  const ar = profile.all_rounder_metrics || {};
  const ss = profile.situational_splits || {};

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
                    This instance is currently running locally (<code>{origin}</code>). External recipients can open this URL via the active ngrok tunnel.
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
                {ar.role_classification || profile.primary_role}
              </span>
              <span className="text-xs font-medium text-[#EBDED4]/70 bg-[#02000D]/30 px-2.5 py-0.5 rounded">
                {profile.batting_hand}
              </span>
              {pi.confidence_level && (
                <span
                  title={pi.confidence_badge}
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                    pi.confidence_level === "HIGH"
                      ? "bg-emerald-900/60 border-emerald-500/50 text-emerald-300"
                      : pi.confidence_level === "MEDIUM"
                      ? "bg-amber-900/60 border-amber-500/50 text-amber-300"
                      : "bg-stone-800/60 border-stone-600/50 text-stone-300"
                  }`}
                >
                  {pi.confidence_level} Confidence
                </span>
              )}
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
              <span>Overs Bowled: <strong className="text-[#EBDED4]">{bw.overs_display || bw.overs}</strong></span>
            </div>
          </div>

          {/* Rating & Valuation Pills */}
          <div className="flex items-center gap-4 bg-[#02000D]/60 p-4 rounded-lg border border-[#D9AA90]/20">
            <div className="text-center px-3 border-r border-[#D9AA90]/20">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#D9AA90] block mb-1">
                Player Intelligence (PIS)
              </span>
              <div className="font-serif text-2xl font-bold text-[#EBDED4]">
                {pi.overall_player_intelligence_score?.toFixed(1) || r.overall_rating?.toFixed(1)}
              </div>
              <div className="text-[10px] text-[#D9AA90]">v1.3 100-pt PIS</div>
            </div>
            <div className="text-center px-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#D9AA90] block mb-1">
                Auction Value
              </span>
              <div className="font-mono text-2xl font-bold text-[#A65E46]">
                {v.estimated_valuation?.toFixed(1)} <span className="text-xs text-[#EBDED4]/70">pts</span>
              </div>
              <div className="text-[10px] text-[#EBDED4]/50">Base: {v.base_price?.toFixed(1)} pts</div>
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

      {/* EPL v1.3 Player Intelligence Scorecard (PIS) */}
      <div className="bg-[#07203F] text-[#EBDED4] rounded-lg p-6 border border-[#D9AA90]/25 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9AA90]/20 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D9AA90]" />
              <h2 className="font-serif text-lg font-bold text-[#EBDED4]">
                EPL Player Intelligence Score (PIS)
              </h2>
              <span className="text-[10px] font-mono bg-[#A65E46] text-[#EBDED4] px-2 py-0.5 rounded">
                v1.3 Engine
              </span>
            </div>
            <p className="text-xs text-[#EBDED4]/70 mt-0.5">
              Role: <strong className="text-[#D9AA90]">{ar.role_classification || "Specialist"}</strong> • Missing disciplines are never penalized as zero.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowFormulaDetails(!showFormulaDetails)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-[#02000D]/50 border border-[#D9AA90]/30 text-[#D9AA90] hover:text-white transition"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{showFormulaDetails ? "Hide Methodology" : "Why this score?"}</span>
            {showFormulaDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* 5-Pillar Score Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-[#02000D]/50 p-3 rounded border border-[#D9AA90]/15 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D9AA90] block">Batting (BIS)</span>
            <div className="font-mono text-xl font-bold text-[#EBDED4]">
              {pi.batting_intelligence_score !== null && pi.batting_intelligence_score !== undefined
                ? pi.batting_intelligence_score.toFixed(1)
                : <span className="text-xs text-[#EBDED4]/40 font-normal">N/A (Did not bat)</span>}
            </div>
            <div className="text-[10px] text-[#EBDED4]/60">Volume &amp; Velocity</div>
          </div>

          <div className="bg-[#02000D]/50 p-3 rounded border border-[#D9AA90]/15 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D9AA90] block">Bowling (BoIS)</span>
            <div className="font-mono text-xl font-bold text-[#EBDED4]">
              {pi.bowling_intelligence_score !== null && pi.bowling_intelligence_score !== undefined
                ? pi.bowling_intelligence_score.toFixed(1)
                : <span className="text-xs text-[#EBDED4]/40 font-normal">N/A (Did not bowl)</span>}
            </div>
            <div className="text-[10px] text-[#EBDED4]/60">Wickets &amp; Economy</div>
          </div>

          <div className="bg-[#02000D]/50 p-3 rounded border border-[#D9AA90]/15 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D9AA90] block">All-Rounder (AIS)</span>
            <div className="font-mono text-xl font-bold text-[#EBDED4]">
              {pi.all_rounder_intelligence_score?.toFixed(1) || "0.0"}
            </div>
            <div className="text-[10px] text-[#EBDED4]/60">{ar.impact_all_rounder_matches || 0} dual games</div>
          </div>

          <div className="bg-[#02000D]/50 p-3 rounded border border-[#D9AA90]/15 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D9AA90] block">Consistency (CIS)</span>
            <div className="font-mono text-xl font-bold text-[#EBDED4]">
              {pi.consistency_intelligence_score?.toFixed(1) || "50.0"}
            </div>
            <div className="text-[10px] text-[#EBDED4]/60">Score Variance</div>
          </div>

          <div className="bg-[#02000D]/50 p-3 rounded border border-[#D9AA90]/15 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#D9AA90] block">Match Impact (MIS)</span>
            <div className="font-mono text-xl font-bold text-[#A65E46]">
              {pi.match_impact_intelligence_score?.toFixed(1) || "20.0"}
            </div>
            <div className="text-[10px] text-[#EBDED4]/60">Milestones &amp; Playoff</div>
          </div>
        </div>

        {/* Collapsible Explanations & Formula Drawer */}
        {showFormulaDetails && pi.explanations && (
          <div className="bg-[#02000D]/80 p-4 rounded-lg border border-[#D9AA90]/30 space-y-2.5 text-xs">
            <h4 className="font-serif font-bold text-[#D9AA90] uppercase tracking-wider text-[11px]">
              Mathematical Breakdown &amp; Sub-Factor Derivations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-[#EBDED4]/85">
              <div className="space-y-1">
                <strong>Batting Formula:</strong>
                <p className="font-mono text-[10px] text-[#D9AA90]">{pi.explanations.batting}</p>
              </div>
              <div className="space-y-1">
                <strong>Bowling Formula:</strong>
                <p className="font-mono text-[10px] text-[#D9AA90]">{pi.explanations.bowling}</p>
              </div>
              <div className="space-y-1">
                <strong>All-Rounder Balance:</strong>
                <p className="font-mono text-[10px] text-[#D9AA90]">{pi.explanations.all_rounder}</p>
              </div>
              <div className="space-y-1">
                <strong>Consistency &amp; Match Impact:</strong>
                <p className="font-mono text-[10px] text-[#D9AA90]">
                  {pi.explanations.consistency} • {pi.explanations.match_impact}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#07203F]/20 flex flex-wrap gap-6 text-sm no-print">
        {[
          { id: "career", label: "Career & Visual Charts" },
          { id: "situational", label: "Situational Splits (1st vs Chasing)" },
          { id: "seasons", label: "Season-wise Breakdown" },
          { id: "matches", label: "Match History Log" },
          { id: "auction", label: "Auction Intelligence" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 font-semibold transition border-b-2 ${
              activeTab === tab.id
                ? "border-[#A65E46] text-[#A65E46]"
                : "border-transparent text-[#07203F]/70 hover:text-[#07203F]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT 1: CAREER STATISTICS & CHARTS */}
      {(activeTab === "career" || isPrintMode) && (
        <div className="space-y-8">
          {/* Key Stat Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title="Career Runs"
              value={b.total_runs}
              subtitle={`${b.innings} innings, HS: ${b.highest_score_display || b.highest_score}`}
              icon={<Flame className="w-4 h-4" />}
            />
            <StatCard
              title="Strike Rate"
              value={b.strike_rate ? b.strike_rate.toFixed(1) : "0.0"}
              subtitle={`${b.boundary_percentage ? b.boundary_percentage.toFixed(1) : "0.0"}% boundary scoring`}
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <StatCard
              title="Career Wickets"
              value={bw.wickets || 0}
              subtitle={`${bw.overs_display || bw.overs} overs bowled`}
              icon={<Shield className="w-4 h-4" />}
            />
            <StatCard
              title="Bowling Economy"
              value={bw.legal_balls > 0 ? bw.economy.toFixed(2) : "-"}
              subtitle={`${bw.dot_ball_percentage ? bw.dot_ball_percentage.toFixed(1) : "0.0"}% dot balls`}
              icon={<Trophy className="w-4 h-4" />}
            />
          </div>

          {/* 6-Over Cricket Milestone Rack */}
          <div className="bg-white/80 backdrop-blur rounded-lg p-5 border border-[#07203F]/15 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#07203F]/10 pb-2">
              <span className="font-serif text-base font-bold text-[#07203F] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#A65E46]" />
                <span>6-Over Cricket Milestones &amp; Impact Frequencies</span>
              </span>
              <span className="text-[10px] font-mono text-[#07203F]/60">Regulation Tournament Data</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
              <div className="p-2 rounded bg-[#EBDED4]/40 border border-[#07203F]/10">
                <span className="text-[10px] text-[#07203F]/70 uppercase block font-semibold">10+ Scores</span>
                <span className="font-mono text-base font-bold text-[#07203F]">{b.scores_10_plus || 0}</span>
                <span className="text-[9px] text-[#07203F]/60 block">{b.pct_10_plus || 0}% inn</span>
              </div>
              <div className="p-2 rounded bg-[#EBDED4]/40 border border-[#07203F]/10">
                <span className="text-[10px] text-[#07203F]/70 uppercase block font-semibold">15+ Scores</span>
                <span className="font-mono text-base font-bold text-[#07203F]">{b.scores_15_plus || 0}</span>
                <span className="text-[9px] text-[#07203F]/60 block">{b.pct_15_plus || 0}% inn</span>
              </div>
              <div className="p-2 rounded bg-[#EBDED4]/40 border border-[#07203F]/10">
                <span className="text-[10px] text-[#07203F]/70 uppercase block font-semibold">20+ Scores</span>
                <span className="font-mono text-base font-bold text-[#A65E46]">{b.scores_20_plus || 0}</span>
                <span className="text-[9px] text-[#07203F]/60 block">{b.pct_20_plus || 0}% inn</span>
              </div>
              <div className="p-2 rounded bg-[#EBDED4]/40 border border-[#07203F]/10">
                <span className="text-[10px] text-[#07203F]/70 uppercase block font-semibold">Multi-Wkts (2+)</span>
                <span className="font-mono text-base font-bold text-[#07203F]">{bw.two_plus_wickets || 0}</span>
                <span className="text-[9px] text-[#07203F]/60 block">{bw.multi_wicket_frequency || 0}% sp</span>
              </div>
              <div className="p-2 rounded bg-[#EBDED4]/40 border border-[#07203F]/10">
                <span className="text-[10px] text-[#07203F]/70 uppercase block font-semibold">Ducks / Not-Outs</span>
                <span className="font-mono text-base font-bold text-[#07203F]">{b.duck_count || 0} / {b.not_outs || 0}</span>
                <span className="text-[9px] text-[#07203F]/60 block">{b.not_out_percentage || 0}% NO</span>
              </div>
              <div className="p-2 rounded bg-[#EBDED4]/40 border border-[#07203F]/10">
                <span className="text-[10px] text-[#07203F]/70 uppercase block font-semibold">Explosiveness</span>
                <span className="font-mono text-base font-bold text-[#A65E46]">{b.explosiveness_index || 0}</span>
                <span className="text-[9px] text-[#07203F]/60 block">Index / 100</span>
              </div>
            </div>
          </div>

          {/* Batting & Bowling Deep Analysis Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Batting Metrics Card */}
            <div className="bg-white/80 backdrop-blur rounded-lg p-5 border border-[#07203F]/15 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#07203F]/10 pb-2">
                <h3 className="font-serif text-lg font-bold text-[#07203F]">Batting Performance Metrics</h3>
                <span className="font-mono text-xs font-bold text-[#A65E46]">
                  {pi.batting_intelligence_score ? `${pi.batting_intelligence_score.toFixed(1)} / 100` : "N/A"}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#07203F]/5">
                  <span className="text-[#07203F]/60">Batting Average</span>
                  <span className="font-mono font-bold text-[#02000D]">{b.average_display || b.batting_average?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#07203F]/5">
                  <span className="text-[#07203F]/60">Runs Per Innings</span>
                  <span className="font-mono font-bold text-[#02000D]">{b.runs_per_innings?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#07203F]/5">
                  <span className="text-[#07203F]/60">Balls Faced</span>
                  <span className="font-mono font-bold text-[#02000D]">{b.total_balls} balls</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#07203F]/5">
                  <span className="text-[#07203F]/60">Dismissals / Not-Outs</span>
                  <span className="font-mono font-bold text-[#02000D]">{b.outs} outs / {b.not_outs} NO ({b.not_out_percentage?.toFixed(1)}%)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#07203F]/5">
                  <span className="text-[#07203F]/60">Fours / Sixes</span>
                  <span className="font-mono font-bold text-[#02000D]">{b.fours} 4s / {b.sixes} 6s</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#07203F]/5">
                  <span className="text-[#07203F]/60">Boundary Runs Share</span>
                  <span className="font-mono font-bold text-[#02000D]">{b.boundary_runs_percentage?.toFixed(1)}% of runs</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#07203F]/5">
                  <span className="text-[#07203F]/60">Balls Per Boundary</span>
                  <span className="font-mono font-bold text-[#02000D]">{b.balls_per_boundary?.toFixed(1)} balls</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#07203F]/60">Consistency Index</span>
                  <span className="font-mono font-bold text-[#02000D]">{b.consistency_index?.toFixed(1)} / 100</span>
                </div>
              </div>
            </div>

            {/* Bowling Metrics Card */}
            <div className="bg-white/80 backdrop-blur rounded-lg p-5 border border-[#07203F]/15 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#07203F]/10 pb-2">
                <h3 className="font-serif text-lg font-bold text-[#07203F]">Bowling Performance Metrics</h3>
                <span className="font-mono text-xs font-bold text-[#A65E46]">
                  {pi.bowling_intelligence_score ? `${pi.bowling_intelligence_score.toFixed(1)} / 100` : "N/A"}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#07203F]/5">
                  <span className="text-[#07203F]/60">Runs Conceded / Legal Balls</span>
                  <span className="font-mono font-bold text-[#02000D]">{bw.runs_conceded} runs / {bw.legal_balls} balls</span>
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
                  <span className="text-[#07203F]/60">Wickets Per Match</span>
                  <span className="font-mono font-bold text-[#02000D]">{bw.wickets_per_match?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#07203F]/5">
                  <span className="text-[#07203F]/60">Dot Balls (Frequency)</span>
                  <span className="font-mono font-bold text-[#02000D]">{bw.dot_balls} dots ({bw.dot_ball_percentage?.toFixed(1)}%)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#07203F]/5">
                  <span className="text-[#07203F]/60">Boundary Concession %</span>
                  <span className="font-mono font-bold text-[#02000D]">{bw.boundary_concession_percentage?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#07203F]/5">
                  <span className="text-[#07203F]/60">Best Figures</span>
                  <span className="font-mono font-bold text-[#02000D]">{bw.best_figures}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#07203F]/60">Spell Consistency Index</span>
                  <span className="font-mono font-bold text-[#02000D]">{bw.bowling_consistency_index?.toFixed(1)} / 100</span>
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

      {/* TAB CONTENT 2: SITUATIONAL SPLITS (1st vs Chasing) */}
      {activeTab === "situational" && ss && (
        <div className="space-y-6">
          <div className="bg-[#07203F] text-[#EBDED4] p-5 rounded-lg border border-[#D9AA90]/20 space-y-2">
            <h3 className="font-serif text-lg font-bold text-[#EBDED4]">
              Situational Pressure Splits
            </h3>
            <p className="text-xs text-[#EBDED4]/70">
              Evaluates execution under differing match scripts: setting targets (Innings 1) versus chasing totals (Innings 2), 
              and bowling first versus defending totals under scoreboard pressure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Batting 1st vs Chasing */}
            <div className="bg-white/80 backdrop-blur rounded-lg p-5 border border-[#07203F]/15 shadow-sm space-y-4">
              <h4 className="font-serif text-base font-bold text-[#07203F] border-b border-[#07203F]/10 pb-2">
                Batting: Setting Target vs Run Chase
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-[#EBDED4]/30 p-3 rounded border border-[#07203F]/10 space-y-2">
                  <span className="font-bold text-[#07203F] block">Batting 1st (Setting)</span>
                  <div className="space-y-1">
                    <div>Runs: <strong>{ss.batting_first?.total_runs || 0}</strong> ({ss.batting_first?.innings || 0} inn)</div>
                    <div>SR: <strong>{ss.batting_first?.strike_rate?.toFixed(1) || "0.0"}</strong></div>
                    <div>Avg: <strong>{ss.batting_first?.average_display || "0.00"}</strong></div>
                    <div>Boundaries: <strong>{ss.batting_first?.fours || 0}x4, {ss.batting_first?.sixes || 0}x6</strong></div>
                    <div>HS: <strong>{ss.batting_first?.highest_score_display || "0"}</strong></div>
                  </div>
                </div>

                <div className="bg-[#EBDED4]/30 p-3 rounded border border-[#07203F]/10 space-y-2">
                  <span className="font-bold text-[#A65E46] block">Chasing (Innings 2)</span>
                  <div className="space-y-1">
                    <div>Runs: <strong>{ss.chasing?.total_runs || 0}</strong> ({ss.chasing?.innings || 0} inn)</div>
                    <div>SR: <strong>{ss.chasing?.strike_rate?.toFixed(1) || "0.0"}</strong></div>
                    <div>Avg: <strong>{ss.chasing?.average_display || "0.00"}</strong></div>
                    <div>Boundaries: <strong>{ss.chasing?.fours || 0}x4, {ss.chasing?.sixes || 0}x6</strong></div>
                    <div>HS: <strong>{ss.chasing?.highest_score_display || "0"}</strong></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bowling 1st vs Defending */}
            <div className="bg-white/80 backdrop-blur rounded-lg p-5 border border-[#07203F]/15 shadow-sm space-y-4">
              <h4 className="font-serif text-base font-bold text-[#07203F] border-b border-[#07203F]/10 pb-2">
                Bowling: First Inning vs Defending Total
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-[#EBDED4]/30 p-3 rounded border border-[#07203F]/10 space-y-2">
                  <span className="font-bold text-[#07203F] block">Bowling 1st</span>
                  <div className="space-y-1">
                    <div>Overs: <strong>{ss.bowling_first?.overs_display || "0.0"}</strong></div>
                    <div>Wickets: <strong>{ss.bowling_first?.wickets || 0}</strong></div>
                    <div>Economy: <strong>{ss.bowling_first?.economy?.toFixed(2) || "0.00"}</strong></div>
                    <div>Runs Conceded: <strong>{ss.bowling_first?.runs_conceded || 0}</strong></div>
                    <div>Dots: <strong>{ss.bowling_first?.dot_balls || 0} ({ss.bowling_first?.dot_ball_percentage?.toFixed(1) || 0}%)</strong></div>
                  </div>
                </div>

                <div className="bg-[#EBDED4]/30 p-3 rounded border border-[#07203F]/10 space-y-2">
                  <span className="font-bold text-[#A65E46] block">Defending Total</span>
                  <div className="space-y-1">
                    <div>Overs: <strong>{ss.defending?.overs_display || "0.0"}</strong></div>
                    <div>Wickets: <strong>{ss.defending?.wickets || 0}</strong></div>
                    <div>Economy: <strong>{ss.defending?.economy?.toFixed(2) || "0.00"}</strong></div>
                    <div>Runs Conceded: <strong>{ss.defending?.runs_conceded || 0}</strong></div>
                    <div>Dots: <strong>{ss.defending?.dot_balls || 0} ({ss.defending?.dot_ball_percentage?.toFixed(1) || 0}%)</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: SEASONS */}
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
                        <div>SR: <strong>{sBat.strike_rate?.toFixed(1)}</strong></div>
                        <div>Avg: <strong>{sBat.average_display || sBat.batting_average?.toFixed(1)}</strong></div>
                        <div>HS: <strong>{sBat.highest_score_display || sBat.highest_score}</strong></div>
                        <div>10+ Scores: <strong>{sBat.scores_10_plus || 0}</strong></div>
                        <div>Boundaries: <strong>{sBat.boundary_percentage?.toFixed(1)}%</strong></div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-[#07203F]/10">
                      <div className="font-semibold text-[#07203F] mb-1">Bowling Performance</div>
                      <div className="grid grid-cols-2 gap-2 text-[#07203F]/80">
                        <div>Wickets: <strong>{sBowl.wickets}</strong> ({sBowl.overs_display || sBowl.overs} ov)</div>
                        <div>Economy: <strong>{sBowl.legal_balls > 0 ? sBowl.economy?.toFixed(2) : "-"}</strong></div>
                        <div>Runs C: <strong>{sBowl.runs_conceded}</strong></div>
                        <div>Dots: <strong>{sBowl.dot_balls}</strong></div>
                        <div>Best: <strong>{sBowl.best_figures}</strong></div>
                        <div>Multi-Wkts: <strong>{sBowl.two_plus_wickets || 0}</strong></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: MATCH HISTORY */}
      {activeTab === "matches" && (
        <div 
          tabIndex={0} 
          role="region" 
          aria-label="Player Match History Log"
          className="table-wrapper bg-white/90 backdrop-blur rounded-lg border border-[#07203F]/15 shadow-sm overflow-x-auto"
        >
          <table className="w-full text-left text-xs">
            <thead className="bg-[#07203F] text-[#EBDED4]">
              <tr>
                <th scope="col" className="p-3">Season / Stage</th>
                <th scope="col" className="p-3">Opponent</th>
                <th scope="col" className="p-3">Role In Match</th>
                <th scope="col" className="p-3">Batting</th>
                <th scope="col" className="p-3">SR</th>
                <th scope="col" className="p-3">Dismissal</th>
                <th scope="col" className="p-3">Bowling</th>
                <th scope="col" className="p-3">Figures</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#07203F]/10">
              {profile.match_history?.map((m: any, idx: number) => {
                const hasBat = m.batting !== null && m.batting !== undefined;
                const hasBowl = m.bowling !== null && m.bowling !== undefined;
                return (
                  <tr key={idx} className="hover:bg-[#EBDED4]/40 transition">
                    <td className="p-3 font-medium">
                      <span className="font-bold text-[#07203F]">EPL {m.season}</span>
                      <span className="text-[10px] text-[#07203F]/60 block">{m.stage}</span>
                    </td>
                    <td className="p-3 font-semibold text-[#02000D]">{m.opponent}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#EBDED4] text-[#07203F] font-semibold">
                        {hasBat && hasBowl ? "Bat & Bowl" : hasBat ? "Batting" : hasBowl ? "Bowling" : "-"}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-[#02000D]">
                      {hasBat ? `${m.batting.runs}${m.batting.is_not_out ? "*" : ""} (${m.batting.balls}b)` : "-"}
                    </td>
                    <td className="p-3 font-mono text-[#07203F]">
                      {hasBat && m.batting.strike_rate ? m.batting.strike_rate.toFixed(1) : "-"}
                    </td>
                    <td className="p-3 text-[#07203F]/80">
                      {hasBat ? (m.batting.dismissal || "not out") : "-"}
                    </td>
                    <td className="p-3 font-mono text-[#07203F]">
                      {hasBowl ? `${m.bowling.overs} ov` : "-"}
                    </td>
                    <td className="p-3 font-mono font-bold text-[#A65E46]">
                      {hasBowl ? `${m.bowling.wickets}/${m.bowling.runs_conceded}` : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT 5: AUCTION INTELLIGENCE */}
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
                    {v.estimated_valuation?.toFixed(1)} <span className="text-sm text-[#EBDED4]">Auction Points</span>
                  </div>
                  <div className="text-xs text-[#D9AA90] mt-0.5">
                    Target Bidding Range: {v.valuation_range} pts (Base Price: {v.base_price?.toFixed(1)} pts)
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
                Scouting Strengths &amp; Considerations
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-emerald-800 flex items-center space-x-1 mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Core Strengths</span>
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-[#07203F]/80 pl-1">
                    {v.strengths?.map((str: string, i: number) => (
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
                    {v.weaknesses?.map((w: string, i: number) => (
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
