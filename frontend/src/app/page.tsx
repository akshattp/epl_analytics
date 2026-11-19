"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Trophy, Flame, Shield, Activity, ArrowRight,
  Sparkles, DollarSign, Layers, Zap, CheckCircle2,
  Users, Award, TrendingUp, FlaskConical, LayoutDashboard,
  ExternalLink, ChevronRight, BarChart3, Target, Crosshair
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { EplBrandLogo } from "@/components/EplBrandLogo";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { RatingBadge } from "@/components/RatingBadge";

export default function LandingPage() {
  const [overview, setOverview] = useState<any>(null);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0.3]);

  useEffect(() => {
    async function loadLandingData() {
      try {
        const [ovRes, plRes, tmRes, inRes] = await Promise.all([
          fetchApi("/api/overview"),
          fetchApi("/api/players?sort_by=rating&limit=8"),
          fetchApi("/api/teams"),
          fetchApi("/api/insights"),
        ]);
        setOverview(ovRes);
        setTopPlayers(plRes.players || []);
        setTeams(tmRes.teams || []);
        setInsights(inRes.all ? inRes.all.slice(0, 4) : []);
      } catch (err) {
        console.error("Failed loading landing page data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLandingData();
  }, []);

  const totalRuns = overview?.total_runs || 2829;
  const totalWickets = overview?.total_wickets || 186;
  const totalMatches = overview?.total_matches || 27;
  const totalInnings = overview?.total_innings || 56;
  const totalPlayers = overview?.total_players || 73;

  return (
    <div ref={containerRef} className="space-y-24 sm:space-y-36 pb-20 overflow-hidden">
      {/* 
        ========================================================================
        HERO SECTION: THE CINEMATIC INTRO
        ========================================================================
      */}
      <section className="relative min-h-[85vh] flex flex-col justify-between pt-6 sm:pt-12">
        {/* Abstract Kinetic Seam Vector Background */}
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden opacity-30 dark:opacity-40">
          <svg className="w-full h-full" viewBox="0 0 1200 800" fill="none">
            <motion.path
              d="M-100,500 Q400,200 800,450 T1400,100"
              stroke="url(#hero-traj-1)"
              strokeWidth="2.5"
              strokeDasharray="12 8"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
            />
            <motion.path
              d="M-50,650 Q450,350 950,550 T1500,200"
              stroke="url(#hero-traj-2)"
              strokeWidth="1.5"
              strokeDasharray="8 6"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 3, delay: 0.3, ease: "easeInOut" }}
            />
            <defs>
              <linearGradient id="hero-traj-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0891B2" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="hero-traj-2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0891B2" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="space-y-8 max-w-5xl">
          {/* Top Pill: Tournament Status & Provenance */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-blue-50/80 dark:bg-[#151F32]/80 border border-blue-200/80 dark:border-[#334155] backdrop-blur-md text-xs font-mono"
          >
            <span className="w-2 h-2 rounded-full bg-[#2563EB] dark:bg-[#38BDF8] animate-pulse"></span>
            <span className="font-bold text-[#101828] dark:text-[#F8FAFC]">EPL v2.0 SIGNATURE EXPERIENCE</span>
            <span className="text-[#64748B] dark:text-[#94A3B8]">|</span>
            <span className="text-[#2563EB] dark:text-[#38BDF8] font-semibold">27 Historical Scorecards Audited</span>
          </motion.div>

          {/* Oversized Signature Typography Headline */}
          <div className="space-y-2">
            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-black text-5xl sm:text-7xl lg:text-8xl tracking-[-0.03em] leading-[0.92] text-[#101828] dark:text-[#F8FAFC]"
            >
              MORE THAN A GAME.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] via-[#0891B2] to-[#38BDF8] dark:from-[#3B82F6] dark:via-[#22D3EE] dark:to-[#60A5FA]">
                A GAME OF NUMBERS.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="font-sans text-lg sm:text-2xl text-[#64748B] dark:text-[#94A3B8] max-w-2xl font-normal leading-relaxed pt-3"
            >
              The definitive historical intelligence &amp; live auction platform for underarm cricket. 
              73 canonical athletes, 100-point Bayesian evaluations, and atomic auction economics.
            </motion.p>
          </div>

          {/* Action Hub CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            <Link
              href="/dashboard"
              data-cursor="view"
              data-cursor-label="ENTER"
              className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-display font-bold text-base shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02]"
            >
              <LayoutDashboard className="w-5 h-5 text-white/90" />
              <span>Launch Terminal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/auction"
              data-cursor="view"
              data-cursor-label="AUCTION"
              className="inline-flex items-center gap-2.5 px-6 py-4 rounded-xl bg-white dark:bg-[#151F32] border border-[#E2E8F0] dark:border-[#334155] text-[#101828] dark:text-[#F8FAFC] font-display font-bold text-base hover:bg-slate-50 dark:hover:bg-[#1E293B] shadow-sm transition-all duration-300 hover:border-[#2563EB]"
            >
              <DollarSign className="w-5 h-5 text-[#2563EB] dark:text-[#38BDF8]" />
              <span>Live Auction Room</span>
            </Link>

            <Link
              href="/players"
              className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] hover:text-[#2563EB] dark:hover:text-[#38BDF8] underline decoration-blue-500/40 underline-offset-4 px-2 py-1 transition-colors"
            >
              Explore 73 Athlete Dossiers →
            </Link>
          </motion.div>
        </motion.div>

        {/* Real Historical Telemetry Strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-12 sm:mt-16 pt-8 border-t border-[#E2E8F0] dark:border-[#334155] grid grid-cols-2 sm:grid-cols-5 gap-6"
        >
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] dark:text-[#94A3B8] block">Verified Matches</span>
            <div className="font-display text-3xl sm:text-4xl font-extrabold text-[#101828] dark:text-[#F8FAFC] mt-0.5">
              <AnimatedCounter value={totalMatches} />
            </div>
            <span className="text-[11px] font-mono text-[#2563EB] dark:text-[#38BDF8]">100% Extracted</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] dark:text-[#94A3B8] block">Audited Innings</span>
            <div className="font-display text-3xl sm:text-4xl font-extrabold text-[#101828] dark:text-[#F8FAFC] mt-0.5">
              <AnimatedCounter value={totalInnings} />
            </div>
            <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">Incl. Super Overs</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] dark:text-[#94A3B8] block">Canonical Players</span>
            <div className="font-display text-3xl sm:text-4xl font-extrabold text-[#101828] dark:text-[#F8FAFC] mt-0.5">
              <AnimatedCounter value={totalPlayers} />
            </div>
            <span className="text-[11px] font-mono text-[#0891B2] dark:text-[#22D3EE]">Disambiguated</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] dark:text-[#94A3B8] block">Tournament Runs</span>
            <div className="font-display text-3xl sm:text-4xl font-extrabold text-[#2563EB] dark:text-[#3B82F6] mt-0.5">
              <AnimatedCounter value={totalRuns} />
            </div>
            <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">3 Tournament Seasons</span>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] dark:text-[#94A3B8] block">Wickets Fallen</span>
            <div className="font-display text-3xl sm:text-4xl font-extrabold text-[#0891B2] dark:text-[#22D3EE] mt-0.5">
              <AnimatedCounter value={totalWickets} />
            </div>
            <span className="text-[11px] font-mono text-[#2563EB] dark:text-[#38BDF8]">Legal Deliveries Only</span>
          </div>
        </motion.div>
      </section>

      {/* 
        ========================================================================
        SECTION 1: THE EPL IDENTITY & COMPETITIVE GEOMETRY
        ========================================================================
      */}
      <section className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E2E8F0] dark:border-[#334155] pb-8">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs uppercase font-mono font-bold tracking-widest text-[#2563EB] dark:text-[#38BDF8]">
              01 • THE COMPETITIVE ARCHITECTURE
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-[#101828] dark:text-[#F8FAFC] tracking-tight">
              WHY 6-OVER CRICKET DEMANDS EXTREME PRECISION.
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              In a 36-ball innings, every legal delivery is high-leverage. Traditional averages fail in this format; statistical survival requires velocity, restrictive suppression, and situational execution.
            </p>
          </div>
          <div className="shrink-0">
            <EplBrandLogo variant="monogram" size="lg" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: 100-Point PIS */}
          <div className="bg-white dark:bg-[#151F32] rounded-2xl p-8 border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-4 hover:border-[#2563EB] transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-[#0B1120] border border-blue-200 dark:border-blue-900 flex items-center justify-center text-[#2563EB] dark:text-[#38BDF8] group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-xl text-[#101828] dark:text-[#F8FAFC]">
              100-Point Bayesian Scorecard (PIS)
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              Calibrated specifically for 6-over underarm geometry. Incorporates volume, velocity, dot-ball suppression, consistency variance, and knockout playoff leverage. Pure specialists are never penalized for missing disciplines.
            </p>
            <div className="pt-2 text-xs font-mono font-semibold text-[#2563EB] dark:text-[#38BDF8] flex items-center gap-1">
              <span>Audit Methodology</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2: Market Economics */}
          <div className="bg-white dark:bg-[#151F32] rounded-2xl p-8 border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-4 hover:border-[#2563EB] transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-[#0B1120] border border-cyan-200 dark:border-cyan-900 flex items-center justify-center text-[#0891B2] dark:text-[#22D3EE] group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-xl text-[#101828] dark:text-[#F8FAFC]">
              Machine Bidding Economics
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              Every player is priced via a calibrated valuation model. Calculates dynamic scarcity multipliers (e.g. 1.25x for lethal death bowlers) and knockout playoff premiums to empower franchise owners at the auction podium.
            </p>
            <div className="pt-2 text-xs font-mono font-semibold text-[#0891B2] dark:text-[#22D3EE] flex items-center gap-1">
              <span>View Valuations</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3: Situational Splits */}
          <div className="bg-white dark:bg-[#151F32] rounded-2xl p-8 border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-4 hover:border-[#2563EB] transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-[#0B1120] border border-purple-200 dark:border-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <Crosshair className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-xl text-[#101828] dark:text-[#F8FAFC]">
              Micro-Situational Splits
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              Dissects execution under opposing match scripts: setting targets (Innings 1) vs chasing totals (Innings 2), alongside bowling first vs defending totals under severe scoreboard pressure.
            </p>
            <div className="pt-2 text-xs font-mono font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <span>Explore Splits</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        SECTION 2: THE MARQUEE PERFORMERS (SIGNATURE DOSSIER SPOTLIGHT)
        ========================================================================
      */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E8F0] dark:border-[#334155] pb-6">
          <div>
            <span className="text-xs uppercase font-mono font-bold tracking-widest text-[#2563EB] dark:text-[#38BDF8]">
              02 • THE ATHLETES
            </span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-[#101828] dark:text-[#F8FAFC] tracking-tight mt-1">
              LEAGUE PROFILES &amp; HERO PERFORMANCE DOSSIERS
            </h2>
          </div>
          <Link
            href="/players"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] dark:text-[#38BDF8] hover:underline"
          >
            <span>All 73 Canonical Athletes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Asymmetrical Athlete Roster Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {topPlayers.slice(0, 4).map((p, idx) => (
            <Link
              key={p.player_id}
              href={`/players/${p.player_id}`}
              data-cursor="view"
              data-cursor-label="PROFILE"
              className="group relative bg-white dark:bg-[#151F32] rounded-2xl p-6 border border-[#E2E8F0] dark:border-[#334155] shadow-sm hover:border-[#2563EB] dark:hover:border-[#38BDF8] transition-all duration-300 flex flex-col justify-between space-y-6"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold text-[#2563EB] dark:text-[#38BDF8] bg-blue-50 dark:bg-[#0B1120] px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-[#334155]">
                    {p.player_id}
                  </span>
                  <RatingBadge score={p.ratings?.overall_rating || 75} size="sm" />
                </div>

                <div className="mt-4">
                  <h3 className="font-display font-black text-2xl text-[#101828] dark:text-[#F8FAFC] group-hover:text-[#2563EB] dark:group-hover:text-[#38BDF8] transition-colors">
                    {p.name}
                  </h3>
                  <span className="text-xs text-[#64748B] dark:text-[#94A3B8] font-semibold uppercase tracking-wider block mt-0.5">
                    {p.primary_role} • {p.batting_hand}
                  </span>
                </div>
              </div>

              {/* Quick Athlete Snapshot Metrics */}
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-[#E2E8F0] dark:border-[#334155] text-xs">
                <div className="bg-[#F8FAFC] dark:bg-[#0B1120] p-2.5 rounded-lg border border-[#E2E8F0] dark:border-[#1E293B]">
                  <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block uppercase">Runs</span>
                  <span className="font-mono font-bold text-base text-[#101828] dark:text-[#F8FAFC]">
                    {p.career_batting?.total_runs || 0}
                  </span>
                  <span className="text-[9px] text-[#64748B] dark:text-[#94A3B8] block">SR: {p.career_batting?.strike_rate?.toFixed(1) || 0}</span>
                </div>

                <div className="bg-[#F8FAFC] dark:bg-[#0B1120] p-2.5 rounded-lg border border-[#E2E8F0] dark:border-[#1E293B]">
                  <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block uppercase">Wickets</span>
                  <span className="font-mono font-bold text-base text-[#2563EB] dark:text-[#38BDF8]">
                    {p.career_bowling?.wickets || 0}
                  </span>
                  <span className="text-[9px] text-[#64748B] dark:text-[#94A3B8] block">Econ: {p.career_bowling?.economy?.toFixed(2) || "—"}</span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-xs font-semibold text-[#2563EB] dark:text-[#38BDF8]">
                <span>Inspect Dossier</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 
        ========================================================================
        SECTION 3: THE ANALYTICS ENGINES
        ========================================================================
      */}
      <section className="bg-white dark:bg-[#151F32] rounded-3xl p-8 sm:p-12 border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2E8F0] dark:border-[#334155] pb-6">
          <div>
            <span className="text-xs uppercase font-mono font-bold tracking-widest text-[#2563EB] dark:text-[#38BDF8]">
              03 • DATA INTELLIGENCE
            </span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-[#101828] dark:text-[#F8FAFC] tracking-tight mt-1">
              ANALYTICS ENGINES &amp; EXPLORATION
            </h2>
          </div>
          <Link
            href="/analytics/advanced"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] dark:text-[#38BDF8] hover:underline"
          >
            <span>Launch Advanced Suite</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/analytics/batting"
            className="p-6 rounded-2xl bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#1E293B] space-y-3 hover:border-[#2563EB] transition-colors group"
          >
            <div className="flex items-center justify-between">
              <Flame className="w-5 h-5 text-[#2563EB] dark:text-[#38BDF8]" />
              <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]">LEADERBOARDS</span>
            </div>
            <h4 className="font-display font-bold text-lg text-[#101828] dark:text-[#F8FAFC] group-hover:text-[#2563EB] transition-colors">
              Batting Velocity &amp; Boundaries
            </h4>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              Strike rate distributions, boundary percentages, and milestone frequencies (10+, 15+, 20+ runs) across 56 innings.
            </p>
          </Link>

          <Link
            href="/analytics/bowling"
            className="p-6 rounded-2xl bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#1E293B] space-y-3 hover:border-[#2563EB] transition-colors group"
          >
            <div className="flex items-center justify-between">
              <Shield className="w-5 h-5 text-[#0891B2] dark:text-[#22D3EE]" />
              <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]">SUPPRESSION</span>
            </div>
            <h4 className="font-display font-bold text-lg text-[#101828] dark:text-[#F8FAFC] group-hover:text-[#0891B2] transition-colors">
              Bowling Economy &amp; Dot Balls
            </h4>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              Legal-ball verified economy rates, dot-ball frequencies, and multi-wicket spell logs across tournament campaigns.
            </p>
          </Link>

          <Link
            href="/intelligence-lab"
            className="p-6 rounded-2xl bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#E2E8F0] dark:border-[#1E293B] space-y-3 hover:border-[#2563EB] transition-colors group"
          >
            <div className="flex items-center justify-between">
              <FlaskConical className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]">RESEARCH LAB</span>
            </div>
            <h4 className="font-display font-bold text-lg text-[#101828] dark:text-[#F8FAFC] group-hover:text-purple-600 transition-colors">
              2/3-Player Synergy Combinations
            </h4>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              Empirical hypothesis testing evaluating team win percentage when specific partnerships play together vs apart.
            </p>
          </Link>
        </div>
      </section>

      {/* 
        ========================================================================
        SECTION 4: THE SIX FRANCHISES
        ========================================================================
      */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E8F0] dark:border-[#334155] pb-6">
          <div>
            <span className="text-xs uppercase font-mono font-bold tracking-widest text-[#2563EB] dark:text-[#38BDF8]">
              04 • THE FRANCHISES
            </span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-[#101828] dark:text-[#F8FAFC] tracking-tight mt-1">
              SIX TEAMS. THREE EDITIONS. UNRELENTING PARITY.
            </h2>
          </div>
          <Link
            href="/teams"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] dark:text-[#38BDF8] hover:underline"
          >
            <span>Franchise Standings Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((t, idx) => (
            <div
              key={t.team_name}
              className="bg-white dark:bg-[#151F32] rounded-2xl p-6 border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-4 hover:border-[#2563EB] transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#2563EB] dark:text-[#38BDF8]">
                  FRANCHISE #{idx + 1}
                </span>
                <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                  t.net_run_rate >= 0 ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                }`}>
                  NRR: {t.net_run_rate > 0 ? `+${Number(t.net_run_rate).toFixed(2)}` : Number(t.net_run_rate).toFixed(2)}
                </span>
              </div>

              <div>
                <h4 className="font-display font-extrabold text-xl text-[#101828] dark:text-[#F8FAFC]">
                  {t.team_name}
                </h4>
                <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  {t.matches_played} matches played • {t.matches_won} wins
                </span>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#334155] flex justify-between items-center text-xs">
                <span className="text-[#64748B] dark:text-[#94A3B8]">Historical Win Rate:</span>
                <span className="font-mono font-bold text-base text-[#101828] dark:text-[#F8FAFC]">
                  {Number(t.win_percentage || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 
        ========================================================================
        SECTION 5: THE LIVE AUCTION ROOM
        ========================================================================
      */}
      <section className="bg-gradient-to-br from-blue-900/10 via-[#151F32] to-[#0B1120] text-white rounded-3xl p-8 sm:p-14 border border-blue-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-3xl rounded-full pointer-events-none"></div>

        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-cyan-300 text-xs font-mono font-semibold">
            <DollarSign className="w-3.5 h-3.5" />
            <span>REAL-TIME WEBSOCKET AUCTION ENGINE</span>
          </div>

          <h2 className="font-display font-black text-4xl sm:text-6xl tracking-tight leading-[0.95]">
            HIGH-STAKES FRANCHISE BIDDING.
          </h2>

          <p className="font-sans text-sm sm:text-base text-slate-300 leading-relaxed">
            The EPL Auction Suite features authenticated owner access, ₹100.0L team purse caps, atomic reserve calculations, and zero-mutation AI mock simulation sandboxes.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/auction"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-display font-bold text-sm shadow-lg transition-transform hover:scale-105"
            >
              <span>Enter Live Bidding Room</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/auction?tab=setup"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-display font-semibold text-sm transition-colors"
            >
              <span>Setup Wizard</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        SECTION 6: FINAL SIGNATURE CALL TO ACTION
        ========================================================================
      */}
      <section className="text-center space-y-6 max-w-4xl mx-auto py-8">
        <EplBrandLogo variant="monogram" size="xl" className="mx-auto" />

        <h2 className="font-display font-black text-4xl sm:text-6xl text-[#101828] dark:text-[#F8FAFC] tracking-tight">
          READY TO ANALYZE EVERY BALL?
        </h2>

        <p className="font-sans text-base sm:text-lg text-[#64748B] dark:text-[#94A3B8] max-w-xl mx-auto">
          Access the complete historical registry, head-to-head radar comparisons, similar player cohorts, and official CricHeroes verification dossiers.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="px-8 py-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-display font-bold text-base shadow-lg shadow-blue-500/25 transition-all hover:scale-105"
          >
            Open Analytics Terminal
          </Link>
          <Link
            href="/players"
            className="px-8 py-4 rounded-xl bg-white dark:bg-[#151F32] border border-[#E2E8F0] dark:border-[#334155] text-[#101828] dark:text-[#F8FAFC] font-display font-bold text-base hover:bg-slate-50 dark:hover:bg-[#1E293B] shadow-sm transition-all"
          >
            Browse All Players
          </Link>
        </div>
      </section>
    </div>
  );
}
