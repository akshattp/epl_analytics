"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Trophy, Flame, Shield, TrendingUp,
  ExternalLink, DollarSign, Sparkles, CheckCircle2, AlertCircle,
  FileText, Share2, Copy, Check, Globe, Lock, Info, ChevronDown,
  ChevronUp, Target, Award, Zap, Crosshair, BarChart2, Star, Activity,
  Sliders, UserCheck
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

// Helper to compute initials from name
function getInitials(name: string): string {
  if (!name) return "EP";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function PlayerProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const [profile, setProfile] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [fourTierRankings, setFourTierRankings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"career" | "situational" | "seasons" | "matches" | "auction">("career");
  const [matchSeasonFilter, setMatchSeasonFilter] = useState<string>("ALL");
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
        const [res, chartRes, rankingRes] = await Promise.all([
          fetchApi(`/api/players/${id}`),
          fetchApi(`/api/advanced/charts/player/${id}`).catch(() => null),
          fetchApi(`/api/rankings/player/${id}`).catch(() => null),
        ]);
        setProfile(res);
        setCharts(chartRes);
        if (rankingRes && rankingRes.rankings) {
          setFourTierRankings(rankingRes.rankings);
        }
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
      <div className="py-28 text-center space-y-4">
        <div className="relative inline-block w-12 h-12">
          <div className="w-12 h-12 rounded-full border-4 border-[#FF4B35]/20 border-t-[#FF4B35] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="w-5 h-5 text-[#FF4B35] animate-pulse" />
          </div>
        </div>
        <p className="font-display text-lg font-bold text-[#111318] dark:text-[#F1EBDD]">
          Calibrating Athlete Dossier...
        </p>
        <p className="text-xs text-[#5C584E] dark:text-[#A8A296]">
          Retrieving 3-season Bayesian telemetry, 6-over splits &amp; valuation matrix.
        </p>
      </div>
    );
  }

  if (!profile || profile.error) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-2">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="font-display text-2xl font-bold text-[#111318] dark:text-[#F1EBDD]">
          Player Profile Not Found
        </h2>
        <p className="text-xs text-[#5C584E] dark:text-[#A8A296]">
          The requested permanent player ID ({id}) is not registered in the canonical registry.
        </p>
        <Link
          href="/players"
          className="inline-block px-5 py-2.5 bg-[#FF4B35] hover:bg-[#E03E29] text-white rounded-xl text-xs font-semibold shadow-md transition"
        >
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
  const isMarquee = (pi.overall_score || r.overall_rating || 0) >= 75;
  const roleType = (ar.role_classification || profile.primary_role || "").toLowerCase();
  const isAllRounder = roleType.includes("all-rounder") || roleType.includes("all rounder");
  const isBowler = roleType.includes("bowler") && !isAllRounder;

  // Filter match history by season if requested
  const filteredMatches = (profile.match_history || []).filter((m: any) => {
    if (matchSeasonFilter === "ALL") return true;
    return String(m.season) === matchSeasonFilter;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
      data-profile-ready="true"
    >
      {/* Public Read-Only Banner */}
      {isPublicMode && !isPrintMode && (
        <div className="bg-[#FF4B35]/10 border border-[#FF4B35]/30 text-[#111318] dark:text-[#F1EBDD] px-4 py-3 rounded-lg text-xs flex items-center justify-between no-print">
          <span className="inline-flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#FF4B35]" />
            <span>
              <strong>Verified Public Dossier</strong> — EPL Historical Telemetry. Franchise private bidding sheets and security pins are hidden.
            </span>
          </span>
          <Link
            href="/players"
            className="text-[#FF4B35] underline hover:opacity-80 font-semibold"
          >
            All Players
          </Link>
        </div>
      )}

      {/* Breadcrumb + Primary Dossier Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <Link
          href="/players"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-[#5C584E] dark:text-[#A8A296] hover:text-[#FF4B35] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Player Registry</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/comparison?p1=${id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FAF7F0] dark:bg-[#181A20] border border-[#DDD5C3] dark:border-[#2A2E38] text-xs font-semibold text-[#111318] dark:text-[#F1EBDD] hover:border-[#FF4B35] transition"
          >
            <Sliders className="w-3.5 h-3.5 text-[#FF4B35]" />
            <span>Compare H2H</span>
          </Link>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF4B35] hover:bg-[#E03E29] text-white text-xs font-semibold transition disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{downloadingPdf ? "Compiling PDF..." : "Export PDF Dossier"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FAF7F0] dark:bg-[#181A20] border border-[#DDD5C3] dark:border-[#2A2E38] text-[#111318] dark:text-[#F1EBDD] hover:border-[#FF4B35] text-xs font-semibold transition"
          >
            <Share2 className="w-3.5 h-3.5 text-[#FF4B35]" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Share Profile Modal */}
      {shareOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-[#151F32] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-2xl max-w-lg w-full p-6 space-y-4 text-[#101828] dark:text-[#F8FAFC]"
          >
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#334155] pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-[#101828] dark:text-[#F8FAFC]">
                  Share Athlete Dossier
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Canonical link for {profile.name} ({profile.player_id})
                </p>
              </div>
              <button
                onClick={() => setShareOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-xs font-bold text-[#64748B] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-[#F8FAFC]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs text-[#101828] dark:text-[#F8FAFC] cursor-pointer">
                <input
                  type="checkbox"
                  checked={sharePublicToggle}
                  onChange={(e) => setSharePublicToggle(e.target.checked)}
                  className="accent-[#FF4B35]"
                />
                <span>
                  Enable public read-only mode (<code className="font-mono text-[11px] text-[#FF4B35]">?public=1</code>)
                </span>
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-[#DDD5C3] dark:border-[#2A2E38] bg-[#FAF7F0] dark:bg-[#111318] text-[#111318] dark:text-[#F1EBDD]"
                />
                <button
                  type="button"
                  onClick={handleCopyShareUrl}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF4B35] hover:bg-[#E03E29] text-white text-xs font-semibold shadow-sm transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>

              {isLocalHost ? (
                <div className="bg-[#FF4B35]/10 border-l-4 border-[#FF4B35] p-3 rounded-xl text-[11px] text-[#5C584E] dark:text-[#A8A296] space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-[#FF4B35]">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Local Session Active</span>
                  </div>
                  <p>Running locally. Share through the active ngrok tunnel for external access.</p>
                </div>
              ) : (
                <div className="bg-[#FAF7F0] dark:bg-[#181A20] border-l-4 border-[#DDD5C3] dark:border-[#2A2E38] p-3 rounded-xl text-[11px] text-[#5C584E] dark:text-[#A8A296]">
                  Direct public profile address. External scouts can load this dossier directly.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SIGNATURE ATHLETE DOSSIER HERO                                 */}
      {/* ============================================================== */}
      <section className="relative overflow-hidden rounded-3xl bg-[#FAF7F0] dark:bg-[#181A20] border border-[#DDD5C3] dark:border-[#2A2E38] shadow-xl p-6 sm:p-10">
        {/* Subtle Luxury Radial Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF4B35]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-[#FF4B35]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Athlete Monogram Crest & Typographic Identity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Custom Monogram Badge with Halo */}
            <div className="relative shrink-0">
              <div
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center font-display font-black text-2xl sm:text-3xl tracking-tighter shadow-xl border ${
                  isMarquee
                    ? "bg-[#111318] text-[#F1EBDD] border-[#FF4B35] shadow-[#FF4B35]/20 ring-4 ring-[#FF4B35]/15"
                    : "bg-[#181A20] text-[#F1EBDD] border-[#2A2E38] shadow-black/20"
                }`}
              >
                {getInitials(profile.name)}
              </div>
              {isMarquee && (
                <div
                  title="Elite / Marquee Tier Rating"
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#FF4B35] text-white flex items-center justify-center shadow-lg border-2 border-[#FAF7F0] dark:border-[#181A20]"
                >
                  <Star className="w-3.5 h-3.5 fill-white" />
                </div>
              )}
            </div>

            {/* Athlete Name & Identity Pills */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-[#5C584E] dark:text-[#A8A295] bg-[#E8E1D1]/60 dark:bg-[#22252D] px-2.5 py-0.5 rounded-md">
                  {profile.player_id}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider bg-[#FF4B35] text-white px-2.5 py-0.5 rounded-md">
                  {profile.role_classification || ar.role_classification || profile.primary_role}
                </span>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-[#E8E1D1]/60 dark:bg-[#22252D] text-[#111318] dark:text-[#F1EBDD] border border-[#DDD5C3] dark:border-[#2A2E38]">
                  {profile.experience_label || `${profile.matches} Matches`}
                </span>
                <span className="text-xs font-medium text-[#5C584E] dark:text-[#A8A296] bg-[#F1EBDD] dark:bg-[#111318] border border-[#DDD5C3] dark:border-[#2A2E38] px-2.5 py-0.5 rounded-md">
                  {profile.batting_hand}
                </span>
                {profile.confidence_level && (
                  <span
                    className={`text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-md border font-semibold ${
                      profile.confidence_level === "HIGH"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : profile.confidence_level === "MEDIUM"
                        ? "bg-[#FF4B35]/10 text-[#FF4B35] border-[#FF4B35]/30"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {profile.confidence_level} Confidence
                  </span>
                )}
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#111318] dark:text-[#F1EBDD]">
                {profile.name}
              </h1>

              {/* Controlled Vocabulary Performance Tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {(profile.tags_detail && profile.tags_detail.length > 0) ? (
                  profile.tags_detail.map((t: any, idx: number) => (
                    <div
                      key={idx}
                      title={t.explanation}
                      className={`group relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition shadow-xs cursor-help ${
                        t.category === "Confidence"
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                          : t.category === "Potential"
                          ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
                          : t.category === "All-Round"
                          ? "bg-[#FF4B35]/10 text-[#FF4B35] border-[#FF4B35]/30 font-bold"
                          : t.category === "Batting"
                          ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                          : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      }`}
                    >
                      <span>{t.tag}</span>
                      <Info className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                    </div>
                  ))
                ) : (profile.performance_tags && profile.performance_tags.length > 0) ? (
                  profile.performance_tags.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#E8E1D1]/60 dark:bg-[#22252D] text-[#111318] dark:text-[#F1EBDD] border border-[#DDD5C3] dark:border-[#2A2E38]"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] font-mono text-[#5C584E] dark:text-[#A8A296] bg-[#F1EBDD] dark:bg-[#111318] border border-[#DDD5C3] dark:border-[#2A2E38] px-2.5 py-0.5 rounded-md">
                    Standard Squad Contributor
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium text-[#5C584E] dark:text-[#A8A296]">
                <span>
                  Seasons Active: <strong className="text-[#111318] dark:text-[#F1EBDD]">{profile.seasons?.join(", ")}</strong>
                </span>
                <span>•</span>
                <span>
                  Matches: <strong className="text-[#111318] dark:text-[#F1EBDD]">{profile.matches}</strong>
                </span>
                <span>•</span>
                <span>
                  Innings: <strong className="text-[#111318] dark:text-[#F1EBDD]">{profile.career_batting?.innings || 0} Bat / {profile.career_bowling?.innings || 0} Bowl</strong>
                </span>
                <span>•</span>
                <span>
                  Evidence: <strong className="text-[#111318] dark:text-[#F1EBDD]">{profile.batting_evidence || "Batting"} &amp; {profile.bowling_evidence || "Bowling"}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right Rail: 100-Point PIS & Valuation Matrix Pill */}
          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between sm:justify-start gap-5 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#DDD5C3] dark:border-[#2A2E38]">
            <div className="text-left lg:text-right">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#5C584E] dark:text-[#A8A296] block mb-1">
                EPL Intelligence Score (PIS)
              </span>
              <div className="flex items-center lg:justify-end gap-2">
                <RatingBadge score={pi.overall_score || r.overall_rating || 0} size="lg" />
              </div>
              <span className="text-[10px] text-[#5C584E] dark:text-[#A8A296] block mt-1 font-mono">
                {pi.confidence_badge || "Bayesian Regressed Rating"}
              </span>
            </div>

            <div className="bg-[#F1EBDD]/90 dark:bg-[#111318]/90 backdrop-blur-md p-4 rounded-2xl border border-[#DDD5C3] dark:border-[#2A2E38] text-left lg:text-right min-w-[210px] shadow-sm">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#5C584E] dark:text-[#A8A296] block">
                Auction Projected Tier
              </span>
              <span className="text-sm font-display font-bold text-[#111318] dark:text-[#F1EBDD] block">
                {v.category || "Regulation Pool"}
              </span>
              <div className="text-lg font-mono font-black text-[#FF4B35] mt-0.5">
                ₹{v.estimated_valuation?.toFixed(1)}L
                <span className="text-[11px] font-normal text-[#5C584E] dark:text-[#A8A296] ml-1">
                  (Base ₹{v.base_price?.toFixed(1)}L)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* EPL 2.1-dev FOUR-TIER INDEPENDENT RANKINGS SECTION            */}
      {/* ============================================================== */}
      {fourTierRankings && (
        <section className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-2xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DDD5C3] dark:border-[#2A2E38] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#FF4B35]" />
                <h3 className="font-display text-lg font-bold text-[#111318] dark:text-[#F1EBDD]">
                  Four-Tier Independent Player Intelligence &amp; Rankings
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-[#FF4B35]/15 text-[#FF4B35] border border-[#FF4B35]/30">
                  v2.1-dev
                </span>
              </div>
              <p className="text-xs text-[#5C584E] dark:text-[#A8A296]">
                Four separate rankings computed with discipline-isolated mathematical models and Bayesian sample shrinkage.
              </p>
            </div>
            <Link
              href="/rankings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F1EBDD] dark:bg-[#111318] text-[#111318] dark:text-[#F1EBDD] hover:text-[#FF4B35] dark:hover:text-[#FF4B35] text-xs font-semibold border border-[#DDD5C3] dark:border-[#2A2E38] transition self-start sm:self-auto"
            >
              <span>View Leaderboards</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. BAT */}
            <div className="bg-[#F1EBDD] dark:bg-[#111318] p-4 rounded-xl border border-[#DDD5C3] dark:border-[#2A2E38] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#5C584E] dark:text-[#A8A296] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-blue-500" />
                  Batting (BAT)
                </span>
                <span className="text-[10px] font-mono font-bold text-[#5C584E] dark:text-[#A8A296]">
                  {fourTierRankings.batting.rank ? `#${fourTierRankings.batting.rank} / ${fourTierRankings.batting.rank_of}` : "Unranked"}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="font-mono text-3xl font-extrabold text-[#111318] dark:text-[#F1EBDD]">
                  {fourTierRankings.batting.score !== null ? fourTierRankings.batting.score.toFixed(1) : "—"}
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono uppercase font-bold border ${
                  fourTierRankings.batting.confidence_level === "HIGH" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                  fourTierRankings.batting.confidence_level === "MEDIUM" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                  "bg-red-500/10 text-red-400 border-red-500/30"
                }`}>
                  {fourTierRankings.batting.confidence_level} CONF
                </span>
              </div>
              <div className="w-full bg-[#DDD5C3] dark:bg-[#2A2E38] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, fourTierRankings.batting.score || 0))}%` }}
                />
              </div>
              <div className="text-[10px] text-[#5C584E] dark:text-[#A8A296] leading-tight">
                {fourTierRankings.batting.eligible
                  ? "Pure batting performance. Bowling has 0 influence."
                  : (fourTierRankings.batting.eligibility_reason || "Did not bat")}
              </div>
            </div>

            {/* 2. BOWL */}
            <div className="bg-[#F1EBDD] dark:bg-[#111318] p-4 rounded-xl border border-[#DDD5C3] dark:border-[#2A2E38] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#5C584E] dark:text-[#A8A296] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  Bowling (BOWL)
                </span>
                <span className="text-[10px] font-mono font-bold text-[#5C584E] dark:text-[#A8A296]">
                  {fourTierRankings.bowling.rank ? `#${fourTierRankings.bowling.rank} / ${fourTierRankings.bowling.rank_of}` : "Unranked"}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="font-mono text-3xl font-extrabold text-[#111318] dark:text-[#F1EBDD]">
                  {fourTierRankings.bowling.score !== null ? fourTierRankings.bowling.score.toFixed(1) : "—"}
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono uppercase font-bold border ${
                  fourTierRankings.bowling.confidence_level === "HIGH" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                  fourTierRankings.bowling.confidence_level === "MEDIUM" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                  "bg-red-500/10 text-red-400 border-red-500/30"
                }`}>
                  {fourTierRankings.bowling.confidence_level} CONF
                </span>
              </div>
              <div className="w-full bg-[#DDD5C3] dark:bg-[#2A2E38] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, fourTierRankings.bowling.score || 0))}%` }}
                />
              </div>
              <div className="text-[10px] text-[#5C584E] dark:text-[#A8A296] leading-tight">
                {fourTierRankings.bowling.eligible
                  ? "Pure bowling suppression & strike rate. Batting has 0 influence."
                  : (fourTierRankings.bowling.eligibility_reason || "Did not bowl")}
              </div>
            </div>

            {/* 3. AR */}
            <div className="bg-[#F1EBDD] dark:bg-[#111318] p-4 rounded-xl border border-[#DDD5C3] dark:border-[#2A2E38] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#5C584E] dark:text-[#A8A296] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  All-Round (AR)
                </span>
                <span className="text-[10px] font-mono font-bold text-[#5C584E] dark:text-[#A8A296]">
                  {fourTierRankings.allround.rank ? `#${fourTierRankings.allround.rank} / ${fourTierRankings.allround.rank_of}` : "Unranked"}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="font-mono text-3xl font-extrabold text-[#111318] dark:text-[#F1EBDD]">
                  {fourTierRankings.allround.score !== null ? fourTierRankings.allround.score.toFixed(1) : "—"}
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono uppercase font-bold border ${
                  fourTierRankings.allround.eligible
                    ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                    : "bg-[#2A2E38]/50 text-[#5C584E] border-[#2A2E38]"
                }`}>
                  {fourTierRankings.allround.eligible ? "QUALIFIED" : "INELIGIBLE"}
                </span>
              </div>
              <div className="w-full bg-[#DDD5C3] dark:bg-[#2A2E38] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, fourTierRankings.allround.score || 0))}%` }}
                />
              </div>
              <div className="text-[10px] text-[#5C584E] dark:text-[#A8A296] leading-tight truncate" title={fourTierRankings.allround.eligibility_reason}>
                {fourTierRankings.allround.eligible
                  ? "Dual discipline exposure with same-match balance bonus."
                  : fourTierRankings.allround.eligibility_reason}
              </div>
            </div>

            {/* 4. OVERALL */}
            <div className="bg-[#F1EBDD] dark:bg-[#111318] p-4 rounded-xl border border-[#DDD5C3] dark:border-[#2A2E38] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#5C584E] dark:text-[#A8A296] flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-[#FF4B35]" />
                  Overall Score
                </span>
                <span className="text-[10px] font-mono font-bold text-[#FF4B35]">
                  {fourTierRankings.overall.rank ? `#${fourTierRankings.overall.rank} / ${fourTierRankings.overall.rank_of}` : "—"}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="font-mono text-3xl font-extrabold text-[#FF4B35]">
                  {fourTierRankings.overall.score !== null ? fourTierRankings.overall.score.toFixed(1) : "—"}
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full font-mono uppercase font-bold bg-[#FF4B35]/10 text-[#FF4B35] border border-[#FF4B35]/30">
                  {fourTierRankings.overall.path}
                </span>
              </div>
              <div className="w-full bg-[#DDD5C3] dark:bg-[#2A2E38] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#FF4B35] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, fourTierRankings.overall.score || 0))}%` }}
                />
              </div>
              <div className="text-[10px] text-[#5C584E] dark:text-[#A8A296] leading-tight">
                Role-normalized cross-discipline score with Bayesian confidence damping.
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* 100-POINT PLAYER INTELLIGENCE SCORECARD (PIS)                  */}
      {/* ============================================================== */}
      <section className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-2xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DDD5C3] dark:border-[#2A2E38] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF4B35]" />
              <h3 className="font-display text-lg font-bold text-[#111318] dark:text-[#F1EBDD]">
                100-Point Player Intelligence Scorecard (PIS)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-[#FF4B35]/10 text-[#FF4B35] border border-[#FF4B35]/20 font-bold">
                EPL Rank #{pi.epl_rank || "—"} / 73
              </span>
            </div>
            <p className="text-xs text-[#5C584E] dark:text-[#A8A296]">
              Multi-factor 6-over cricket rating model calibrated for small-sample variance. Non-participants in batting or bowling receive 0 penalty.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowFormulaDetails(!showFormulaDetails)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F1EBDD] dark:bg-[#111318] text-[#5C584E] dark:text-[#A8A296] hover:text-[#111318] dark:hover:text-[#F1EBDD] text-xs font-semibold border border-[#DDD5C3] dark:border-[#2A2E38] transition self-start sm:self-auto"
          >
            <Info className="w-3.5 h-3.5 text-[#FF4B35]" />
            <span>{showFormulaDetails ? "Hide Methodology" : "Why this score?"}</span>
            {showFormulaDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* 5-Pillar Score Cards with Visual Micro-Meters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          {/* Batting Intelligence */}
          <div className="bg-[#F1EBDD] dark:bg-[#111318] p-4 rounded-xl border border-[#DDD5C3] dark:border-[#2A2E38] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#5C584E] dark:text-[#A8A296]">
                Batting (BIS)
              </span>
              <Target className="w-3 h-3 text-[#FF4B35]" />
            </div>
            <div className="font-mono text-2xl font-bold text-[#111318] dark:text-[#F1EBDD]">
              {pi.batting_intelligence_score !== null && pi.batting_intelligence_score !== undefined
                ? pi.batting_intelligence_score.toFixed(1)
                : <span className="text-xs text-[#A8A296] font-normal">N/A</span>}
            </div>
            {/* Visual Micro-meter */}
            <div className="w-full bg-[#DDD5C3] dark:bg-[#2A2E38] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#FF4B35] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, pi.batting_intelligence_score || 0))}%` }}
              />
            </div>
            <div className="text-[10px] text-[#5C584E] dark:text-[#A8A296]">Volume &amp; Velocity</div>
          </div>

          {/* Bowling Intelligence */}
          <div className="bg-[#F1EBDD] dark:bg-[#111318] p-4 rounded-xl border border-[#DDD5C3] dark:border-[#2A2E38] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#5C584E] dark:text-[#A8A296]">
                Bowling (BoIS)
              </span>
              <Crosshair className="w-3 h-3 text-[#FF4B35]" />
            </div>
            <div className="font-mono text-2xl font-bold text-[#111318] dark:text-[#F1EBDD]">
              {pi.bowling_intelligence_score !== null && pi.bowling_intelligence_score !== undefined
                ? pi.bowling_intelligence_score.toFixed(1)
                : <span className="text-xs text-[#A8A296] font-normal">N/A</span>}
            </div>
            <div className="w-full bg-[#DDD5C3] dark:bg-[#2A2E38] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#5C584E] dark:bg-[#DDD5C3] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, pi.bowling_intelligence_score || 0))}%` }}
              />
            </div>
            <div className="text-[10px] text-[#5C584E] dark:text-[#A8A296]">Wickets &amp; Economy</div>
          </div>

          {/* All-Rounder Intelligence */}
          <div className="bg-[#F1EBDD] dark:bg-[#111318] p-4 rounded-xl border border-[#DDD5C3] dark:border-[#2A2E38] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#5C584E] dark:text-[#A8A296]">
                All-Round (AIS)
              </span>
              <Zap className="w-3 h-3 text-amber-500" />
            </div>
            <div className="font-mono text-2xl font-bold text-[#111318] dark:text-[#F1EBDD]">
              {pi.all_rounder_intelligence_score?.toFixed(1) || "0.0"}
            </div>
            <div className="w-full bg-[#DDD5C3] dark:bg-[#2A2E38] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, pi.all_rounder_intelligence_score || 0))}%` }}
              />
            </div>
            <div className="text-[10px] text-[#5C584E] dark:text-[#A8A296]">
              {ar.impact_all_rounder_matches || 0} dual games
            </div>
          </div>

          {/* Consistency Intelligence */}
          <div className="bg-[#F1EBDD] dark:bg-[#111318] p-4 rounded-xl border border-[#DDD5C3] dark:border-[#2A2E38] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#5C584E] dark:text-[#A8A296]">
                Consistency (CIS)
              </span>
              <BarChart2 className="w-3 h-3 text-emerald-500" />
            </div>
            <div className="font-mono text-2xl font-bold text-[#111318] dark:text-[#F1EBDD]">
              {pi.consistency_intelligence_score?.toFixed(1) || "50.0"}
            </div>
            <div className="w-full bg-[#DDD5C3] dark:bg-[#2A2E38] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, pi.consistency_intelligence_score || 50))}%` }}
              />
            </div>
            <div className="text-[10px] text-[#5C584E] dark:text-[#A8A296]">Variance Calibration</div>
          </div>

          {/* Match Impact Intelligence */}
          <div className="bg-[#F1EBDD] dark:bg-[#111318] p-4 rounded-xl border border-[#DDD5C3] dark:border-[#2A2E38] space-y-2 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#FF4B35]">
                Match Impact (MIS)
              </span>
              <Trophy className="w-3 h-3 text-[#FF4B35]" />
            </div>
            <div className="font-mono text-2xl font-bold text-[#FF4B35]">
              {pi.match_impact_intelligence_score?.toFixed(1) || "20.0"}
            </div>
            <div className="w-full bg-[#DDD5C3] dark:bg-[#2A2E38] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#FF4B35] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, (pi.match_impact_intelligence_score || 20) * 2.5))}%` }}
              />
            </div>
            <div className="text-[10px] text-[#5C584E] dark:text-[#A8A296]">Milestones &amp; Playoff</div>
          </div>
        </div>

        {/* Mathematical Explanation Drawer */}
        <AnimatePresence>
          {showFormulaDetails && pi.explanations && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-[#F1EBDD] dark:bg-[#111318] p-5 rounded-2xl border border-[#DDD5C3] dark:border-[#2A2E38] space-y-3 text-xs"
            >
              <h4 className="font-display font-bold text-[#FF4B35] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Audited EPL Mathematical Architecture</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] text-[#111318] dark:text-[#F1EBDD]">
                <div className="space-y-1">
                  <strong className="text-[#111318] dark:text-[#F1EBDD]">Batting Formulation (BIS):</strong>
                  <p className="font-mono text-[10px] text-[#5C584E] dark:text-[#A8A296] leading-relaxed">
                    {pi.explanations.batting}
                  </p>
                </div>
                <div className="space-y-1">
                  <strong className="text-[#111318] dark:text-[#F1EBDD]">Bowling Formulation (BoIS):</strong>
                  <p className="font-mono text-[10px] text-[#5C584E] dark:text-[#A8A296] leading-relaxed">
                    {pi.explanations.bowling}
                  </p>
                </div>
                <div className="space-y-1">
                  <strong className="text-[#111318] dark:text-[#F1EBDD]">All-Rounder Balance (AIS):</strong>
                  <p className="font-mono text-[10px] text-[#5C584E] dark:text-[#A8A296] leading-relaxed">
                    {pi.explanations.all_rounder}
                  </p>
                </div>
                <div className="space-y-1">
                  <strong className="text-[#111318] dark:text-[#F1EBDD]">Consistency &amp; Match Impact:</strong>
                  <p className="font-mono text-[10px] text-[#5C584E] dark:text-[#A8A296] leading-relaxed">
                    {pi.explanations.consistency} • {pi.explanations.match_impact}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ============================================================== */}
      {/* TABS NAVIGATION                                                */}
      {/* ============================================================== */}
      <div className="border-b border-[#DDD5C3] dark:border-[#2A2E38] flex flex-wrap gap-2 text-xs font-semibold no-print">
        {[
          { id: "career", label: "Career & Visual Analytics" },
          { id: "situational", label: "Pressure Splits (1st vs Chasing)" },
          { id: "seasons", label: "Season Breakdown" },
          { id: "matches", label: "Match Timeline Log" },
          { id: "auction", label: "Auction Economics & Substitutes" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`relative pb-3 px-3.5 font-semibold transition ${
              activeTab === tab.id
                ? "text-[#FF4B35] font-bold"
                : "text-[#5C584E] dark:text-[#A8A296] hover:text-[#111318] dark:hover:text-[#F1EBDD]"
            }`}
          >
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF4B35]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ============================================================== */}
      {/* TAB CONTENT 1: CAREER & VISUAL ANALYTICS                       */}
      {/* ============================================================== */}
      {(activeTab === "career" || isPrintMode) && (
        <div className="space-y-8">
          {/* Sample Size Warning if Evidence is Limited */}
          {((profile.is_batting_eligible === false && b.innings > 0) || (profile.is_bowling_eligible === false && bw.legal_balls > 0)) && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-300">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Sample Size Safeguard:</strong>{" "}
                  {profile.is_batting_eligible === false && b.innings > 0 && `Batting sample is developing/limited (${b.total_balls || 0} balls faced). `}
                  {profile.is_bowling_eligible === false && bw.legal_balls > 0 && `Bowling sample is limited (${bw.legal_balls || 0} legal balls bowled). `}
                  Rate metrics should be evaluated within the context of demonstrated sample size.
                </span>
              </span>
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 shrink-0 self-start sm:self-auto">
                {profile.confidence_level || "LIMITED"} SAMPLE
              </span>
            </div>
          )}

          {/* ROLE-PRIORITIZED KEY STATS RACK */}
          {isAllRounder ? (
            /* Dual Impact Rack for All-Rounders */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <StatCard
                title="Career Runs"
                value={b.total_runs || 0}
                subtitle={`${b.innings || 0} inn, HS: ${b.highest_score_display || b.highest_score || 0}`}
                icon={<Flame className="w-4 h-4 text-[#FF4B35]" />}
              />
              <StatCard
                title="Strike Rate"
                value={b.strike_rate ? b.strike_rate.toFixed(1) : "0.0"}
                subtitle={`${b.boundary_percentage?.toFixed(1) || "0.0"}% bnd`}
                icon={<TrendingUp className="w-4 h-4 text-[#FF4B35]" />}
              />
              <StatCard
                title="15+ Scores"
                value={b.scores_15_plus || 0}
                subtitle={`${b.pct_15_plus || 0}% inn freq`}
                icon={<Award className="w-4 h-4 text-[#FF4B35]" />}
              />
              <StatCard
                title="Career Wickets"
                value={bw.wickets || 0}
                subtitle={`${bw.overs_display || bw.overs || "0.0"} overs`}
                icon={<Shield className="w-4 h-4 text-emerald-500" />}
              />
              <StatCard
                title="Economy Rate"
                value={bw.legal_balls > 0 ? bw.economy.toFixed(2) : "—"}
                subtitle={`${bw.dot_ball_percentage?.toFixed(1) || "0.0"}% dots`}
                icon={<Crosshair className="w-4 h-4 text-[#FF4B35]" />}
              />
              <StatCard
                title="Multi-Wkts (2+)"
                value={bw.two_plus_wickets || 0}
                subtitle={`${bw.multi_wicket_frequency || 0}% spell freq`}
                icon={<Trophy className="w-4 h-4 text-[#FF4B35]" />}
              />
            </div>
          ) : isBowler ? (
            /* Bowler-Prioritized Rack */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                title="Career Wickets"
                value={bw.wickets || 0}
                subtitle={`${bw.overs_display || bw.overs || "0.0"} overs bowled`}
                icon={<Shield className="w-4 h-4 text-emerald-500" />}
              />
              <StatCard
                title="Bowling Economy"
                value={bw.legal_balls > 0 ? bw.economy.toFixed(2) : "—"}
                subtitle={`${bw.dot_ball_percentage ? bw.dot_ball_percentage.toFixed(1) : "0.0"}% dot balls`}
                icon={<Trophy className="w-4 h-4 text-[#FF4B35]" />}
              />
              <StatCard
                title="Bowling Strike Rate"
                value={bw.bowling_strike_rate ? `${bw.bowling_strike_rate.toFixed(1)} b/w` : "—"}
                subtitle={`Best: ${bw.best_figures || "—"}`}
                icon={<Crosshair className="w-4 h-4 text-[#FF4B35]" />}
              />
              <StatCard
                title="Multi-Wicket Spells"
                value={bw.two_plus_wickets || 0}
                subtitle={`${bw.multi_wicket_frequency || 0}% spell rate`}
                icon={<Award className="w-4 h-4 text-[#FF4B35]" />}
              />
            </div>
          ) : (
            /* Batter-Prioritized Rack */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                title="Career Runs"
                value={b.total_runs || 0}
                subtitle={`${b.innings || 0} inn, HS: ${b.highest_score_display || b.highest_score || 0}`}
                icon={<Flame className="w-4 h-4 text-[#FF4B35]" />}
              />
              <StatCard
                title="Strike Rate"
                value={b.strike_rate ? b.strike_rate.toFixed(1) : "0.0"}
                subtitle={`${b.boundary_percentage ? b.boundary_percentage.toFixed(1) : "0.0"}% boundary rate`}
                icon={<TrendingUp className="w-4 h-4 text-[#FF4B35]" />}
              />
              <StatCard
                title="Batting Average"
                value={b.average_display || b.batting_average?.toFixed(2) || "0.00"}
                subtitle={`${b.runs_per_innings?.toFixed(1) || 0} runs/innings`}
                icon={<Trophy className="w-4 h-4 text-emerald-500" />}
              />
              <StatCard
                title="Balls / Boundary"
                value={b.balls_per_boundary ? `${b.balls_per_boundary.toFixed(1)} b` : "—"}
                subtitle={`${b.fours || 0}x4, ${b.sixes || 0}x6`}
                icon={<Zap className="w-4 h-4 text-[#FF4B35]" />}
              />
            </div>
          )}

          {/* 6-Over Cricket Milestone Rack */}
          <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-2xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm space-y-4 text-[#111318] dark:text-[#F1EBDD]">
            <div className="flex items-center justify-between border-b border-[#DDD5C3] dark:border-[#2A2E38] pb-3">
              <span className="font-display text-base font-bold text-[#111318] dark:text-[#F1EBDD] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#FF4B35]" />
                <span>6-Over Cricket Milestone Frequencies</span>
              </span>
              <span className="text-[10px] font-mono text-[#5C584E] dark:text-[#A8A296]">
                Calibrated against 27 tournament matches
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
              <div className="p-3 rounded-xl bg-[#F1EBDD] dark:bg-[#111318] border border-[#DDD5C3] dark:border-[#2A2E38]">
                <span className="text-[10px] text-[#5C584E] dark:text-[#A8A296] uppercase block font-semibold font-mono">10+ Scores</span>
                <span className="font-mono text-xl font-bold text-[#111318] dark:text-[#F1EBDD]">{b.scores_10_plus || 0}</span>
                <span className="text-[10px] text-[#5C584E] dark:text-[#A8A296] block">{b.pct_10_plus || 0}% inn</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F1EBDD] dark:bg-[#111318] border border-[#DDD5C3] dark:border-[#2A2E38]">
                <span className="text-[10px] text-[#5C584E] dark:text-[#A8A296] uppercase block font-semibold font-mono">15+ Scores</span>
                <span className="font-mono text-xl font-bold text-[#111318] dark:text-[#F1EBDD]">{b.scores_15_plus || 0}</span>
                <span className="text-[10px] text-[#5C584E] dark:text-[#A8A296] block">{b.pct_15_plus || 0}% inn</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F1EBDD] dark:bg-[#111318] border border-[#DDD5C3] dark:border-[#2A2E38]">
                <span className="text-[10px] text-[#5C584E] dark:text-[#A8A296] uppercase block font-semibold font-mono">20+ Scores</span>
                <span className="font-mono text-xl font-bold text-[#FF4B35]">{b.scores_20_plus || 0}</span>
                <span className="text-[10px] text-[#5C584E] dark:text-[#A8A296] block">{b.pct_20_plus || 0}% inn</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F1EBDD] dark:bg-[#111318] border border-[#DDD5C3] dark:border-[#2A2E38]">
                <span className="text-[10px] text-[#5C584E] dark:text-[#A8A296] uppercase block font-semibold font-mono">Multi-Wkts (2+)</span>
                <span className="font-mono text-xl font-bold text-[#111318] dark:text-[#F1EBDD]">{bw.two_plus_wickets || 0}</span>
                <span className="text-[10px] text-[#5C584E] dark:text-[#A8A296] block">{bw.multi_wicket_frequency || 0}% sp</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F1EBDD] dark:bg-[#111318] border border-[#DDD5C3] dark:border-[#2A2E38]">
                <span className="text-[10px] text-[#5C584E] dark:text-[#A8A296] uppercase block font-semibold font-mono">Ducks / Not-Outs</span>
                <span className="font-mono text-xl font-bold text-[#111318] dark:text-[#F1EBDD]">{b.duck_count || 0} / {b.not_outs || 0}</span>
                <span className="text-[10px] text-[#5C584E] dark:text-[#A8A296] block">{b.not_out_percentage || 0}% NO</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F1EBDD] dark:bg-[#111318] border border-[#DDD5C3] dark:border-[#2A2E38]">
                <span className="text-[10px] text-[#5C584E] dark:text-[#A8A296] uppercase block font-semibold font-mono">Explosiveness</span>
                <span className="font-mono text-xl font-bold text-[#FF4B35]">{b.explosiveness_index || 0}</span>
                <span className="text-[10px] text-[#5C584E] dark:text-[#A8A296] block font-mono">Index / 100</span>
              </div>
            </div>
          </div>

          {/* Batting & Bowling Deep Dive Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Batting Metrics Card */}
            <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-2xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm space-y-4 text-[#111318] dark:text-[#F1EBDD]">
              <div className="flex items-center justify-between border-b border-[#DDD5C3] dark:border-[#2A2E38] pb-3">
                <h3 className="font-display text-lg font-bold text-[#111318] dark:text-[#F1EBDD] flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#FF4B35]" />
                  <span>Batting Performance Analytics</span>
                </h3>
                <span className="font-mono text-xs font-bold text-[#FF4B35]">
                  {pi.batting_intelligence_score ? `${pi.batting_intelligence_score.toFixed(1)} / 100` : "N/A"}
                </span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-[#DDD5C3]/40 dark:border-[#2A2E38]/40">
                  <span className="text-[#5C584E] dark:text-[#A8A296]">Batting Average</span>
                  <span className="font-mono font-bold text-[#111318] dark:text-[#F1EBDD]">{b.average_display || b.batting_average?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DDD5C3]/40 dark:border-[#2A2E38]/40">
                  <span className="text-[#5C584E] dark:text-[#A8A296]">Runs Per Innings</span>
                  <span className="font-mono font-bold text-[#111318] dark:text-[#F1EBDD]">{b.runs_per_innings?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DDD5C3]/40 dark:border-[#2A2E38]/40">
                  <span className="text-[#5C584E] dark:text-[#A8A296]">Balls Faced</span>
                  <span className="font-mono font-bold text-[#111318] dark:text-[#F1EBDD]">{b.total_balls} balls</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Dismissals / Not-Outs</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{b.outs} outs / {b.not_outs} NO ({b.not_out_percentage?.toFixed(1)}%)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Fours / Sixes</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{b.fours} 4s / {b.sixes} 6s</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Boundary Runs Share</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{b.boundary_runs_percentage?.toFixed(1)}% of runs</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
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
            <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-2xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm space-y-4 text-[#111318] dark:text-[#F1EBDD]">
              <div className="flex items-center justify-between border-b border-[#DDD5C3] dark:border-[#2A2E38] pb-3">
                <h3 className="font-display text-lg font-bold text-[#111318] dark:text-[#F1EBDD] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span>Bowling Performance Analytics</span>
                </h3>
                <span className="font-mono text-xs font-bold text-[#FF4B35]">
                  {pi.bowling_intelligence_score ? `${pi.bowling_intelligence_score.toFixed(1)} / 100` : "N/A"}
                </span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Runs Conceded / Legal Balls</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{bw.runs_conceded} runs / {bw.legal_balls} balls</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Bowling Average</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{bw.bowling_average ? bw.bowling_average.toFixed(2) : "N/A"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Bowling Strike Rate</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{bw.bowling_strike_rate ? `${bw.bowling_strike_rate.toFixed(1)} balls/wkt` : "N/A"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Wickets Per Match</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{bw.wickets_per_match?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Dot Balls (Frequency)</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{bw.dot_balls} dots ({bw.dot_ball_percentage?.toFixed(1)}%)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Boundary Concession %</span>
                  <span className="font-mono font-bold text-[#101828] dark:text-[#F8FAFC]">{bw.boundary_concession_percentage?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5">
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

          {/* VISUAL ANALYTICS CHARTS */}
          {charts && (
            <div className="space-y-6 pt-4">
              <div className="border-b border-[#E2E8F0] dark:border-[#334155] pb-3">
                <h3 className="font-display text-xl font-bold text-[#101828] dark:text-[#F8FAFC]">
                  Visual Performance Analytics
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Multi-dimensional radar rating, career trajectory, league scatter positioning, scoring consistency &amp; win/loss delta.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PlayerSeasonProgressionChart
                  data={charts.season_progression || []}
                  playerName={profile.name}
                />
                <PlayerRatingRadarChart
                  data={charts.radar || []}
                  series={[{ dataKey: "score", name: profile.name, color: EPL_PALETTE.blue }]}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

      {/* ============================================================== */}
      {/* TAB CONTENT 2: SITUATIONAL PRESSURE SPLITS                     */}
      {/* ============================================================== */}
      {activeTab === "situational" && ss && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#151F32] text-[#101828] dark:text-[#F8FAFC] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] space-y-2 shadow-sm">
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
            <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-2xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm space-y-4 text-[#111318] dark:text-[#F1EBDD]">
              <h4 className="font-display text-base font-bold text-[#111318] dark:text-[#F1EBDD] border-b border-[#DDD5C3] dark:border-[#2A2E38] pb-3">
                Batting: Setting Target vs Run Chase
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-[#F1EBDD] dark:bg-[#111318] p-4 rounded-xl border border-[#DDD5C3] dark:border-[#2A2E38] space-y-2">
                  <span className="font-bold text-[#FF4B35] block font-mono">Batting 1st (Setting)</span>
                  <div className="space-y-1.5 text-[#111318] dark:text-[#F1EBDD]">
                    <div>Runs: <strong className="text-[#111318] dark:text-[#F1EBDD]">{ss.batting_first?.total_runs || 0}</strong> ({ss.batting_first?.innings || 0} inn)</div>
                    <div>SR: <strong className="text-[#111318] dark:text-[#F1EBDD]">{ss.batting_first?.strike_rate?.toFixed(1) || "0.0"}</strong></div>
                    <div>Avg: <strong className="text-[#111318] dark:text-[#F1EBDD]">{ss.batting_first?.average_display || "0.00"}</strong></div>
                    <div>Boundaries: <strong className="text-[#111318] dark:text-[#F1EBDD]">{ss.batting_first?.fours || 0}x4, {ss.batting_first?.sixes || 0}x6</strong></div>
                    <div>HS: <strong className="text-[#111318] dark:text-[#F1EBDD]">{ss.batting_first?.highest_score_display || "0"}</strong></div>
                  </div>
                </div>

                <div className="bg-[#F1EBDD] dark:bg-[#111318] p-4 rounded-xl border border-[#DDD5C3] dark:border-[#2A2E38] space-y-2">
                  <span className="font-bold text-[#5C584E] dark:text-[#A8A296] block font-mono">Chasing (Innings 2)</span>
                  <div className="space-y-1.5 text-[#111318] dark:text-[#F1EBDD]">
                    <div>Runs: <strong className="text-[#111318] dark:text-[#F1EBDD]">{ss.chasing?.total_runs || 0}</strong> ({ss.chasing?.innings || 0} inn)</div>
                    <div>SR: <strong className="text-[#111318] dark:text-[#F1EBDD]">{ss.chasing?.strike_rate?.toFixed(1) || "0.0"}</strong></div>
                    <div>Avg: <strong className="text-[#111318] dark:text-[#F1EBDD]">{ss.chasing?.average_display || "0.00"}</strong></div>
                    <div>Boundaries: <strong className="text-[#111318] dark:text-[#F1EBDD]">{ss.chasing?.fours || 0}x4, {ss.chasing?.sixes || 0}x6</strong></div>
                    <div>HS: <strong className="text-[#111318] dark:text-[#F1EBDD]">{ss.chasing?.highest_score_display || "0"}</strong></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bowling 1st vs Defending */}
            <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-2xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm space-y-4 text-[#111318] dark:text-[#F1EBDD]">
              <h4 className="font-display text-base font-bold text-[#111318] dark:text-[#F1EBDD] border-b border-[#DDD5C3] dark:border-[#2A2E38] pb-3">
                Bowling: First Inning vs Defending Total
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-[#F1EBDD] dark:bg-[#111318] p-4 rounded-xl border border-[#DDD5C3] dark:border-[#2A2E38] space-y-2">
                  <span className="font-bold text-[#FF4B35] block font-mono">Bowling 1st</span>
                  <div className="space-y-1.5 text-[#111318] dark:text-[#F1EBDD]">
                    <div>Overs: <strong className="text-[#111318] dark:text-[#F1EBDD]">{ss.bowling_first?.overs_display || "0.0"}</strong></div>
                    <div>Wickets: <strong className="text-[#111318] dark:text-[#F1EBDD]">{ss.bowling_first?.wickets || 0}</strong></div>
                    <div>Economy: <strong className="text-[#111318] dark:text-[#F1EBDD]">{ss.bowling_first?.economy?.toFixed(2) || "0.00"}</strong></div>
                    <div>Runs: <strong className="text-[#111318] dark:text-[#F1EBDD]">{ss.bowling_first?.runs_conceded || 0}</strong></div>
                    <div>Dots: <strong className="text-[#111318] dark:text-[#F1EBDD]">{ss.bowling_first?.dot_balls || 0} ({ss.bowling_first?.dot_ball_percentage?.toFixed(1) || 0}%)</strong></div>
                  </div>
                </div>

                <div className="bg-[#F1EBDD] dark:bg-[#111318] p-4 rounded-xl border border-[#DDD5C3] dark:border-[#2A2E38] space-y-2">
                  <span className="font-bold text-[#5C584E] dark:text-[#A8A296] block font-mono">Defending Total</span>
                  <div className="space-y-1.5 text-[#111318] dark:text-[#F1EBDD]">
                    <div>Overs: <strong className="text-[#111318] dark:text-[#F1EBDD]">{ss.defending?.overs_display || "0.0"}</strong></div>
                    <div>Wickets: <strong className="text-[#111318] dark:text-[#F1EBDD]">{ss.defending?.wickets || 0}</strong></div>
                    <div>Economy: <strong className="text-[#111318] dark:text-[#F1EBDD]">{ss.defending?.economy?.toFixed(2) || "0.00"}</strong></div>
                    <div>Runs: <strong className="text-[#111318] dark:text-[#F1EBDD]">{ss.defending?.runs_conceded || 0}</strong></div>
                    <div>Dots: <strong className="text-[#111318] dark:text-[#F1EBDD]">{ss.defending?.dot_balls || 0} ({ss.defending?.dot_ball_percentage?.toFixed(1) || 0}%)</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB CONTENT 3: SEASONS BREAKDOWN                               */}
      {/* ============================================================== */}
      {(activeTab === "seasons" || isPrintMode) && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.keys(profile.season_breakdown || {}).map((sKey) => {
              const sData = profile.season_breakdown[sKey];
              const sBat = sData.batting;
              const sBowl = sData.bowling;
              return (
                <div key={sKey} className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-2xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm space-y-4 text-[#111318] dark:text-[#F1EBDD]">
                  <div className="flex items-center justify-between border-b border-[#DDD5C3] dark:border-[#2A2E38] pb-3">
                    <span className="font-display text-xl font-bold text-[#111318] dark:text-[#F1EBDD]">EPL {sKey}</span>
                    <span className="text-xs font-semibold bg-[#FF4B35] text-white px-3 py-0.5 rounded-full font-mono">
                      {sBat.matches || sBowl.matches} matches
                    </span>
                  </div>
                  <div className="space-y-3.5 text-xs">
                    <div>
                      <div className="font-semibold text-[#FF4B35] mb-1.5 uppercase text-[10px] tracking-wider font-mono">Batting Performance</div>
                      <div className="grid grid-cols-2 gap-2 text-[#5C584E] dark:text-[#A8A296]">
                        <div>Runs: <strong className="text-[#111318] dark:text-[#F1EBDD]">{sBat.total_runs}</strong> ({sBat.innings} inn)</div>
                        <div>SR: <strong className="text-[#111318] dark:text-[#F1EBDD]">{sBat.strike_rate?.toFixed(1)}</strong></div>
                        <div>Avg: <strong className="text-[#111318] dark:text-[#F1EBDD]">{sBat.average_display || sBat.batting_average?.toFixed(1)}</strong></div>
                        <div>HS: <strong className="text-[#111318] dark:text-[#F1EBDD]">{sBat.highest_score_display || sBat.highest_score}</strong></div>
                        <div>10+ Scores: <strong className="text-[#111318] dark:text-[#F1EBDD]">{sBat.scores_10_plus || 0}</strong></div>
                        <div>Boundaries: <strong className="text-[#111318] dark:text-[#F1EBDD]">{sBat.boundary_percentage?.toFixed(1)}%</strong></div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-[#DDD5C3] dark:border-[#2A2E38]">
                      <div className="font-semibold text-[#5C584E] dark:text-[#A8A296] mb-1.5 uppercase text-[10px] tracking-wider font-mono">Bowling Performance</div>
                      <div className="grid grid-cols-2 gap-2 text-[#5C584E] dark:text-[#A8A296]">
                        <div>Wickets: <strong className="text-[#111318] dark:text-[#F1EBDD]">{sBowl.wickets}</strong> ({sBowl.overs_display || sBowl.overs} ov)</div>
                        <div>Economy: <strong className="text-[#111318] dark:text-[#F1EBDD]">{sBowl.legal_balls > 0 ? sBowl.economy?.toFixed(2) : "—"}</strong></div>
                        <div>Runs C: <strong className="text-[#111318] dark:text-[#F1EBDD]">{sBowl.runs_conceded}</strong></div>
                        <div>Dots: <strong className="text-[#111318] dark:text-[#F1EBDD]">{sBowl.dot_balls}</strong></div>
                        <div>Best: <strong className="text-[#111318] dark:text-[#F1EBDD]">{sBowl.best_figures || "—"}</strong></div>
                        <div>Multi-Wkts: <strong className="text-[#111318] dark:text-[#F1EBDD]">{sBowl.two_plus_wickets || 0}</strong></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB CONTENT 4: INTERACTIVE MATCH TIMELINE LOG                 */}
      {/* ============================================================== */}
      {activeTab === "matches" && (
        <div className="space-y-4">
          {/* Season Filter Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-[#FAF7F0] dark:bg-[#181A20] p-4 rounded-2xl border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm">
            <div className="text-xs text-[#5C584E] dark:text-[#A8A296]">
              Showing <strong className="text-[#111318] dark:text-[#F1EBDD]">{filteredMatches.length}</strong> of {profile.match_history?.length || 0} regulation innings
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className="text-[#5C584E] dark:text-[#A8A296] mr-1">Filter Season:</span>
              {["ALL", "2023", "2024", "2025"].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setMatchSeasonFilter(yr)}
                  className={`px-3 py-1 rounded-lg transition ${
                    matchSeasonFilter === yr
                      ? "bg-[#FF4B35] text-white"
                      : "bg-[#F1EBDD] dark:bg-[#111318] text-[#5C584E] dark:text-[#A8A296] hover:border-[#FF4B35]"
                  }`}
                >
                  {yr === "ALL" ? "All Seasons" : yr}
                </button>
              ))}
            </div>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-label="Player Match History Log"
            className="table-wrapper bg-[#FAF7F0] dark:bg-[#181A20] rounded-2xl border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm overflow-x-auto text-[#111318] dark:text-[#F1EBDD]"
          >
            <table className="w-full text-left text-xs table-editorial">
              <thead>
                <tr>
                  <th scope="col" className="p-3.5">Season / Stage</th>
                  <th scope="col" className="p-3.5">Opponent</th>
                  <th scope="col" className="p-3.5">Match Role</th>
                  <th scope="col" className="p-3.5">Batting Figures</th>
                  <th scope="col" className="p-3.5">SR</th>
                  <th scope="col" className="p-3.5">Dismissal</th>
                  <th scope="col" className="p-3.5">Bowling Overs</th>
                  <th scope="col" className="p-3.5">Bowling Figures</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatches.map((m: any, idx: number) => {
                  const hasBat = m.batting !== null && m.batting !== undefined;
                  const hasBowl = m.bowling !== null && m.bowling !== undefined;
                  const isHighBat = hasBat && m.batting.runs >= 20;
                  const isHighBowl = hasBowl && m.bowling.wickets >= 2;

                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-blue-50/50 dark:hover:bg-[#1E293B]/60 transition ${
                        isHighBat || isHighBowl ? "bg-blue-50/20 dark:bg-blue-900/10" : ""
                      }`}
                    >
                      <td className="p-3.5 font-medium">
                        <span className="font-bold text-[#101828] dark:text-[#F8FAFC]">EPL {m.season}</span>
                        <span className="text-[10px] text-[#5C584E] dark:text-[#A8A296] block">{m.stage}</span>
                      </td>
                      <td className="p-3.5 font-semibold text-[#111318] dark:text-[#F1EBDD]">{m.opponent}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[#FF4B35]/10 border border-[#FF4B35]/20 text-[#FF4B35] font-semibold">
                          {hasBat && hasBowl ? "Bat & Bowl" : hasBat ? "Batting" : hasBowl ? "Bowling" : "—"}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-[#111318] dark:text-[#F1EBDD]">
                        {hasBat ? (
                          <span className={isHighBat ? "text-[#FF4B35] flex items-center gap-1" : ""}>
                            {m.batting.runs}{m.batting.is_not_out ? "*" : ""} ({m.batting.balls}b)
                            {isHighBat && <span className="text-[9px] bg-[#FF4B35] text-white px-1.5 py-0.2 rounded font-sans">20+</span>}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="p-3.5 font-mono text-[#5C584E] dark:text-[#A8A296]">
                        {hasBat && m.batting.strike_rate ? m.batting.strike_rate.toFixed(1) : "—"}
                      </td>
                      <td className="p-3.5 text-[#5C584E] dark:text-[#A8A296]">
                        {hasBat ? (m.batting.dismissal || "not out") : "—"}
                      </td>
                      <td className="p-3.5 font-mono text-[#111318] dark:text-[#F1EBDD]">
                        {hasBowl ? `${m.bowling.overs} ov` : "—"}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-[#FF4B35]">
                        {hasBowl ? (
                          <span className={isHighBowl ? "text-emerald-500 flex items-center gap-1" : ""}>
                            {m.bowling.wickets}/{m.bowling.runs_conceded}
                            {isHighBowl && <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.2 rounded font-sans">2+ Wkts</span>}
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB CONTENT 5: AUCTION ECONOMICS & SUBSTITUTES                 */}
      {/* ============================================================== */}
      {(activeTab === "auction" || isPrintMode) && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Valuation Card */}
            <div className="bg-[#FAF7F0] dark:bg-[#181A20] text-[#111318] dark:text-[#F1EBDD] rounded-2xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#DDD5C3] dark:border-[#2A2E38] pb-3">
                <span className="text-xs uppercase font-bold text-[#FF4B35] tracking-wider flex items-center gap-1.5 font-mono">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Auction Economics &amp; Purse Strategy</span>
                </span>
                <span className="text-xs font-semibold bg-[#FF4B35] text-white px-3 py-0.5 rounded-full">
                  {v.category}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-xs text-[#5C584E] dark:text-[#A8A296] block">Projected Bidding Valuation</span>
                  <div className="font-mono text-3xl font-black text-[#FF4B35] mt-1">
                    ₹{v.estimated_valuation?.toFixed(1)} <span className="text-sm font-normal text-[#5C584E] dark:text-[#A8A296]">Lakhs</span>
                  </div>
                  <div className="text-xs text-[#5C584E] dark:text-[#A8A296] mt-0.5">
                    Target Bidding Range: <strong className="text-[#111318] dark:text-[#F1EBDD]">{v.valuation_range}</strong> (Base: ₹{v.base_price?.toFixed(1)}L)
                  </div>
                </div>

                <div className="text-xs text-[#5C584E] dark:text-[#A8A296] space-y-2 pt-3 border-t border-[#DDD5C3] dark:border-[#2A2E38]">
                  <div className="flex justify-between">
                    <span className="text-[#5C584E] dark:text-[#A8A296]">Scarcity Multiplier</span>
                    <strong className="text-[#111318] dark:text-[#F1EBDD] font-mono">{v.scarcity_multiplier}x</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5C584E] dark:text-[#A8A296]">Knockout Playoff Premium</span>
                    <strong className="text-[#111318] dark:text-[#F1EBDD] font-mono">+{v.knockout_premium} pts</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5C584E] dark:text-[#A8A296]">Valuation Confidence</span>
                    <strong className="text-[#FF4B35]">{v.valuation_confidence}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths & Tactical Considerations */}
            <div className="bg-[#FAF7F0] dark:bg-[#181A20] text-[#111318] dark:text-[#F1EBDD] rounded-2xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] space-y-4 shadow-sm">
              <h3 className="font-display text-lg font-bold text-[#111318] dark:text-[#F1EBDD] flex items-center gap-2">
                <Target className="w-4 h-4 text-[#FF4B35]" />
                <span>Scouting Strengths &amp; Considerations</span>
              </h3>

              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5 mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verified Core Strengths</span>
                  </span>
                  <ul className="list-disc list-inside space-y-1.5 text-[#5C584E] dark:text-[#A8A296] pl-1">
                    {v.strengths?.map((str: string, i: number) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-[#DDD5C3] dark:border-[#2A2E38]">
                  <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center space-x-1.5 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>Tactical Considerations</span>
                  </span>
                  <ul className="list-disc list-inside space-y-1.5 text-[#5C584E] dark:text-[#A8A296] pl-1">
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
              <div className="border-b border-[#DDD5C3] dark:border-[#2A2E38] pb-2">
                <h3 className="font-display text-xl font-bold text-[#111318] dark:text-[#F1EBDD]">
                  Auction Bidding Substitutes (Similar Profiles)
                </h3>
                <p className="text-xs text-[#5C584E] dark:text-[#A8A296]">
                  If bidding for {profile.name} exceeds purse threshold, these statistical alternatives provide comparable production profiles.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {profile.similar_players.map((sp: any) => (
                  <div key={sp.player_id} className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-2xl p-4 border border-[#DDD5C3] dark:border-[#2A2E38] space-y-2.5 shadow-sm text-[#111318] dark:text-[#F1EBDD]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#111318] dark:text-[#F1EBDD]">{sp.player_name}</span>
                      <RatingBadge score={sp.overall_rating} size="sm" />
                    </div>
                    <div className="text-xs text-[#FF4B35] font-bold font-mono">
                      {sp.similarity_score}% Statistical Match
                    </div>
                    <p className="text-[11px] text-[#5C584E] dark:text-[#A8A296] leading-relaxed">
                      {sp.key_differences.join("; ")}
                    </p>
                    <Link
                      href={`/players/${sp.player_id}`}
                      className="block text-center text-xs font-semibold text-[#111318] dark:text-[#F1EBDD] bg-[#F1EBDD] dark:bg-[#111318] hover:border-[#FF4B35] py-2 rounded-xl border border-[#DDD5C3] dark:border-[#2A2E38] transition"
                    >
                      Compare Dossier →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
