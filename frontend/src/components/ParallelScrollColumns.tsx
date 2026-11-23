"use client";

import React, { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { Flame, Shield, Trophy, Activity, TrendingUp, Crosshair } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function ParallelScrollColumns() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const col1Ref = useRef<HTMLDivElement | null>(null);
  const col2Ref = useRef<HTMLDivElement | null>(null);
  const col3Ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;

    if (prefersReducedMotion || isMobile) {
      return;
    }

    const ctx = gsap.context(() => {
      // Column 1: Moves upward (-120px)
      if (col1Ref.current) {
        gsap.fromTo(
          col1Ref.current,
          { y: 60 },
          {
            y: -120,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2,
              invalidateOnRefresh: true,
            },
          }
        );
      }

      // Column 2: Opposing direction! Moves downward (+100px)
      if (col2Ref.current) {
        gsap.fromTo(
          col2Ref.current,
          { y: -80 },
          {
            y: 100,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2,
              invalidateOnRefresh: true,
            },
          }
        );
      }

      // Column 3: Moves upward at different velocity (-160px)
      if (col3Ref.current) {
        gsap.fromTo(
          col3Ref.current,
          { y: 90 },
          {
            y: -160,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2,
              invalidateOnRefresh: true,
            },
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-12 overflow-hidden space-y-8">
      {/* Editorial Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#DDD5C3] dark:border-[#2A2E38] pb-6">
        <div className="space-y-1.5 max-w-2xl">
          <span className="text-xs uppercase font-mono font-semibold tracking-wider text-[#FF4B35]">
            02 • Historical intelligence
          </span>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl text-[#111318] dark:text-[#F1EBDD] tracking-tight">
            Tournament telemetry breakdown
          </h2>
          <p className="text-xs sm:text-sm text-[#5C584E] dark:text-[#A8A295] leading-relaxed">
            Three independent operational streams moving across distinct analytical dimensions with synchronized opposing motion.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#5C584E] dark:text-[#A8A295]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF4B35] inline-block animate-pulse" />
          <span>Opposing motion synchronized via ScrollTrigger</span>
        </div>
      </div>

      {/* 3-Column Parallel Moving Canvas with Glassmorphic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 items-start min-h-[580px]">
        {/* COLUMN 1: Ascending Stream */}
        <div ref={col1Ref} className="space-y-5 will-change-transform">
          <div className="bg-[#FAF7F0]/80 dark:bg-[#181A20]/80 backdrop-blur-md rounded-xl p-6 border border-[#DDD5C3]/80 dark:border-[#2A2E38]/80 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 space-y-3 group">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-[#FF4B35]/10 text-[#FF4B35]">
                <Flame className="w-4 h-4" />
              </span>
              <span className="font-mono text-[10px] text-[#5C584E] dark:text-[#A8A295] font-semibold uppercase tracking-wider">
                All-time runs
              </span>
            </div>
            <div className="space-y-1">
              <span className="font-display font-semibold text-3xl text-[#111318] dark:text-[#F1EBDD] tabular-nums">
                138
              </span>
              <span className="text-xs font-medium text-[#5C584E] dark:text-[#A8A295] block">
                Total runs (Sagar Kapadia)
              </span>
            </div>
            <p className="text-xs text-[#5C584E] dark:text-[#A8A295] leading-relaxed">
              134 regulation runs + 4 Super Over runs across 12 tournament matches. 17 all-time boundaries scored at 117.5 strike rate.
            </p>
          </div>

          <div className="bg-[#FAF7F0]/80 dark:bg-[#181A20]/80 backdrop-blur-md rounded-xl p-6 border border-[#DDD5C3]/80 dark:border-[#2A2E38]/80 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 space-y-3 group">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-[#FF4B35]/10 text-[#FF4B35]">
                <TrendingUp className="w-4 h-4" />
              </span>
              <span className="font-mono text-[10px] text-[#5C584E] dark:text-[#A8A295] font-semibold uppercase tracking-wider">
                Boundary surge
              </span>
            </div>
            <div className="space-y-1">
              <span className="font-display font-semibold text-3xl text-[#FF4B35] tabular-nums">
                +96.5%
              </span>
              <span className="text-xs font-medium text-[#5C584E] dark:text-[#A8A295] block">
                Boundary evolution rate
              </span>
            </div>
            <p className="text-xs text-[#5C584E] dark:text-[#A8A295] leading-relaxed">
              Tournament boundary scoring increased from 3.11 boundaries per match in 2023 to 6.11 per match in 2025 as hitting velocity matured.
            </p>
          </div>

          <div className="bg-[#181A20]/90 backdrop-blur-md text-[#F1EBDD] rounded-xl p-6 border border-[#2A2E38] shadow-sm hover:scale-[1.02] transition-all duration-300 space-y-2">
            <span className="text-[10px] font-mono text-[#A8A295] uppercase tracking-wider font-semibold block">
              Historic innings
            </span>
            <div className="font-display font-semibold text-3xl tabular-nums">62/2</div>
            <p className="text-xs text-[#A8A295] leading-relaxed">
              Exotica Warriors (2025 Match 5) highest team innings total in EPL history. Required run rate reached 10.33 RPO.
            </p>
          </div>
        </div>

        {/* COLUMN 2: Descending Stream (Opposing Direction!) */}
        <div ref={col2Ref} className="space-y-5 will-change-transform">
          <div className="bg-[#FAF7F0]/80 dark:bg-[#181A20]/80 backdrop-blur-md rounded-xl p-6 border border-[#DDD5C3]/80 dark:border-[#2A2E38]/80 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 space-y-3 group">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-[#FF4B35]/10 text-[#FF4B35]">
                <Shield className="w-4 h-4" />
              </span>
              <span className="font-mono text-[10px] text-[#5C584E] dark:text-[#A8A295] font-semibold uppercase tracking-wider">
                Economy benchmark
              </span>
            </div>
            <div className="space-y-1">
              <span className="font-display font-semibold text-3xl text-[#111318] dark:text-[#F1EBDD] tabular-nums">
                3.57
              </span>
              <span className="text-xs font-medium text-[#5C584E] dark:text-[#A8A295] block">
                Career economy (Smeet Shah)
              </span>
            </div>
            <p className="text-xs text-[#5C584E] dark:text-[#A8A295] leading-relaxed">
              Lowest economy rate among bowlers with &ge; 30 legal balls bowled. 44 legal deliveries, 26 runs conceded, 56.8% dot ball rate.
            </p>
          </div>

          <div className="bg-[#FAF7F0]/80 dark:bg-[#181A20]/80 backdrop-blur-md rounded-xl p-6 border border-[#DDD5C3]/80 dark:border-[#2A2E38]/80 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 space-y-3 group">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-[#FF4B35]/10 text-[#FF4B35]">
                <Crosshair className="w-4 h-4" />
              </span>
              <span className="font-mono text-[10px] text-[#5C584E] dark:text-[#A8A295] font-semibold uppercase tracking-wider">
                Defensive record
              </span>
            </div>
            <div className="space-y-1">
              <span className="font-display font-semibold text-3xl text-[#111318] dark:text-[#F1EBDD] tabular-nums">
                30
              </span>
              <span className="text-xs font-medium text-[#5C584E] dark:text-[#A8A295] block">
                Lowest defended total
              </span>
            </div>
            <p className="text-xs text-[#5C584E] dark:text-[#A8A295] leading-relaxed">
              ACER ASPIRE successfully defended 30 runs against ACER SWIFT (24 all-out) in the 2024 Semifinal 2 under knockout pressure.
            </p>
          </div>

          <div className="bg-[#FAF7F0]/80 dark:bg-[#181A20]/80 backdrop-blur-md rounded-xl p-6 border border-[#DDD5C3]/80 dark:border-[#2A2E38]/80 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 space-y-2 group">
            <span className="text-[10px] font-mono text-[#5C584E] dark:text-[#A8A295] uppercase tracking-wider font-semibold block">
              Dot ball ledger
            </span>
            <div className="font-display font-semibold text-3xl text-[#111318] dark:text-[#F1EBDD] tabular-nums">
              827
            </div>
            <p className="text-xs text-[#5C584E] dark:text-[#A8A295] leading-relaxed">
              Verified legal dot balls recorded across 277 regulation spells, representing 49.8% of all balls bowled.
            </p>
          </div>
        </div>

        {/* COLUMN 3: Fast Ascending Stream */}
        <div ref={col3Ref} className="space-y-5 will-change-transform">
          <div className="bg-[#FAF7F0]/80 dark:bg-[#181A20]/80 backdrop-blur-md rounded-xl p-6 border border-[#DDD5C3]/80 dark:border-[#2A2E38]/80 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 space-y-3 group">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-[#FF4B35]/10 text-[#FF4B35]">
                <Trophy className="w-4 h-4" />
              </span>
              <span className="font-mono text-[10px] text-[#5C584E] dark:text-[#A8A295] font-semibold uppercase tracking-wider">
                Toss neutrality
              </span>
            </div>
            <div className="space-y-1">
              <span className="font-display font-semibold text-3xl text-[#111318] dark:text-[#F1EBDD] tabular-nums">
                48.1%
              </span>
              <span className="text-xs font-medium text-[#5C584E] dark:text-[#A8A295] block">
                Toss winner match rate
              </span>
            </div>
            <p className="text-xs text-[#5C584E] dark:text-[#A8A295] leading-relaxed">
              Teams winning the coin toss won 13 of 27 matches, confirming zero systemic toss advantage in underarm conditions.
            </p>
          </div>

          <div className="bg-[#FAF7F0]/80 dark:bg-[#181A20]/80 backdrop-blur-md rounded-xl p-6 border border-[#DDD5C3]/80 dark:border-[#2A2E38]/80 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 space-y-3 group">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-[#FF4B35]/10 text-[#FF4B35]">
                <Activity className="w-4 h-4" />
              </span>
              <span className="font-mono text-[10px] text-[#5C584E] dark:text-[#A8A295] font-semibold uppercase tracking-wider">
                Run chase advantage
              </span>
            </div>
            <div className="space-y-1">
              <span className="font-display font-semibold text-3xl text-[#FF4B35] tabular-nums">
                55.6%
              </span>
              <span className="text-xs font-medium text-[#5C584E] dark:text-[#A8A295] block">
                Chasing team win rate
              </span>
            </div>
            <p className="text-xs text-[#5C584E] dark:text-[#A8A295] leading-relaxed">
              Teams batting second won 15 of 27 matches, benefiting from clear target visibility in short 36-ball encounters.
            </p>
          </div>

          <div className="bg-[#FAF7F0]/80 dark:bg-[#181A20]/80 backdrop-blur-md rounded-xl p-6 border border-[#DDD5C3]/80 dark:border-[#2A2E38]/80 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 space-y-2 group">
            <span className="text-[10px] font-mono text-[#5C584E] dark:text-[#A8A295] uppercase tracking-wider font-semibold block">
              Knockout crucible
            </span>
            <div className="font-display font-semibold text-3xl text-[#111318] dark:text-[#F1EBDD] tabular-nums">
              9 matches
            </div>
            <p className="text-xs text-[#5C584E] dark:text-[#A8A295] leading-relaxed">
              Semifinals and Finals audited with elevated leverage weighting in the 100-Point Player Intelligence Score.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
