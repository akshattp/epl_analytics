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
      <div className="py-24 text-center space-y-4">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full"></div>
        <p className="font-display text-lg text-[#101828] dark:text-[#F8FAFC]">Loading Player Intelligence Dossier...</p>
      </div>
    );
  }

  if (!profile || profile.error) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="font-display text-2xl font-bold text-[#101828] dark:text-[#F8FAFC]">Player Profile Not Found</h2>
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">The requested permanent player ID does not exist in the canonical registry.</p>
        <Link href="/players" className="inline-block px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-sm transition">
          Return to Player Directory
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
        <div className="bg-blue-50 dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] px-4 py-2.5 rounded-xl text-xs flex items-center justify-between border border-blue-200 dark:border-[#334155] no-print shadow-sm">
          <span className="inline-flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
            <span><strong>Public Read-Only Player Profile</strong> — Verified EPL Historical Dossier. Private franchise shortlists and auction credentials are excluded.</span>
          </span>
          <Link href="/players" className="text-[#2563EB] dark:text-[#3B82F6] underline hover:text-[#1D4ED8] font-semibold">Directory</Link>
        </div>
      )}

      {/* Navigation Breadcrumb + Report Export & Share Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Link href="/players" className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC] transition">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Player Directory</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{downloadingPdf ? "Rendering PDF..." : "Download Player PDF"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#101828] dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#151F32] text-xs font-semibold shadow-sm transition"
          >
            <Share2 className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
            <span>Share Profile</span>
          </button>
        </div>
      </div>

      {/* Share Profile Modal */}
      {shareOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white dark:bg-[#151F32] rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-2xl max-w-lg w-full p-6 space-y-4 text-[#101828] dark:text-[#F8FAFC]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#334155] pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-[#101828] dark:text-[#F8FAFC]">Share Player Profile</h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Stable permanent profile URL for {profile.name} ({profile.player_id})</p>
              </div>
              <button onClick={() => setShareOpen(false)} className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC] px-2 py-1">✕</button>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs text-[#101828] dark:text-[#F8FAFC] cursor-pointer">
                <input
                  type="checkbox"
                  checked={sharePublicToggle}
                  onChange={(e) => setSharePublicToggle(e.target.checked)}
                  className="accent-[#2563EB]"
                />
                <span>Use read-only Public Profile mode (<code className="font-mono text-[11px] text-[#2563EB] dark:text-[#3B82F6]">?public=1</code>)</span>
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B1120] text-[#101828] dark:text-[#F8FAFC]"
                />
                <button
                  type="button"
                  onClick={handleCopyShareUrl}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-sm transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy URL"}</span>
                </button>
              </div>

              {isLocalHost ? (
                <div className="bg-blue-50 dark:bg-[#0B1120] border-l-4 border-[#2563EB] p-3 rounded text-[11px] text-[#64748B] dark:text-[#94A3B8] space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-[#2563EB] dark:text-[#3B82F6]">
                    <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Local Environment Notice</span>
                  </div>
                  <p>
                    Currently running locally. External recipients can open this URL via the active ngrok tunnel.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-[#0B1120] border-l-4 border-slate-300 dark:border-[#334155] p-3 rounded text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                  Publicly accessible direct URL. Recipients can open this player profile directly without navigating the directory.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header Profile Card */}
      <div className="bg-white dark:bg-[#151F32] rounded-xl p-6 sm:p-8 border border-[#E2E8F0] dark:border-[#334155] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-[#2563EB] dark:text-[#3B82F6] font-semibold bg-blue-50 dark:bg-[#0B1120] px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-[#334155]">
                {profile.player_id}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider bg-[#2563EB] text-white px-2.5 py-0.5 rounded-full">
                {ar.role_classification || profile.primary_role}
              </span>
              <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8] bg-slate-50 dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#334155] px-2.5 py-0.5 rounded-full">
                {profile.batting_hand}
              </span>
              {pi.confidence_level && (
                <span
                  title={pi.confidence_badge}
                  className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${
                    pi.confidence_level === "HIGH"
                      ? "bg-emerald-50 dark:bg-[#0B1120] text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                      : pi.confidence_level === "MEDIUM"
                      ? "bg-blue-50 dark:bg-[#0B1120] text-[#2563EB] dark:text-[#3B82F6] border-blue-200 dark:border-blue-800"
                      : "bg-amber-50 dark:bg-[#0B1120] text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                  }`}
                >
                  {pi.confidence_level} Confidence ({profile.matches}M)
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#101828] dark:text-[#F8FAFC]">
              {profile.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] dark:text-[#94A3B8]">
              <span>Seasons Active: <strong className="text-[#101828] dark:text-[#F8FAFC]">{profile.seasons?.join(", ")}</strong></span>
              <span>•</span>
              <span>Total Matches: <strong className="text-[#101828] dark:text-[#F8FAFC]">{profile.matches}</strong></span>
              <span>•</span>
              <span>Innings Played: <strong className="text-[#101828] dark:text-[#F8FAFC]">{profile.career_batting?.innings || 0} bat / {profile.career_bowling?.innings || 0} bowl</strong></span>
            </div>
          </div>

          {/* Quick Rating Badge & Valuation Strip */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-4 shrink-0">
            <div className="text-left lg:text-right">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#64748B] dark:text-[#94A3B8] block mb-1">
                EPL Intelligence Score (PIS)
              </span>
              <RatingBadge score={pi.overall_score || r.overall_rating || 0} size="lg" />
              <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block mt-1">
                {pi.confidence_badge || "Tournament Bayesian Evaluation"}
              </span>
            </div>

            <div className="bg-[#F8FAFC] dark:bg-[#0B1120] p-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] text-left lg:text-right min-w-[190px]">
              <span className="text-[10px] font-mono uppercase text-[#64748B] dark:text-[#94A3B8] block">Auction Valuation Tier</span>
              <span className="text-xs font-bold text-[#101828] dark:text-[#F8FAFC] block">{v.category}</span>
              <span className="text-sm font-mono font-bold text-[#2563EB] dark:text-[#3B82F6]">
                Est: ₹{v.estimated_valuation?.toFixed(1)}L
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* EPL PLAYER INTELLIGENCE SCORECARD (PIS) */}
      <div className="bg-white dark:bg-[#151F32] rounded-xl p-5 sm:p-6 border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] dark:border-[#334155] pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
              <h3 className="font-display text-lg font-bold text-[#101828] dark:text-[#F8FAFC]">
                100-Point Player Intelligence Scorecard (PIS)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-50 dark:bg-[#0B1120] text-[#2563EB] dark:text-[#3B82F6] border border-blue-200 dark:border-blue-900 font-semibold">
                Rank #{pi.epl_rank || "—"} of 73
              </span>
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Explainable multi-discipline intelligence rating calibrated for 6-over cricket. Missing disciplines receive zero penalization.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowFormulaDetails(!showFormulaDetails)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC] text-xs font-semibold border border-[#E2E8F0] dark:border-[#334155] transition self-start sm:self-auto"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{showFormulaDetails ? "Hide Methodology" : "Why this score?"}</span>
            {showFormulaDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* 5-Pillar Score Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-[#F8FAFC] dark:bg-[#0B1120] p-3 rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] dark:text-[#94A3B8] block">Batting (BIS)</span>
            <div className="font-mono text-xl font-bold text-[#101828] dark:text-[#F8FAFC]">
              {pi.batting_intelligence_score !== null && pi.batting_intelligence_score !== undefined
                ? pi.batting_intelligence_score.toFixed(1)
                : <span className="text-xs text-[#94A3B8] font-normal">N/A (Did not bat)</span>}
            </div>
            <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Volume &amp; Velocity</div>
          </div>

          <div className="bg-[#F8FAFC] dark:bg-[#0B1120] p-3 rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] dark:text-[#94A3B8] block">Bowling (BoIS)</span>
            <div className="font-mono text-xl font-bold text-[#101828] dark:text-[#F8FAFC]">
              {pi.bowling_intelligence_score !== null && pi.bowling_intelligence_score !== undefined
                ? pi.bowling_intelligence_score.toFixed(1)
                : <span className="text-xs text-[#94A3B8] font-normal">N/A (Did not bowl)</span>}
            </div>
            <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Wickets &amp; Economy</div>
          </div>

          <div className="bg-[#F8FAFC] dark:bg-[#0B1120] p-3 rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] dark:text-[#94A3B8] block">All-Rounder (AIS)</span>
            <div className="font-mono text-xl font-bold text-[#101828] dark:text-[#F8FAFC]">
              {pi.all_rounder_intelligence_score?.toFixed(1) || "0.0"}
            </div>
            <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">{ar.impact_all_rounder_matches || 0} dual games</div>
          </div>

          <div className="bg-[#F8FAFC] dark:bg-[#0B1120] p-3 rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] dark:text-[#94A3B8] block">Consistency (CIS)</span>
            <div className="font-mono text-xl font-bold text-[#101828] dark:text-[#F8FAFC]">
              {pi.consistency_intelligence_score?.toFixed(1) || "50.0"}
            </div>
            <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Score Variance</div>
          </div>

          <div className="bg-[#F8FAFC] dark:bg-[#0B1120] p-3 rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#2563EB] dark:text-[#3B82F6] block">Match Impact (MIS)</span>
            <div className="font-mono text-xl font-bold text-[#2563EB] dark:text-[#3B82F6]">
              {pi.match_impact_intelligence_score?.toFixed(1) || "20.0"}
            </div>
            <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Milestones &amp; Playoff</div>
          </div>
        </div>

        {/* Collapsible Explanations & Formula Drawer */}
        {showFormulaDetails && pi.explanations && (
          <div className="bg-[#F8FAFC] dark:bg-[#0B1120] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#334155] space-y-2.5 text-xs">
            <h4 className="font-display font-bold text-[#2563EB] dark:text-[#3B82F6] uppercase tracking-wider text-[11px]">
              Mathematical Breakdown &amp; Sub-Factor Derivations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-[#101828] dark:text-[#F8FAFC]">
              <div className="space-y-1">
                <strong className="text-[#101828] dark:text-[#F8FAFC]">Batting Formula:</strong>
                <p className="font-mono text-[10px] text-[#64748B] dark:text-[#94A3B8]">{pi.explanations.batting}</p>
              </div>
              <div className="space-y-1">
                <strong className="text-[#101828] dark:text-[#F8FAFC]">Bowling Formula:</strong>
                <p className="font-mono text-[10px] text-[#64748B] dark:text-[#94A3B8]">{pi.explanations.bowling}</p>
              </div>
              <div className="space-y-1">
                <strong className="text-[#101828] dark:text-[#F8FAFC]">All-Rounder Balance:</strong>
                <p className="font-mono text-[10px] text-[#64748B] dark:text-[#94A3B8]">{pi.explanations.all_rounder}</p>
              </div>
              <div className="space-y-1">
                <strong className="text-[#101828] dark:text-[#F8FAFC]">Consistency &amp; Match Impact:</strong>
                <p className="font-mono text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                  {pi.explanations.consistency} • {pi.explanations.match_impact}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#E2E8F0] dark:border-[#334155] flex flex-wrap gap-4 text-xs font-semibold no-print">
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
                ? "border-[#2563EB] dark:border-[#3B82F6] text-[#2563EB] dark:text-[#3B82F6] font-bold"
                : "border-transparent text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC]"
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
              value={b.total_runs || 0}
              subtitle={`${b.innings || 0} innings, HS: ${b.highest_score_display || b.highest_score || 0}`}
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
              subtitle={`${bw.overs_display || bw.overs || "0.0"} overs bowled`}
              icon={<Shield className="w-4 h-4" />}
            />
            <StatCard
              title="Bowling Economy"
              value={bw.legal_balls > 0 ? bw.economy.toFixed(2) : "—"}
              subtitle={`${bw.dot_ball_percentage ? bw.dot_ball_percentage.toFixed(1) : "0.0"}% dot balls`}
              icon={<Trophy className="w-4 h-4" />}
            />
          </div>

          {/* 6-Over Cricket Milestone Rack */}
          <div className="bg-white dark:bg-[#151F32] rounded-xl p-5 border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-3 text-[#101828] dark:text-[#F8FAFC]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#334155] pb-2">
              <span className="font-display text-base font-bold text-[#101828] dark:text-[#F8FAFC] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
                <span>6-Over Cricket Milestones &amp; Impact Frequencies</span>
              </span>
              <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]">Regulation Tournament Data</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#1E293B]">
                <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] uppercase block font-semibold">10+ Scores</span>
                <span className="font-mono text-base font-bold text-[#101828] dark:text-[#F8FAFC]">{b.scores_10_plus || 0}</span>
                <span className="text-[9px] text-[#64748B] dark:text-[#94A3B8] block">{b.pct_10_plus || 0}% inn</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#1E293B]">
                <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] uppercase block font-semibold">15+ Scores</span>
                <span className="font-mono text-base font-bold text-[#101828] dark:text-[#F8FAFC]">{b.scores_15_plus || 0}</span>
                <span className="text-[9px] text-[#64748B] dark:text-[#94A3B8] block">{b.pct_15_plus || 0}% inn</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#1E293B]">
                <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] uppercase block font-semibold">20+ Scores</span>
                <span className="font-mono text-base font-bold text-[#2563EB] dark:text-[#3B82F6]">{b.scores_20_plus || 0}</span>
                <span className="text-[9px] text-[#64748B] dark:text-[#94A3B8] block">{b.pct_20_plus || 0}% inn</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#1E293B]">
                <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] uppercase block font-semibold">Multi-Wkts (2+)</span>
                <span className="font-mono text-base font-bold text-[#101828] dark:text-[#F8FAFC]">{bw.two_plus_wickets || 0}</span>
                <span className="text-[9px] text-[#64748B] dark:text-[#94A3B8] block">{bw.multi_wicket_frequency || 0}% sp</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#1E293B]">
                <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] uppercase block font-semibold">Ducks / Not-Outs</span>
                <span className="font-mono text-base font-bold text-[#101828] dark:text-[#F8FAFC]">{b.duck_count || 0} / {b.not_outs || 0}</span>
                <span className="text-[9px] text-[#64748B] dark:text-[#94A3B8] block">{b.not_out_percentage || 0}% NO</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#1E293B]">
                <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] uppercase block font-semibold">Explosiveness</span>
                <span className="font-mono text-base font-bold text-[#2563EB] dark:text-[#3B82F6]">{b.explosiveness_index || 0}</span>
                <span className="text-[9px] text-[#64748B] dark:text-[#94A3B8] block">Index / 100</span>
              </div>
            </div>
          </div>

          {/* Batting & Bowling Deep Analysis Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Batting Metrics Card */}
            <div className="bg-white dark:bg-[#151F32] rounded-xl p-5 border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-4 text-[#101828] dark:text-[#F8FAFC]">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#334155] pb-2">
                <h3 className="font-display text-lg font-bold text-[#101828] dark:text-[#F8FAFC]">Batting Performance Metrics</h3>
                <span className="font-mono text-xs font-bold text-[#2563EB] dark:text-[#3B82F6]">
                  {pi.batting_intelligence_score ? `${pi.batting_intelligence_score.toFixed(1)} / 100` : "N/A"}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#E2E8F0] dark:border-[#334155]">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Batting Average</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{b.average_display || b.batting_average?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0] dark:border-[#334155]">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Runs Per Innings</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{b.runs_per_innings?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0] dark:border-[#334155]">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Balls Faced</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{b.total_balls} balls</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0] dark:border-[#334155]">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Dismissals / Not-Outs</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{b.outs} outs / {b.not_outs} NO ({b.not_out_percentage?.toFixed(1)}%)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0] dark:border-[#334155]">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Fours / Sixes</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{b.fours} 4s / {b.sixes} 6s</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0] dark:border-[#334155]">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Boundary Runs Share</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{b.boundary_runs_percentage?.toFixed(1)}% of runs</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0] dark:border-[#334155]">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Balls Per Boundary</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{b.balls_per_boundary?.toFixed(1)} balls</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Consistency Index</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{b.consistency_index?.toFixed(1)} / 100</span>
                </div>
              </div>
            </div>

            {/* Bowling Metrics Card */}
            <div className="bg-white dark:bg-[#151F32] rounded-xl p-5 border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-4 text-[#101828] dark:text-[#F8FAFC]">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#334155] pb-2">
                <h3 className="font-display text-lg font-bold text-[#101828] dark:text-[#F8FAFC]">Bowling Performance Metrics</h3>
                <span className="font-mono text-xs font-bold text-[#2563EB] dark:text-[#3B82F6]">
                  {pi.bowling_intelligence_score ? `${pi.bowling_intelligence_score.toFixed(1)} / 100` : "N/A"}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#E2E8F0] dark:border-[#334155]">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Runs Conceded / Legal Balls</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{bw.runs_conceded} runs / {bw.legal_balls} balls</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0] dark:border-[#334155]">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Bowling Average</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{bw.bowling_average ? bw.bowling_average.toFixed(2) : "N/A"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0] dark:border-[#334155]">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Bowling Strike Rate</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{bw.bowling_strike_rate ? `${bw.bowling_strike_rate.toFixed(1)} balls/wkt` : "N/A"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0] dark:border-[#334155]">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Wickets Per Match</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{bw.wickets_per_match?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0] dark:border-[#334155]">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Dot Balls (Frequency)</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{bw.dot_balls} dots ({bw.dot_ball_percentage?.toFixed(1)}%)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0] dark:border-[#334155]">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Boundary Concession %</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{bw.boundary_concession_percentage?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0] dark:border-[#334155]">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Best Figures</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{bw.best_figures || "—"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Spell Consistency Index</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{bw.bowling_consistency_index?.toFixed(1)} / 100</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 6B: VISUAL ANALYTICS CHARTS */}
          {charts && (
            <div className="space-y-5 pt-2">
              <div className="border-b border-[#E2E8F0] dark:border-[#334155] pb-2">
                <h3 className="font-display text-xl font-bold text-[#101828] dark:text-[#F8FAFC]">
                  Visual Performance Analytics
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
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
                  series={[{ dataKey: "score", name: profile.name, color: EPL_PALETTE.blue }]}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <PlayerScatterChart
                  title="Batting Average vs Strike Rate (League Context)"
                  definition="Positions this player (electric blue) against all EPL batters with >= 15 balls faced."
                  interpretation="Upper-right quadrant represents high-average, high-velocity batters who sustain scoring without sacrificing tempo."
                  data={charts.batting_scatter || []}
                  xKey="average"
                  yKey="strike_rate"
                  xLabel="Batting Average"
                  yLabel="Strike Rate"
                />
                <PlayerScatterChart
                  title="Bowling Economy vs Wickets (League Context)"
                  definition="Positions this player (electric blue) against all EPL bowlers with >= 12 legal balls bowled."
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
                  bars={[{ dataKey: "runs", name: "Runs Scored", color: EPL_PALETTE.blue }]}
                />
                <SimpleComparisonBarChart
                  title="Performance in Wins vs Losses"
                  definition="Comparison of batting output and bowling economy in team victories versus defeats."
                  interpretation="Highlights descriptive output differences between winning and losing team outcomes (correlation, not sole causation)."
                  data={charts.wins_vs_losses || []}
                  xKey="metric"
                  bars={[
                    { dataKey: "In Wins", name: "In Team Wins", color: EPL_PALETTE.blue },
                    { dataKey: "In Losses", name: "In Team Losses", color: EPL_PALETTE.cyan },
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
          <div className="bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] p-5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] space-y-2 shadow-sm">
            <h3 className="font-display text-lg font-bold text-[#101828] dark:text-[#F8FAFC]">
              Situational Pressure Splits
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Evaluates execution under differing match scripts: setting targets (Innings 1) versus chasing totals (Innings 2), 
              and bowling first versus defending totals under scoreboard pressure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Batting 1st vs Chasing */}
            <div className="bg-white dark:bg-[#151F32] rounded-xl p-5 border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-4 text-[#101828] dark:text-[#F8FAFC]">
              <h4 className="font-display text-base font-bold text-[#101828] dark:text-[#F8FAFC] border-b border-[#E2E8F0] dark:border-[#334155] pb-2">
                Batting: Setting Target vs Run Chase
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-[#F8FAFC] dark:bg-[#0B1120] p-3 rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] space-y-2">
                  <span className="font-bold text-[#2563EB] dark:text-[#3B82F6] block">Batting 1st (Setting)</span>
                  <div className="space-y-1 text-[#101828] dark:text-[#F8FAFC]">
                    <div>Runs: <strong className="text-[#101828] dark:text-[#F8FAFC]">{ss.batting_first?.total_runs || 0}</strong> ({ss.batting_first?.innings || 0} inn)</div>
                    <div>SR: <strong className="text-[#101828] dark:text-[#F8FAFC]">{ss.batting_first?.strike_rate?.toFixed(1) || "0.0"}</strong></div>
                    <div>Avg: <strong className="text-[#101828] dark:text-[#F8FAFC]">{ss.batting_first?.average_display || "0.00"}</strong></div>
                    <div>Boundaries: <strong className="text-[#101828] dark:text-[#F8FAFC]">{ss.batting_first?.fours || 0}x4, {ss.batting_first?.sixes || 0}x6</strong></div>
                    <div>HS: <strong className="text-[#101828] dark:text-[#F8FAFC]">{ss.batting_first?.highest_score_display || "0"}</strong></div>
                  </div>
                </div>

                <div className="bg-[#F8FAFC] dark:bg-[#0B1120] p-3 rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] space-y-2">
                  <span className="font-bold text-[#0891B2] dark:text-[#22D3EE] block">Chasing (Innings 2)</span>
                  <div className="space-y-1 text-[#101828] dark:text-[#F8FAFC]">
                    <div>Runs: <strong className="text-[#101828] dark:text-[#F8FAFC]">{ss.chasing?.total_runs || 0}</strong> ({ss.chasing?.innings || 0} inn)</div>
                    <div>SR: <strong className="text-[#101828] dark:text-[#F8FAFC]">{ss.chasing?.strike_rate?.toFixed(1) || "0.0"}</strong></div>
                    <div>Avg: <strong className="text-[#101828] dark:text-[#F8FAFC]">{ss.chasing?.average_display || "0.00"}</strong></div>
                    <div>Boundaries: <strong className="text-[#101828] dark:text-[#F8FAFC]">{ss.chasing?.fours || 0}x4, {ss.chasing?.sixes || 0}x6</strong></div>
                    <div>HS: <strong className="text-[#101828] dark:text-[#F8FAFC]">{ss.chasing?.highest_score_display || "0"}</strong></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bowling 1st vs Defending */}
            <div className="bg-white dark:bg-[#151F32] rounded-xl p-5 border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-4 text-[#101828] dark:text-[#F8FAFC]">
              <h4 className="font-display text-base font-bold text-[#101828] dark:text-[#F8FAFC] border-b border-[#E2E8F0] dark:border-[#334155] pb-2">
                Bowling: First Inning vs Defending Total
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-[#F8FAFC] dark:bg-[#0B1120] p-3 rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] space-y-2">
                  <span className="font-bold text-[#2563EB] dark:text-[#3B82F6] block">Bowling 1st</span>
                  <div className="space-y-1 text-[#101828] dark:text-[#F8FAFC]">
                    <div>Overs: <strong className="text-[#101828] dark:text-[#F8FAFC]">{ss.bowling_first?.overs_display || "0.0"}</strong></div>
                    <div>Wickets: <strong className="text-[#101828] dark:text-[#F8FAFC]">{ss.bowling_first?.wickets || 0}</strong></div>
                    <div>Economy: <strong className="text-[#101828] dark:text-[#F8FAFC]">{ss.bowling_first?.economy?.toFixed(2) || "0.00"}</strong></div>
                    <div>Runs Conceded: <strong className="text-[#101828] dark:text-[#F8FAFC]">{ss.bowling_first?.runs_conceded || 0}</strong></div>
                    <div>Dots: <strong className="text-[#101828] dark:text-[#F8FAFC]">{ss.bowling_first?.dot_balls || 0} ({ss.bowling_first?.dot_ball_percentage?.toFixed(1) || 0}%)</strong></div>
                  </div>
                </div>

                <div className="bg-[#F8FAFC] dark:bg-[#0B1120] p-3 rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] space-y-2">
                  <span className="font-bold text-[#0891B2] dark:text-[#22D3EE] block">Defending Total</span>
                  <div className="space-y-1 text-[#101828] dark:text-[#F8FAFC]">
                    <div>Overs: <strong className="text-[#101828] dark:text-[#F8FAFC]">{ss.defending?.overs_display || "0.0"}</strong></div>
                    <div>Wickets: <strong className="text-[#101828] dark:text-[#F8FAFC]">{ss.defending?.wickets || 0}</strong></div>
                    <div>Economy: <strong className="text-[#101828] dark:text-[#F8FAFC]">{ss.defending?.economy?.toFixed(2) || "0.00"}</strong></div>
                    <div>Runs Conceded: <strong className="text-[#101828] dark:text-[#F8FAFC]">{ss.defending?.runs_conceded || 0}</strong></div>
                    <div>Dots: <strong className="text-[#101828] dark:text-[#F8FAFC]">{ss.defending?.dot_balls || 0} ({ss.defending?.dot_ball_percentage?.toFixed(1) || 0}%)</strong></div>
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
                <div key={sKey} className="bg-white dark:bg-[#151F32] rounded-xl p-5 border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-4 text-[#101828] dark:text-[#F8FAFC]">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#334155] pb-2">
                    <span className="font-display text-xl font-bold text-[#101828] dark:text-[#F8FAFC]">Season {sKey}</span>
                    <span className="text-xs font-semibold bg-[#2563EB] text-white px-2.5 py-0.5 rounded-full">
                      {sBat.matches || sBowl.matches} matches
                    </span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="font-semibold text-[#2563EB] dark:text-[#3B82F6] mb-1 uppercase text-[10px] tracking-wider">Batting Performance</div>
                      <div className="grid grid-cols-2 gap-2 text-[#64748B] dark:text-[#94A3B8]">
                        <div>Runs: <strong className="text-[#101828] dark:text-[#F8FAFC]">{sBat.total_runs}</strong> ({sBat.innings} inn)</div>
                        <div>SR: <strong className="text-[#101828] dark:text-[#F8FAFC]">{sBat.strike_rate?.toFixed(1)}</strong></div>
                        <div>Avg: <strong className="text-[#101828] dark:text-[#F8FAFC]">{sBat.average_display || sBat.batting_average?.toFixed(1)}</strong></div>
                        <div>HS: <strong className="text-[#101828] dark:text-[#F8FAFC]">{sBat.highest_score_display || sBat.highest_score}</strong></div>
                        <div>10+ Scores: <strong className="text-[#101828] dark:text-[#F8FAFC]">{sBat.scores_10_plus || 0}</strong></div>
                        <div>Boundaries: <strong className="text-[#101828] dark:text-[#F8FAFC]">{sBat.boundary_percentage?.toFixed(1)}%</strong></div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#334155]">
                      <div className="font-semibold text-[#0891B2] dark:text-[#22D3EE] mb-1 uppercase text-[10px] tracking-wider">Bowling Performance</div>
                      <div className="grid grid-cols-2 gap-2 text-[#64748B] dark:text-[#94A3B8]">
                        <div>Wickets: <strong className="text-[#101828] dark:text-[#F8FAFC]">{sBowl.wickets}</strong> ({sBowl.overs_display || sBowl.overs} ov)</div>
                        <div>Economy: <strong className="text-[#101828] dark:text-[#F8FAFC]">{sBowl.legal_balls > 0 ? sBowl.economy?.toFixed(2) : "—"}</strong></div>
                        <div>Runs C: <strong className="text-[#101828] dark:text-[#F8FAFC]">{sBowl.runs_conceded}</strong></div>
                        <div>Dots: <strong className="text-[#101828] dark:text-[#F8FAFC]">{sBowl.dot_balls}</strong></div>
                        <div>Best: <strong className="text-[#101828] dark:text-[#F8FAFC]">{sBowl.best_figures || "—"}</strong></div>
                        <div>Multi-Wkts: <strong className="text-[#101828] dark:text-[#F8FAFC]">{sBowl.two_plus_wickets || 0}</strong></div>
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
          className="table-wrapper bg-white dark:bg-[#151F32] rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm overflow-x-auto text-[#101828] dark:text-[#F8FAFC]"
        >
          <table className="w-full text-left text-xs table-editorial">
            <thead>
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
            <tbody>
              {profile.match_history?.map((m: any, idx: number) => {
                const hasBat = m.batting !== null && m.batting !== undefined;
                const hasBowl = m.bowling !== null && m.bowling !== undefined;
                return (
                  <tr key={idx} className="hover:bg-blue-50/50 dark:hover:bg-[#1E293B]/60 transition">
                    <td className="p-3 font-medium">
                      <span className="font-bold text-[#101828] dark:text-[#F8FAFC]">EPL {m.season}</span>
                      <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block">{m.stage}</span>
                    </td>
                    <td className="p-3 font-semibold text-[#101828] dark:text-[#F8FAFC]">{m.opponent}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 dark:bg-[#0B1120] border border-blue-200 dark:border-[#334155] text-[#2563EB] dark:text-[#3B82F6] font-semibold">
                        {hasBat && hasBowl ? "Bat & Bowl" : hasBat ? "Batting" : hasBowl ? "Bowling" : "—"}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">
                      {hasBat ? `${m.batting.runs}${m.batting.is_not_out ? "*" : ""} (${m.batting.balls}b)` : "—"}
                    </td>
                    <td className="p-3 font-mono text-[#64748B] dark:text-[#94A3B8]">
                      {hasBat && m.batting.strike_rate ? m.batting.strike_rate.toFixed(1) : "—"}
                    </td>
                    <td className="p-3 text-[#64748B] dark:text-[#94A3B8]">
                      {hasBat ? (m.batting.dismissal || "not out") : "—"}
                    </td>
                    <td className="p-3 font-mono text-[#101828] dark:text-[#F8FAFC]">
                      {hasBowl ? `${m.bowling.overs} ov` : "—"}
                    </td>
                    <td className="p-3 font-mono font-bold text-[#2563EB] dark:text-[#3B82F6]">
                      {hasBowl ? `${m.bowling.wickets}/${m.bowling.runs_conceded}` : "—"}
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
            <div className="bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] rounded-xl p-6 border border-[#E2E8F0] dark:border-[#334155] space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#334155] pb-3">
                <span className="text-xs uppercase font-bold text-[#2563EB] dark:text-[#3B82F6] tracking-wider">
                  Auction Intelligence Report
                </span>
                <span className="text-xs font-semibold bg-[#2563EB] text-white px-2.5 py-0.5 rounded-full">
                  {v.category}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-xs text-[#64748B] dark:text-[#94A3B8] block">Projected Bidding Valuation</span>
                  <div className="font-mono text-3xl font-bold text-[#2563EB] dark:text-[#3B82F6] mt-1">
                    ₹{v.estimated_valuation?.toFixed(1)} <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">Lakhs</span>
                  </div>
                  <div className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                    Target Bidding Range: {v.valuation_range} (Base Price: ₹{v.base_price?.toFixed(1)}L)
                  </div>
                </div>

                <div className="text-xs text-[#64748B] dark:text-[#94A3B8] space-y-1.5 pt-2 border-t border-[#E2E8F0] dark:border-[#334155]">
                  <div className="flex justify-between">
                    <span className="text-[#64748B] dark:text-[#94A3B8]">Scarcity Multiplier</span>
                    <strong className="text-[#101828] dark:text-[#F8FAFC] font-mono">{v.scarcity_multiplier}x</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B] dark:text-[#94A3B8]">Knockout Playoff Premium</span>
                    <strong className="text-[#101828] dark:text-[#F8FAFC] font-mono">+{v.knockout_premium} pts</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B] dark:text-[#94A3B8]">Valuation Confidence</span>
                    <strong className="text-[#2563EB] dark:text-[#3B82F6]">{v.valuation_confidence}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] rounded-xl p-6 border border-[#E2E8F0] dark:border-[#334155] space-y-4 shadow-sm">
              <h3 className="font-display text-xl font-bold text-[#101828] dark:text-[#F8FAFC]">
                Scouting Strengths &amp; Considerations
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified Core Strengths</span>
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-[#64748B] dark:text-[#94A3B8] pl-1">
                    {v.strengths?.map((str: string, i: number) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#334155]">
                  <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center space-x-1 mb-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Tactical Considerations</span>
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-[#64748B] dark:text-[#94A3B8] pl-1">
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
              <div className="border-b border-[#E2E8F0] dark:border-[#334155] pb-2">
                <h3 className="font-display text-xl font-bold text-[#101828] dark:text-[#F8FAFC]">
                  Auction Bidding Substitutes (Similar Profiles)
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  If bidding for {profile.name} becomes too expensive, these statistical alternatives offer similar functional profiles.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {profile.similar_players.map((sp: any) => (
                  <div key={sp.player_id} className="bg-white dark:bg-[#151F32] rounded-xl p-4 border border-[#E2E8F0] dark:border-[#334155] space-y-2 shadow-sm text-[#101828] dark:text-[#F8FAFC]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#101828] dark:text-[#F8FAFC]">{sp.player_name}</span>
                      <RatingBadge score={sp.overall_rating} size="sm" />
                    </div>
                    <div className="text-xs text-[#2563EB] dark:text-[#3B82F6] font-semibold">
                      {sp.similarity_score}% Statistical Match
                    </div>
                    <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                      {sp.key_differences.join("; ")}
                    </p>
                    <Link
                      href={`/players/${sp.player_id}`}
                      className="block text-center text-xs font-semibold text-[#101828] dark:text-[#F8FAFC] bg-[#F8FAFC] dark:bg-[#0B1120] hover:bg-blue-50 dark:hover:bg-[#1E293B] py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#334155] transition"
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
