"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Trophy, Flame, Shield, Activity, ArrowRight,
  Sparkles, DollarSign, Layers, Zap, CheckCircle2,
  Users, Award, TrendingUp, FlaskConical, LayoutDashboard,
  ChevronRight, Target, Crosshair, ArrowUpRight
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useTheme } from "@/lib/theme";
import { EplBrandLogo } from "@/components/EplBrandLogo";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { ParallelScrollColumns } from "@/components/ParallelScrollColumns";
import { HorizontalScrollDossiers } from "@/components/HorizontalScrollDossiers";
import { Cricket3DScene } from "@/components/Cricket3DScene";

export default function LandingPage() {
  const [overview, setOverview] = useState<any>(null);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

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
  const telemetryFloatY = useTransform(scrollYProgress, [0.05, 0.3], [20, -20]);

  useEffect(() => {
    async function loadLandingData() {
      try {
        const [ovRes, plRes, tmRes] = await Promise.all([
          fetchApi("/api/overview"),
          fetchApi("/api/players?sort_by=rating&limit=8"),
          fetchApi("/api/teams"),
        ]);
        setOverview(ovRes);
        setTopPlayers(plRes.players || []);
        setTeams(tmRes.teams || []);
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

  // Official 6 Franchise Master Data in Luxury Palette
  const franchiseList = [
    {
      name: "Exotica Warriors",
      owner: "Aryan Shetty",
      tagline: "2025 Reigning Champions",
      stats: "4 Wins • 0 Losses • 100% Win Rate",
      nrr: "+1.05 NRR",
      runs: 190,
      wkts: 15,
    },
    {
      name: "Victory Vipers",
      owner: "Sandeep Dalvi",
      tagline: "High-Octane Strike Unit",
      stats: "2 Wins • 2 Losses • 50% Win Rate",
      nrr: "+0.43 NRR",
      runs: 165,
      wkts: 10,
    },
    {
      name: "The Ultimates",
      owner: "Anurag Jain",
      tagline: "Calculated Boundary Anchors",
      stats: "1 Win • 2 Losses • 33% Win Rate",
      nrr: "+0.06 NRR",
      runs: 110,
      wkts: 14,
    },
    {
      name: "Exotica Panthers",
      owner: "Ashish Chhawchharia",
      tagline: "Disciplined Restrictive Pace",
      stats: "1 Win • 1 Loss • 50% Win Rate",
      nrr: "-0.34 NRR",
      runs: 69,
      wkts: 10,
    },
    {
      name: "Exotica Lions Pride",
      owner: "Yash Patel",
      tagline: "Fierce Knockout Contenders",
      stats: "1 Win • 2 Losses • 33% Win Rate",
      nrr: "-0.75 NRR",
      runs: 99,
      wkts: 13,
    },
    {
      name: "Exotica Living Legenda",
      owner: "Vijay Limbachiya",
      tagline: "Veteran Squad Depth",
      stats: "0 Wins • 2 Losses • Rebuilding",
      nrr: "-1.33 NRR",
      runs: 90,
      wkts: 3,
    },
  ];

  return (
    <div ref={containerRef} className="pb-24 overflow-hidden relative">
      {/* 
        ========================================================================
        MULTI-LAYER LUXURY KINETIC TRAJECTORY CANVAS
        ========================================================================
      */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden opacity-25 dark:opacity-30">
        <motion.svg
          style={{ y: trajectoryY1 }}
          className="w-full h-full"
          viewBox="0 0 1440 1800"
          fill="none"
        >
          <motion.path
            d="M-100,320 Q500,120 900,420 T1600,180"
            stroke="url(#luxury-traj-vermilion)"
            strokeWidth="2.5"
            strokeDasharray="14 8"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.8, ease: "easeInOut" }}
          />
          <motion.path
            d="M100,900 Q650,600 1100,980 T1700,750"
            stroke="url(#luxury-traj-ivory)"
            strokeWidth="1.8"
            strokeDasharray="10 6"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3.4, delay: 0.2, ease: "easeInOut" }}
          />
          <defs>
            <linearGradient id="luxury-traj-vermilion" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF4B35" stopOpacity="0.05" />
              <stop offset="50%" stopColor="#FF4B35" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#E03E29" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="luxury-traj-ivory" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F1EBDD" stopOpacity="0.05" />
              <stop offset="50%" stopColor="#F1EBDD" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#DDD5C3" stopOpacity="0.05" />
            </linearGradient>
          </defs>
        </motion.svg>
      </div>

      <div className="space-y-20 sm:space-y-32">
        {/* 
          ========================================================================
          HERO STAGE: 12-COL ASYMMETRIC STAGE WITH BLENDER-LEVEL 3D CRICKET BALL
          ========================================================================
          - Left (7 cols): Bold editorial typography, format description, 3 CTAs
          - Right (5 cols): Three.js Interactive 3D Match Ball + Telemetry overlay
          - Bounding Box verified: Headline begins at y = 159px at the top fold
        */}
        <section className="relative pt-0 space-y-10">
          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
          >
            {/* LEFT COLUMN: Editorial Typography & Action Hub (7 Cols) */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8">
              {/* Top Telemetry Header - Crisp Badge with Electric Vermilion Pip */}
              <div className="flex flex-wrap items-center gap-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF7F0] dark:bg-[#181A20] border border-[#DDD5C3] dark:border-[#2A2E38] backdrop-blur-md text-xs font-mono shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FF4B35]" />
                  <span className="font-bold text-[#111318] dark:text-[#F1EBDD]">EPL CRICKET INTELLIGENCE</span>
                  <span className="text-[#8C867A] dark:text-[#6E6A60]">|</span>
                  <span className="text-[#FF4B35] font-semibold">27 Historical Scorecards Audited</span>
                </motion.div>

                <span className="text-[11px] font-mono uppercase tracking-widest text-[#5C584E] dark:text-[#A8A295] hidden sm:inline-block">
                  100-Point Bayesian Model
                </span>
              </div>

              {/* Oversized Signature Typography Headline in Luxury Contrast */}
              <div className="space-y-3">
                <motion.h1
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.75, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="font-display font-black text-5xl sm:text-7xl lg:text-8xl tracking-[-0.035em] leading-[0.92] text-[#111318] dark:text-[#F1EBDD]"
                >
                  MORE THAN A GAME.
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4B35] via-[#E03E29] to-[#FF6452]">
                    A GAME OF NUMBERS.
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.75, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="font-sans text-base sm:text-xl text-[#5C584E] dark:text-[#A8A295] max-w-2xl font-normal leading-relaxed pt-1"
                >
                  The definitive cricket intelligence platform for 6-over competition. 73 canonical athletes, situational pressure splits, and atomic auction economics.
                </motion.p>
              </div>

              {/* Action Hub CTAs in Electric Vermilion & Obsidian */}
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
                  className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-[#FF4B35] hover:bg-[#E03E29] text-white font-display font-bold text-base shadow-xl shadow-[#FF4B35]/25 transition-all duration-300 hover:scale-[1.02]"
                >
                  <LayoutDashboard className="w-5 h-5 text-white/90" />
                  <span>Launch Terminal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/auction"
                  data-cursor="view"
                  data-cursor-label="AUCTION"
                  className="inline-flex items-center gap-2.5 px-7 py-4 rounded-xl bg-[#FAF7F0] dark:bg-[#181A20] border border-[#DDD5C3] dark:border-[#2A2E38] text-[#111318] dark:text-[#F1EBDD] font-display font-bold text-base hover:border-[#FF4B35] dark:hover:border-[#FF4B35] shadow-sm transition-all duration-300"
                >
                  <DollarSign className="w-5 h-5 text-[#FF4B35]" />
                  <span>Live Auction Room</span>
                </Link>

                <Link
                  href="/players"
                  className="text-xs font-semibold text-[#5C584E] dark:text-[#A8A295] hover:text-[#FF4B35] dark:hover:text-[#FF4B35] underline decoration-[#FF4B35]/40 underline-offset-4 px-2 py-2 transition-colors"
                >
                  Explore 73 Athlete Dossiers →
                </Link>
              </motion.div>
            </div>

            {/* RIGHT COLUMN: Interactive Three.js 3D Match Ball & Telemetry Cockpit (5 Cols) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.85, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 relative"
            >
              <div className="relative bg-[#FAF7F0] dark:bg-[#181A20] text-[#111318] dark:text-[#F1EBDD] rounded-3xl p-5 sm:p-6 border border-[#DDD5C3] dark:border-[#2A2E38] shadow-2xl overflow-hidden space-y-4">
                {/* 3D WebGL Cricket Ball Canvas with Seam Physics */}
                <Cricket3DScene isDark={theme === "dark"} className="w-full h-[320px] sm:h-[350px]" />

                {/* Ground Truth Telemetry Micro-Rack */}
                <div className="grid grid-cols-2 gap-3 relative z-10 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-[#F1EBDD]/60 dark:bg-[#111318] border border-[#DDD5C3] dark:border-[#2A2E38] space-y-1">
                    <div className="flex items-center gap-1.5 text-[#5C584E] dark:text-[#A8A295] text-[10px] uppercase font-bold">
                      <Flame className="w-3.5 h-3.5 text-[#FF4B35]" />
                      <span>Record Score</span>
                    </div>
                    <div className="font-display font-bold text-xl text-[#111318] dark:text-[#F1EBDD]">
                      62/2 <span className="text-xs font-mono text-[#5C584E] dark:text-[#A8A295]">(10.33 RPO)</span>
                    </div>
                    <div className="text-[10px] text-[#5C584E] dark:text-[#A8A295] truncate">
                      Exotica Warriors • 2025 Finals
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F1EBDD]/60 dark:bg-[#111318] border border-[#DDD5C3] dark:border-[#2A2E38] space-y-1">
                    <div className="flex items-center gap-1.5 text-[#5C584E] dark:text-[#A8A295] text-[10px] uppercase font-bold">
                      <Shield className="w-3.5 h-3.5 text-[#FF4B35]" />
                      <span>Best Economy</span>
                    </div>
                    <div className="font-display font-bold text-xl text-[#FF4B35]">
                      3.57 <span className="text-xs font-mono text-[#5C584E] dark:text-[#A8A295]">Econ</span>
                    </div>
                    <div className="text-[10px] text-[#5C584E] dark:text-[#A8A295] truncate">
                      Smeet Shah • 44 Legal Balls
                    </div>
                  </div>
                </div>

                {/* Bottom Concurrency Bar */}
                <div className="pt-2 border-t border-[#DDD5C3] dark:border-[#2A2E38] flex items-center justify-between text-xs relative z-10 font-mono">
                  <span className="text-[#5C584E] dark:text-[#A8A295] text-[11px]">Purse Cap: ₹100.0L Hard Ceiling</span>
                  <span className="text-[#FF4B35] text-[11px] font-semibold">Atomic Concurrency</span>
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
            className="pt-8 border-t border-[#DDD5C3] dark:border-[#2A2E38] grid grid-cols-2 sm:grid-cols-5 gap-6 sm:gap-8"
          >
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#5C584E] dark:text-[#A8A295] block">
                Verified Matches
              </span>
              <div className="font-display text-3xl sm:text-4xl font-extrabold text-[#111318] dark:text-[#F1EBDD] mt-0.5">
                <AnimatedCounter value={totalMatches} />
              </div>
              <span className="text-[11px] font-mono text-[#FF4B35]">100% Extracted</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#5C584E] dark:text-[#A8A295] block">
                Audited Innings
              </span>
              <div className="font-display text-3xl sm:text-4xl font-extrabold text-[#111318] dark:text-[#F1EBDD] mt-0.5">
                <AnimatedCounter value={totalInnings} />
              </div>
              <span className="text-[11px] font-mono text-[#5C584E] dark:text-[#A8A295]">Incl. Super Overs</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#5C584E] dark:text-[#A8A295] block">
                Canonical Players
              </span>
              <div className="font-display text-3xl sm:text-4xl font-extrabold text-[#111318] dark:text-[#F1EBDD] mt-0.5">
                <AnimatedCounter value={totalPlayers} />
              </div>
              <span className="text-[11px] font-mono text-[#FF4B35]">Disambiguated</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#5C584E] dark:text-[#A8A295] block">
                Tournament Runs
              </span>
              <div className="font-display text-3xl sm:text-4xl font-extrabold text-[#FF4B35] mt-0.5">
                <AnimatedCounter value={totalRuns} />
              </div>
              <span className="text-[11px] font-mono text-[#5C584E] dark:text-[#A8A295]">3 Seasons (2023–2025)</span>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#5C584E] dark:text-[#A8A295] block">
                Wickets Fallen
              </span>
              <div className="font-display text-3xl sm:text-4xl font-extrabold text-[#111318] dark:text-[#F1EBDD] mt-0.5">
                <AnimatedCounter value={totalWickets} />
              </div>
              <span className="text-[11px] font-mono text-[#FF4B35]">Legal Deliveries Only</span>
            </div>
          </motion.div>
        </section>

        {/* 
          ========================================================================
          SECTION 1: THE COMPETITIVE ARCHITECTURE (ASYMMETRIC EDITORIAL OVERHAUL)
          ========================================================================
        */}
        <section className="space-y-12">
          <div className="border-b border-[#DDD5C3] dark:border-[#2A2E38] pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="text-xs uppercase font-mono font-bold tracking-widest text-[#FF4B35]">
                01 • THE COMPETITIVE ARCHITECTURE
              </span>
              <h2 className="font-display font-black text-3xl sm:text-5xl text-[#111318] dark:text-[#F1EBDD] tracking-tight">
                WHY 6-OVER CRICKET DEMANDS EXTREME PRECISION.
              </h2>
              <p className="font-sans text-sm sm:text-base text-[#5C584E] dark:text-[#A8A295] leading-relaxed">
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
              <div className="bg-[#181A20] text-[#F1EBDD] rounded-3xl p-8 border border-[#2A2E38] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF4B35]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between border-b border-[#2A2E38] pb-4">
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#FF4B35]">
                      Format Specification
                    </span>
                    <span className="text-xs font-mono px-3 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                      6 Overs • 36 Balls
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="font-display font-black text-6xl tracking-tight text-[#F1EBDD]">
                      36
                    </div>
                    <div className="text-sm font-bold uppercase tracking-wider text-[#A8A295]">
                      Legal Deliveries Per Innings
                    </div>
                    <p className="text-xs text-[#A8A295] leading-relaxed pt-1">
                      Every dot ball consumes 2.77% of a team's total offensive capacity. Conventional test or ODI averages are statistically irrelevant; the game belongs to velocity specialists.
                    </p>
                  </div>

                  {/* Micro Metric Callout Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#2A2E38] text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#A8A295] block">Purse Cap</span>
                      <span className="font-mono text-xl font-bold text-[#F1EBDD]">₹100.0L</span>
                      <span className="text-[10px] text-[#A8A295] block">Hard squad ceiling</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#A8A295] block">Squad Limit</span>
                      <span className="font-mono text-xl font-bold text-[#FF4B35]">8 Players</span>
                      <span className="text-[10px] text-[#A8A295] block">Max franchise roster</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-2 text-xs font-bold text-[#FF4B35] hover:text-[#FF6452] transition-colors"
                    >
                      <span>Inspect Complete Format Rules</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Sub-Card: 100-Point PIS Mathematical Foundation */}
              <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-2xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm space-y-3">
                <div className="flex items-center gap-2.5 text-[#FF4B35]">
                  <Target className="w-5 h-5" />
                  <h4 className="font-display font-bold text-base text-[#111318] dark:text-[#F1EBDD]">
                    100-Point Bayesian Scorecard (PIS)
                  </h4>
                </div>
                <p className="text-xs text-[#5C584E] dark:text-[#A8A295] leading-relaxed">
                  Calibrated multi-discipline intelligence measuring volume, boundary percentage, dot-ball suppression, and playoff leverage. Pure specialists are never penalized for missing disciplines.
                </p>
              </div>
            </div>

            {/* Right Column: Interactive 6-Franchise Competition Grid (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h3 className="font-display font-bold text-xl text-[#111318] dark:text-[#F1EBDD]">
                    The Six Competing Franchises
                  </h3>
                  <p className="text-xs text-[#5C584E] dark:text-[#A8A295]">
                    Verified records, franchise ownership, and net run rate telemetry.
                  </p>
                </div>
                <span className="text-xs font-mono text-[#FF4B35] font-semibold">
                  6 Franchises Registered
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {franchiseList.map((team, idx) => (
                  <div
                    key={idx}
                    className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-2xl p-5 border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm hover:border-[#FF4B35] dark:hover:border-[#FF4B35] transition-all duration-300 space-y-4 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E8E1D1]/60 dark:bg-[#22252D] text-[#5C584E] dark:text-[#A8A295]">
                        Team 0{idx + 1}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#FF4B35]">
                        {team.nrr}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-display font-black text-xl text-[#111318] dark:text-[#F1EBDD] group-hover:text-[#FF4B35] dark:group-hover:text-[#FF4B35] transition-colors">
                        {team.name}
                      </h4>
                      <span className="text-xs text-[#5C584E] dark:text-[#A8A295] font-medium block mt-0.5">
                        Owner: <strong>{team.owner}</strong>
                      </span>
                      <span className="text-[11px] text-[#8C867A] dark:text-[#6E6A60] block">
                        {team.tagline}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-[#DDD5C3] dark:border-[#2A2E38] flex items-center justify-between text-xs">
                      <span className="text-[11px] font-mono text-[#5C584E] dark:text-[#A8A295]">
                        {team.stats}
                      </span>
                      <Link
                        href="/teams"
                        className="inline-flex items-center gap-1 font-semibold text-[#FF4B35] group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>Roster</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Strip: Auction Economics & Scarcity Rule */}
              <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-2xl p-5 border border-[#DDD5C3] dark:border-[#2A2E38] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#FF4B35] flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Auction Enforcement Rule</span>
                  </span>
                  <p className="text-xs text-[#111318] dark:text-[#F1EBDD]">
                    Every franchise must reserve minimum funds to guarantee an 8-player squad:
                    <code className="ml-1.5 font-mono text-[11px] text-[#FF4B35]">
                      Reserve = (Slots - 1) × ₹2.0L
                    </code>
                  </p>
                </div>
                <Link
                  href="/auction"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF4B35] text-white text-xs font-bold shrink-0 shadow-sm hover:bg-[#E03E29] transition"
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
        */}
        <ParallelScrollColumns />

        {/* 
          ========================================================================
          SECTION 3: PINNED HORIZONTAL SCROLLING ATHLETE SHOWCASE
          ========================================================================
        */}
        <HorizontalScrollDossiers players={topPlayers} />

        {/* 
          ========================================================================
          SECTION 4: DATA INTELLIGENCE COCKPIT (ASYMMETRIC ANALYTICAL SUITES)
          ========================================================================
        */}
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#DDD5C3] dark:border-[#2A2E38] pb-6">
            <div>
              <span className="text-xs uppercase font-mono font-bold tracking-widest text-[#FF4B35]">
                04 • DATA INTELLIGENCE
              </span>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-[#111318] dark:text-[#F1EBDD] tracking-tight mt-1">
                ANALYTICS ENGINES &amp; EXPLORATION
              </h2>
            </div>
            <Link
              href="/analytics/advanced"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF4B35] hover:underline"
            >
              <span>Launch Advanced Suite</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Asymmetrical Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Dominant Feature Panel: Batting Velocity & Milestone Breakdown (7 cols) */}
            <div className="lg:col-span-7 bg-[#FAF7F0] dark:bg-[#181A20] rounded-3xl p-8 border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="p-3 rounded-2xl bg-[#FF4B35]/10 text-[#FF4B35]">
                    <Flame className="w-6 h-6" />
                  </span>
                  <span className="font-mono text-xs text-[#FF4B35] font-bold">
                    56 INNINGS ANALYZED
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-display font-black text-3xl text-[#111318] dark:text-[#F1EBDD]">
                    Batting Velocity &amp; 6-Over Milestone Engine
                  </h3>
                  <p className="text-sm text-[#5C584E] dark:text-[#A8A295] leading-relaxed max-w-2xl">
                    In a 6-over match, standard 50s and 100s do not exist. EPL establishes specialized impact milestones: <strong>10+</strong> (foundation innings), <strong>15+</strong> (breakout velocity), and <strong>20+</strong> (match-winning innings).
                  </p>
                </div>

                {/* Milestone Frequency Strip */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#DDD5C3] dark:border-[#2A2E38]">
                  <div className="p-3.5 rounded-xl bg-[#F1EBDD]/60 dark:bg-[#111318] border border-[#DDD5C3] dark:border-[#2A2E38]">
                    <span className="text-[10px] uppercase font-bold text-[#5C584E] dark:text-[#A8A295] block">10+ Innings</span>
                    <span className="font-mono text-2xl font-black text-[#111318] dark:text-[#F1EBDD]">112</span>
                    <span className="text-[10px] text-[#5C584E] dark:text-[#A8A295] block">35.9% frequency</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F1EBDD]/60 dark:bg-[#111318] border border-[#DDD5C3] dark:border-[#2A2E38]">
                    <span className="text-[10px] uppercase font-bold text-[#5C584E] dark:text-[#A8A295] block">15+ Innings</span>
                    <span className="font-mono text-2xl font-black text-[#FF4B35]">54</span>
                    <span className="text-[10px] text-[#5C584E] dark:text-[#A8A295] block">17.3% frequency</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F1EBDD]/60 dark:bg-[#111318] border border-[#DDD5C3] dark:border-[#2A2E38]">
                    <span className="text-[10px] uppercase font-bold text-[#5C584E] dark:text-[#A8A295] block">20+ Innings</span>
                    <span className="font-mono text-2xl font-black text-[#FF4B35]">28</span>
                    <span className="text-[10px] text-[#5C584E] dark:text-[#A8A295] block">8.9% match-winners</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Link
                  href="/analytics/batting"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#FF4B35] hover:underline"
                >
                  <span>Open Full Batting Velocity Leaderboards</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <span className="text-[11px] font-mono text-[#5C584E] dark:text-[#A8A295]">
                  Sagar Kapadia: 17 boundaries (All-Time Leader)
                </span>
              </div>
            </div>

            {/* Stacked Secondary Panels (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-6">
              {/* Top Secondary Panel: Restrictive Bowling Suppression */}
              <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-3xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm space-y-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="p-2.5 rounded-xl bg-[#FF4B35]/10 text-[#FF4B35]">
                    <Shield className="w-5 h-5" />
                  </span>
                  <span className="font-mono text-[11px] text-[#FF4B35] font-bold">
                    827 DOT BALLS AUDITED
                  </span>
                </div>
                <h4 className="font-display font-bold text-xl text-[#111318] dark:text-[#F1EBDD]">
                  Bowling Economy &amp; Dot Suppression
                </h4>
                <p className="text-xs text-[#5C584E] dark:text-[#A8A295] leading-relaxed">
                  Evaluates legal-ball bowling economy rates, dot-ball suppression, and multi-wicket spells across 277 regulation tournament spells.
                </p>
                <div className="pt-1">
                  <Link
                    href="/analytics/bowling"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF4B35] hover:underline"
                  >
                    <span>Explore Bowling Leaderboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Bottom Secondary Panel: EPL Intelligence Lab & Combinatorial Synergy */}
              <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-3xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm space-y-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="p-2.5 rounded-xl bg-[#FF4B35]/10 text-[#FF4B35]">
                    <FlaskConical className="w-5 h-5" />
                  </span>
                  <span className="font-mono text-[11px] text-[#FF4B35] font-bold">
                    COMBINATORIAL LAB
                  </span>
                </div>
                <h4 className="font-display font-bold text-xl text-[#111318] dark:text-[#F1EBDD]">
                  EPL Intelligence Lab
                </h4>
                <p className="text-xs text-[#5C584E] dark:text-[#A8A295] leading-relaxed">
                  Discover 2-player and 3-player synergy pairs, winning patterns, and tactical chemistry with automated sample-size safeguards.
                </p>
                <div className="pt-1">
                  <Link
                    href="/intelligence-lab"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF4B35] hover:underline"
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
        <section className="relative rounded-3xl overflow-hidden bg-[#181A20] text-[#F1EBDD] p-8 sm:p-14 border border-[#2A2E38] shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF4B35]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF4B35]/10 border border-[#FF4B35]/30 text-[#FF4B35] font-mono text-xs">
                <span className="w-2 h-2 rounded-full bg-[#FF4B35] animate-ping" />
                <span>LIVE WEBSOCKET AUCTION TERMINAL</span>
              </div>

              <h2 className="font-display font-black text-3xl sm:text-5xl tracking-tight text-[#F1EBDD]">
                Bidding Economics Meets Concurrency Serialization.
              </h2>

              <p className="font-sans text-sm sm:text-base text-[#A8A295] leading-relaxed">
                Equipped with real-time WebSocket state machines, token-based role separation, purse enforcement, and atomic SQLite transaction audits. Six franchise owners can bid simultaneously without race conditions or budget breaches.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  href="/auction"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#FF4B35] hover:bg-[#E03E29] text-white font-display font-bold text-sm shadow-lg shadow-[#FF4B35]/25 transition-all duration-300 hover:scale-[1.02]"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Enter Auction Arena</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/shortlists"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-[#F1EBDD] font-display font-bold text-sm transition"
                >
                  <Users className="w-4 h-4 text-[#F1EBDD]" />
                  <span>Target Shortlists</span>
                </Link>
              </div>
            </div>

            {/* Terminal Telemetry Pod */}
            <div className="bg-[#111318]/90 rounded-2xl p-6 border border-[#2A2E38] backdrop-blur-md min-w-[280px] sm:min-w-[340px] space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#2A2E38] pb-3">
                <span className="text-xs font-mono font-bold text-[#FF4B35]">AUCTION PROTOCOL</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF4B35]/20 text-[#FF4B35] border border-[#FF4B35]/30">
                  PORT 8080 READY
                </span>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between text-[#A8A295]">
                  <span>Total Registered Teams:</span>
                  <span className="font-bold text-[#F1EBDD]">6 Franchises</span>
                </div>
                <div className="flex justify-between text-[#A8A295]">
                  <span>Starting Purse:</span>
                  <span className="font-bold text-[#FF4B35]">₹100.0 Lakhs / team</span>
                </div>
                <div className="flex justify-between text-[#A8A295]">
                  <span>Minimum Bid Increment:</span>
                  <span className="font-bold text-[#F1EBDD]">₹0.50 Lakhs</span>
                </div>
                <div className="flex justify-between text-[#A8A295]">
                  <span>Countdown Timer:</span>
                  <span className="font-bold text-[#FF4B35]">30 Seconds / Lot</span>
                </div>
                <div className="flex justify-between text-[#A8A295]">
                  <span>Reserve Fund Rule:</span>
                  <span className="font-bold text-[#F1EBDD]">Strictly Enforced</span>
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
        <section className="border-t border-[#DDD5C3] dark:border-[#2A2E38] pt-16 flex flex-col items-center text-center space-y-6">
          <EplBrandLogo variant="hero" size="lg" animated />

          <div className="space-y-2 max-w-xl">
            <h2 className="font-display font-black text-3xl sm:text-4xl text-[#111318] dark:text-[#F1EBDD] tracking-tight">
              Exotica Premier League
            </h2>
            <p className="text-xs sm:text-sm text-[#5C584E] dark:text-[#A8A295] leading-relaxed">
              The historical record is verified. The auction algorithm is locked. 
              Experience the standard in residential cricket analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF4B35] hover:bg-[#E03E29] text-white text-xs font-bold shadow-md transition"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Open Tournament Terminal</span>
            </Link>
            <Link
              href="/changelog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E8E1D1]/60 dark:bg-[#181A20] border border-[#DDD5C3] dark:border-[#2A2E38] text-xs font-bold text-[#111318] dark:text-[#F1EBDD] hover:border-[#FF4B35] dark:hover:border-[#FF4B35] transition"
            >
              <span>Platform Changelog (v2.0.1-dev)</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
