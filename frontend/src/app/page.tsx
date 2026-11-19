"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Trophy, Flame, Shield, Activity, ArrowRight,
  Sparkles, DollarSign, Layers, Zap, CheckCircle2,
  Users, Award, TrendingUp, FlaskConical, LayoutDashboard,
  ExternalLink, ChevronRight, BarChart3, Target, Crosshair,
  Sliders, Star, ArrowUpRight, Lock, Database
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { EplBrandLogo } from "@/components/EplBrandLogo";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { RatingBadge } from "@/components/RatingBadge";
import { ParallelScrollColumns } from "@/components/ParallelScrollColumns";
import { HorizontalScrollDossiers } from "@/components/HorizontalScrollDossiers";

// Helper to compute initials from name
function getInitials(name: string): string {
  if (!name) return "EP";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function LandingPage() {
  const [overview, setOverview] = useState<any>(null);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [auctionTeams, setAuctionTeams] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Parallel Scrolling & Parallax Hooks
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Parallax Layer Transforms
  const heroY = useTransform(scrollYProgress, [0, 0.18], [0, -60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0.3]);
  const trajectoryY1 = useTransform(scrollYProgress, [0, 1], [0, 240]);
  const trajectoryY2 = useTransform(scrollYProgress, [0, 1], [0, -180]);
  const telemetryFloatY = useTransform(scrollYProgress, [0.05, 0.3], [20, -20]);

  useEffect(() => {
    async function loadLandingData() {
      try {
        const [ovRes, plRes, tmRes, aucTmRes, inRes] = await Promise.all([
          fetchApi("/api/overview"),
          fetchApi("/api/players?sort_by=rating&limit=8"),
          fetchApi("/api/teams"),
          fetchApi("/api/auction/teams").catch(() => null),
          fetchApi("/api/insights"),
        ]);
        setOverview(ovRes);
        setTopPlayers(plRes.players || []);
        setTeams(tmRes.teams || []);
        setAuctionTeams(aucTmRes?.teams || []);
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

  // Official 6 Franchise Master Data
  const franchiseList = [
    {
      name: "Exotica Warriors",
      owner: "Aryan Shetty",
      tagline: "2025 Reigning Champions",
      stats: "4 Wins • 0 Losses • 100% Win Rate",
      nrr: "+1.05 NRR",
      color: "from-blue-600 to-indigo-900",
      accent: "text-blue-500",
      border: "border-blue-500/40",
      runs: 190,
      wkts: 15,
    },
    {
      name: "Victory Vipers",
      owner: "Sandeep Dalvi",
      tagline: "High-Octane Strike Unit",
      stats: "2 Wins • 2 Losses • 50% Win Rate",
      nrr: "+0.43 NRR",
      color: "from-emerald-600 to-teal-950",
      accent: "text-emerald-500",
      border: "border-emerald-500/40",
      runs: 165,
      wkts: 10,
    },
    {
      name: "The Ultimates",
      owner: "Anurag Jain",
      tagline: "Calculated Boundary Anchors",
      stats: "1 Win • 2 Losses • 33% Win Rate",
      nrr: "+0.06 NRR",
      color: "from-purple-600 to-slate-950",
      accent: "text-purple-400",
      border: "border-purple-500/40",
      runs: 110,
      wkts: 14,
    },
    {
      name: "Exotica Panthers",
      owner: "Ashish Chhawchharia",
      tagline: "Disciplined Restrictive Pace",
      stats: "1 Win • 1 Loss • 50% Win Rate",
      nrr: "-0.34 NRR",
      color: "from-amber-600 to-stone-950",
      accent: "text-amber-500",
      border: "border-amber-500/40",
      runs: 69,
      wkts: 10,
    },
    {
      name: "Exotica Lions Pride",
      owner: "Yash Patel",
      tagline: "Fierce Knockout Contenders",
      stats: "1 Win • 2 Losses • 33% Win Rate",
      nrr: "-0.75 NRR",
      color: "from-cyan-600 to-sky-950",
      accent: "text-cyan-400",
      border: "border-cyan-500/40",
      runs: 99,
      wkts: 13,
    },
    {
      name: "Exotica Living Legenda",
      owner: "Vijay Limbachiya",
      tagline: "Veteran Squad Depth",
      stats: "0 Wins • 2 Losses • Rebuilding",
      nrr: "-1.33 NRR",
      color: "from-rose-600 to-neutral-950",
      accent: "text-rose-500",
      border: "border-rose-500/40",
      runs: 90,
      wkts: 3,
    },
  ];

  return (
    <div ref={containerRef} className="pb-24 overflow-hidden relative">
      {/* 
        ========================================================================
        MULTI-LAYER PARALLAX KINETIC CANVAS
        ========================================================================
      */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden opacity-30 dark:opacity-40">
        <motion.svg
          style={{ y: trajectoryY1 }}
          className="w-full h-full"
          viewBox="0 0 1440 1800"
          fill="none"
        >
          <motion.path
            d="M-100,320 Q500,120 900,420 T1600,180"
            stroke="url(#traj-grad-1)"
            strokeWidth="3"
            strokeDasharray="16 10"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.8, ease: "easeInOut" }}
          />
          <motion.path
            d="M100,900 Q650,600 1100,980 T1700,750"
            stroke="url(#traj-grad-2)"
            strokeWidth="2"
            strokeDasharray="12 8"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3.4, delay: 0.2, ease: "easeInOut" }}
          />
          <defs>
            <linearGradient id="traj-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.05" />
              <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0891B2" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="traj-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0891B2" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </motion.svg>
      </div>

      <div className="space-y-20 sm:space-y-32">
        {/* 
          ========================================================================
          HERO STAGE: ASYMMETRIC TWO-PART ARCHITECTURE (FIXES B1, B2, B3)
          ========================================================================
          - Defect B1 Eliminated: Orphaned blue pulsing dot replaced with crisp icon badge.
          - Defect B2 Eliminated: min-h-[85vh] and justify-between removed, tight top padding (pt-0).
          - Feature B3 Delivered: 12-column asymmetric split (7 cols Left, 5 cols Right Telemetry HUD).
        */}
        <section className="relative pt-0 space-y-10">
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
        >
          {/* LEFT COLUMN: Editorial Typography & Action Hub (7 Cols) */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            {/* Top Telemetry Header - Crisp Badge (No orphaned pulsing circle) */}
            <div className="flex flex-wrap items-center gap-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 dark:bg-[#151F32]/90 border border-blue-200/80 dark:border-[#334155] backdrop-blur-md text-xs font-mono"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#38BDF8]" />
                <span className="font-bold text-[#101828] dark:text-[#F8FAFC]">EPL CRICKET INTELLIGENCE</span>
                <span className="text-[#64748B] dark:text-[#94A3B8]">|</span>
                <span className="text-[#2563EB] dark:text-[#38BDF8] font-semibold">27 Historical Scorecards Audited</span>
              </motion.div>

              <span className="text-[11px] font-mono uppercase tracking-widest text-[#64748B] dark:text-[#94A3B8] hidden sm:inline-block">
                100-Point Bayesian Model
              </span>
            </div>

            {/* Oversized Signature Typography Headline */}
            <div className="space-y-3">
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="font-display font-black text-5xl sm:text-7xl lg:text-8xl tracking-[-0.035em] leading-[0.92] text-[#101828] dark:text-[#F8FAFC]"
              >
                MORE THAN A GAME.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] via-[#0891B2] to-[#38BDF8] dark:from-[#3B82F6] dark:via-[#22D3EE] dark:to-[#60A5FA]">
                  A GAME OF NUMBERS.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="font-sans text-base sm:text-xl text-[#64748B] dark:text-[#94A3B8] max-w-2xl font-normal leading-relaxed pt-1"
              >
                The definitive cricket intelligence platform for 6-over competition. 73 canonical athletes, situational pressure splits, and atomic auction economics.
              </motion.p>
            </div>

            {/* Action Hub CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center gap-4 pt-1"
            >
              <Link
                href="/dashboard"
                data-cursor="view"
                data-cursor-label="ENTER"
                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-display font-bold text-base shadow-xl shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02]"
              >
                <LayoutDashboard className="w-5 h-5 text-white/90" />
                <span>Launch Terminal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/auction"
                data-cursor="view"
                data-cursor-label="AUCTION"
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl bg-white dark:bg-[#151F32] border border-[#E2E8F0] dark:border-[#334155] text-[#101828] dark:text-[#F8FAFC] font-display font-bold text-base hover:bg-slate-50 dark:hover:bg-[#1E293B] shadow-sm transition-all duration-300 hover:border-[#2563EB]"
              >
                <DollarSign className="w-5 h-5 text-[#2563EB] dark:text-[#38BDF8]" />
                <span>Live Auction Room</span>
              </Link>

              <Link
                href="/players"
                className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] hover:text-[#2563EB] dark:hover:text-[#38BDF8] underline decoration-blue-500/40 underline-offset-4 px-2 py-2 transition-colors"
              >
                Explore 73 Athlete Dossiers →
              </Link>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: Asymmetric Cricket Telemetry HUD & Visual Composition (5 Cols) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.85, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative"
          >
            {/* Visual Telemetry Cockpit Card */}
            <div className="relative bg-gradient-to-br from-slate-900 via-[#0B1528] to-slate-950 text-white rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl overflow-hidden space-y-6">
              {/* Cricket Ball Vector Seam Glow Effect */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* Status Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-300">
                    MATCH TELEMETRY HUD
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  6 TEAMS LOCKED
                </span>
              </div>

              {/* Dominant Highlight: All-Time Record Score */}
              <div className="relative z-10 space-y-2 p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>HIGHEST INNINGS TOTAL</span>
                  <span className="text-amber-400 font-bold">2025 FINALS</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="font-display font-black text-4xl sm:text-5xl tracking-tight text-white">
                    62<span className="text-2xl text-slate-400 font-medium">/2</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-cyan-300 block">10.33 RPO</span>
                    <span className="text-[10px] text-slate-400 font-sans">Exotica Warriors</span>
                  </div>
                </div>
              </div>

              {/* Dual Telemetry Metric Tiles */}
              <div className="grid grid-cols-2 gap-3 relative z-10 text-xs font-mono">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Run Leader</span>
                  </div>
                  <div className="font-display font-bold text-xl text-white">
                    138 <span className="text-xs text-slate-400 font-sans">Runs</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans truncate">
                    Sagar Kapadia • 17 Boundaries
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Best Economy</span>
                  </div>
                  <div className="font-display font-bold text-xl text-cyan-300">
                    3.57 <span className="text-xs text-slate-400 font-sans">Econ</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans truncate">
                    Aarya Shah • 14 Overs
                  </div>
                </div>
              </div>

              {/* Bottom Concurrency Bar */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs relative z-10 font-mono">
                <span className="text-slate-400 text-[11px]">Purse Cap: ₹100.0L Hard Ceiling</span>
                <span className="text-emerald-400 text-[11px] font-semibold">Atomic Concurrency</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Real Ground-Truth Telemetry Counter Strip */}
        <motion.div
          style={{ y: telemetryFloatY }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.4 }}
          className="pt-8 border-t border-[#E2E8F0] dark:border-[#334155] grid grid-cols-2 sm:grid-cols-5 gap-6 sm:gap-8"
        >
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] dark:text-[#94A3B8] block">
              Verified Matches
            </span>
            <div className="font-display text-3xl sm:text-4xl font-extrabold text-[#101828] dark:text-[#F8FAFC] mt-0.5">
              <AnimatedCounter value={totalMatches} />
            </div>
            <span className="text-[11px] font-mono text-[#2563EB] dark:text-[#38BDF8]">100% Extracted</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] dark:text-[#94A3B8] block">
              Audited Innings
            </span>
            <div className="font-display text-3xl sm:text-4xl font-extrabold text-[#101828] dark:text-[#F8FAFC] mt-0.5">
              <AnimatedCounter value={totalInnings} />
            </div>
            <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">Incl. Super Overs</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] dark:text-[#94A3B8] block">
              Canonical Players
            </span>
            <div className="font-display text-3xl sm:text-4xl font-extrabold text-[#101828] dark:text-[#F8FAFC] mt-0.5">
              <AnimatedCounter value={totalPlayers} />
            </div>
            <span className="text-[11px] font-mono text-[#0891B2] dark:text-[#22D3EE]">Disambiguated</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] dark:text-[#94A3B8] block">
              Tournament Runs
            </span>
            <div className="font-display text-3xl sm:text-4xl font-extrabold text-[#2563EB] dark:text-[#3B82F6] mt-0.5">
              <AnimatedCounter value={totalRuns} />
            </div>
            <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">3 Seasons (2023–2025)</span>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] dark:text-[#94A3B8] block">
              Wickets Fallen
            </span>
            <div className="font-display text-3xl sm:text-4xl font-extrabold text-[#0891B2] dark:text-[#22D3EE] mt-0.5">
              <AnimatedCounter value={totalWickets} />
            </div>
            <span className="text-[11px] font-mono text-[#2563EB] dark:text-[#38BDF8]">Legal Deliveries Only</span>
          </div>
        </motion.div>
      </section>

      {/* 
        ========================================================================
        SECTION 1: THE COMPETITIVE ARCHITECTURE (ASYMMETRIC EDITORIAL OVERHAUL)
        ========================================================================
      */}
      <section className="space-y-12">
        <div className="border-b border-[#E2E8F0] dark:border-[#334155] pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs uppercase font-mono font-bold tracking-widest text-[#2563EB] dark:text-[#38BDF8]">
              01 • THE COMPETITIVE ARCHITECTURE
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-[#101828] dark:text-[#F8FAFC] tracking-tight">
              WHY 6-OVER CRICKET DEMANDS EXTREME PRECISION.
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              In a 36-ball innings, traditional batting anchors bleed tournament equity. Statistical survival requires explosive velocity, restrictive dot-ball suppression, and situational composure.
            </p>
          </div>
          <div className="shrink-0 hidden md:block">
            <EplBrandLogo variant="monogram" size="lg" />
          </div>
        </div>

        {/* Asymmetrical Split-Screen Showcase with Sticky Narrative Anchor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Sticky Editorial Panel - 5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
            <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 text-white rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
                    Format Specification
                  </span>
                  <span className="text-xs font-mono px-3 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                    6 Overs • 36 Balls
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="font-display font-black text-6xl tracking-tight text-white">
                    36
                  </div>
                  <div className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    Legal Deliveries Per Innings
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed pt-1">
                    Every dot ball consumes 2.77% of a team's total offensive capacity. Conventional test or ODI averages are statistically irrelevant; the game belongs to velocity specialists.
                  </p>
                </div>

                {/* Micro Metric Callout Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Purse Cap</span>
                    <span className="font-mono text-xl font-bold text-white">₹100.0L</span>
                    <span className="text-[10px] text-slate-400 block">Hard squad ceiling</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Squad Limit</span>
                    <span className="font-mono text-xl font-bold text-cyan-300">8 Players</span>
                    <span className="text-[10px] text-slate-400 block">Max franchise roster</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <span>Inspect Complete Format Rules</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Sub-Card: 100-Point PIS Mathematical Foundation */}
            <div className="bg-white dark:bg-[#151F32] rounded-3xl p-6 border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-3">
              <div className="flex items-center gap-2.5 text-[#2563EB] dark:text-[#38BDF8]">
                <Target className="w-5 h-5" />
                <h4 className="font-display font-bold text-base text-[#101828] dark:text-[#F8FAFC]">
                  100-Point Bayesian Scorecard (PIS)
                </h4>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                Calibrated multi-discipline intelligence measuring volume, boundary percentage, dot-ball suppression, and playoff leverage. Pure specialists are never penalized for missing disciplines.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive 6-Franchise Competition Grid (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h3 className="font-display font-bold text-xl text-[#101828] dark:text-[#F8FAFC]">
                  The Six Competing Franchises
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Verified records, franchise ownership, and net run rate telemetry.
                </p>
              </div>
              <span className="text-xs font-mono text-[#2563EB] dark:text-[#38BDF8] font-semibold">
                6 Franchises Registered
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {franchiseList.map((team, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#151F32] rounded-2xl p-5 border border-[#E2E8F0] dark:border-[#334155] shadow-sm hover:border-[#2563EB] dark:hover:border-[#38BDF8] transition-all duration-300 space-y-4 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-[#64748B] dark:text-[#94A3B8]">
                      Team 0{idx + 1}
                    </span>
                    <span className={`font-mono text-xs font-bold ${team.accent}`}>
                      {team.nrr}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-display font-black text-xl text-[#101828] dark:text-[#F8FAFC] group-hover:text-[#2563EB] dark:group-hover:text-[#38BDF8] transition-colors">
                      {team.name}
                    </h4>
                    <span className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium block mt-0.5">
                      Owner: <strong>{team.owner}</strong>
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                      {team.tagline}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#334155] flex items-center justify-between text-xs">
                    <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                      {team.stats}
                    </span>
                    <Link
                      href="/teams"
                      className="inline-flex items-center gap-1 font-semibold text-[#2563EB] dark:text-[#38BDF8] group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Roster</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Strip: Auction Economics & Scarcity Rule */}
            <div className="bg-blue-50/70 dark:bg-[#151F32]/60 rounded-2xl p-5 border border-blue-200/80 dark:border-[#334155] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-[#2563EB] dark:text-[#38BDF8] flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Auction Enforcement Rule</span>
                </span>
                <p className="text-xs text-[#101828] dark:text-[#F8FAFC]">
                  Every franchise must reserve minimum funds to guarantee a complete 8-player squad:
                  <code className="ml-1.5 font-mono text-[11px] text-[#2563EB] dark:text-[#38BDF8]">
                    Reserve = (Slots - 1) × ₹2.0L
                  </code>
                </p>
              </div>
              <Link
                href="/auction"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold shrink-0 shadow-sm hover:bg-[#1D4ED8] transition"
              >
                <span>Auction Terminal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        SECTION 2: GSAP PARALLEL SCROLLING OPPOSING STREAMS
        ========================================================================
        Multi-stream vertical motion:
        - Stream 1: Moves upward (-140px)
        - Stream 2: Opposing direction! Moves downward (+120px)
        - Stream 3: Fast upward velocity (-200px)
      */}
      <ParallelScrollColumns />

      {/* 
        ========================================================================
        SECTION 3: PINNED HORIZONTAL SCROLLING ATHLETE SHOWCASE
        ========================================================================
        GSAP ScrollTrigger Pinned Track: Vertical scroll drives horizontal movement
        through verified player dossiers with career metrics and PIS ratings.
      */}
      <HorizontalScrollDossiers players={topPlayers} />

      {/* 
        ========================================================================
        SECTION 4: DATA INTELLIGENCE COCKPIT (ASYMMETRIC ANALYTICAL SUITES)
        ========================================================================
      */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2E8F0] dark:border-[#334155] pb-6">
          <div>
            <span className="text-xs uppercase font-mono font-bold tracking-widest text-[#2563EB] dark:text-[#38BDF8]">
              04 • DATA INTELLIGENCE
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

        {/* Asymmetrical Analytics Grid (Dominant Feature Left, Stacked Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Dominant Feature Panel: Batting Velocity & Milestone Breakdown (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#151F32] rounded-3xl p-8 border border-[#E2E8F0] dark:border-[#334155] shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Flame className="w-6 h-6" />
                </span>
                <span className="font-mono text-xs text-[#2563EB] dark:text-[#38BDF8] font-bold">
                  56 INNINGS ANALYZED
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-black text-3xl text-[#101828] dark:text-[#F8FAFC]">
                  Batting Velocity &amp; 6-Over Milestone Engine
                </h3>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed max-w-2xl">
                  In a 6-over match, standard 50s and 100s do not exist. EPL establishes specialized impact milestones: <strong>10+</strong> (foundation innings), <strong>15+</strong> (breakout velocity), and <strong>20+</strong> (match-winning innings).
                </p>
              </div>

              {/* Milestone Frequency Strip */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#E2E8F0] dark:border-[#334155]">
                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B]">
                  <span className="text-[10px] uppercase font-bold text-[#64748B] dark:text-[#94A3B8] block">10+ Innings</span>
                  <span className="font-mono text-2xl font-black text-[#101828] dark:text-[#F8FAFC]">112</span>
                  <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block">35.9% frequency</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B]">
                  <span className="text-[10px] uppercase font-bold text-[#64748B] dark:text-[#94A3B8] block">15+ Innings</span>
                  <span className="font-mono text-2xl font-black text-[#2563EB] dark:text-[#38BDF8]">54</span>
                  <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block">17.3% frequency</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-[#0B1120] border border-slate-200 dark:border-[#1E293B]">
                  <span className="text-[10px] uppercase font-bold text-[#64748B] dark:text-[#94A3B8] block">20+ Innings</span>
                  <span className="font-mono text-2xl font-black text-amber-500">28</span>
                  <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block">8.9% match-winners</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <Link
                href="/analytics/batting"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#2563EB] dark:text-[#38BDF8] hover:underline"
              >
                <span>Open Full Batting Velocity Leaderboards</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                Sagar Kapadia: 17 boundaries (All-Time Leader)
              </span>
            </div>
          </div>

          {/* Stacked Secondary Panels (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6">
            {/* Top Secondary Panel: Restrictive Bowling Suppression */}
            <div className="bg-white dark:bg-[#151F32] rounded-3xl p-6 border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-3 flex-1">
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                  <Shield className="w-5 h-5" />
                </span>
                <span className="font-mono text-[11px] text-[#0891B2] dark:text-[#22D3EE] font-bold">
                  827 DOT BALLS AUDITED
                </span>
              </div>
              <h4 className="font-display font-bold text-xl text-[#101828] dark:text-[#F8FAFC]">
                Bowling Economy &amp; Dot Suppression
              </h4>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                Evaluates legal-ball bowling economy rates, dot-ball suppression, and multi-wicket spells across 277 regulation tournament spells.
              </p>
              <div className="pt-1">
                <Link
                  href="/analytics/bowling"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0891B2] dark:text-[#22D3EE] hover:underline"
                >
                  <span>Explore Bowling Leaderboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Bottom Secondary Panel: EPL Intelligence Lab & Combinatorial Synergy */}
            <div className="bg-white dark:bg-[#151F32] rounded-3xl p-6 border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-3 flex-1">
              <div className="flex items-center justify-between">
                <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                  <FlaskConical className="w-5 h-5" />
                </span>
                <span className="font-mono text-[11px] text-purple-500 font-bold">
                  COMBINATORIAL LAB
                </span>
              </div>
              <h4 className="font-display font-bold text-xl text-[#101828] dark:text-[#F8FAFC]">
                EPL Intelligence Lab
              </h4>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                Discover 2-player and 3-player synergy pairs, winning patterns, and tactical chemistry with automated sample-size safeguards.
              </p>
              <div className="pt-1">
                <Link
                  href="/intelligence-lab"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-500 hover:underline"
                >
                  <span>Launch Intelligence Lab</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        SECTION 5: REAL-TIME AUCTION TERMINAL PREVIEW
        ========================================================================
      */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-[#0B1120] to-[#0A192F] text-white p-8 sm:p-14 border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              <span>LIVE WEBSOCKET AUCTION TERMINAL</span>
            </div>

            <h2 className="font-display font-black text-3xl sm:text-5xl tracking-tight text-white">
              Bidding Economics Meets Concurrency Serialization.
            </h2>

            <p className="font-sans text-sm sm:text-base text-slate-300 leading-relaxed">
              Equipped with real-time WebSocket state machines, token-based role separation, purse enforcement, and atomic SQLite transaction audits. Six franchise owners can bid simultaneously without race conditions or budget breaches.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/auction"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-display font-bold text-sm shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02]"
              >
                <DollarSign className="w-4 h-4" />
                <span>Enter Auction Arena</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/shortlists"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-display font-bold text-sm transition"
              >
                <Users className="w-4 h-4 text-cyan-300" />
                <span>Target Shortlists</span>
              </Link>
            </div>
          </div>

          {/* Terminal Telemetry Pod */}
          <div className="bg-slate-900/90 rounded-2xl p-6 border border-white/15 backdrop-blur-md min-w-[280px] sm:min-w-[340px] space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-mono font-bold text-cyan-400">AUCTION PROTOCOL</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PORT 8080 READY
              </span>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Total Registered Teams:</span>
                <span className="font-bold text-white">6 Franchises</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Starting Purse:</span>
                <span className="font-bold text-cyan-300">₹100.0 Lakhs / team</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Minimum Bid Increment:</span>
                <span className="font-bold text-white">₹0.50 Lakhs</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Countdown Timer:</span>
                <span className="font-bold text-amber-400">30 Seconds / Lot</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Reserve Fund Rule:</span>
                <span className="font-bold text-emerald-400">Strictly Enforced</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        SECTION 6: EDITORIAL FINAL CALL TO ACTION
        ========================================================================
      */}
      <section className="border-t border-[#E2E8F0] dark:border-[#334155] pt-16 flex flex-col items-center text-center space-y-6">
        <EplBrandLogo variant="hero" size="lg" animated />

        <div className="space-y-2 max-w-xl">
          <h2 className="font-display font-black text-3xl sm:text-4xl text-[#101828] dark:text-[#F8FAFC] tracking-tight">
            Exotica Premier League
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
            The historical record is verified. The auction algorithm is locked. 
            Experience the standard in residential cricket analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-md transition"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Open Tournament Terminal</span>
          </Link>
          <Link
            href="/changelog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-[#101828] dark:text-[#F8FAFC] hover:bg-slate-200 dark:hover:bg-white/10 transition"
          >
            <span>Platform Changelog (v2.0.1-dev)</span>
          </Link>
        </div>
      </section>
      </div>
    </div>
  );
}
