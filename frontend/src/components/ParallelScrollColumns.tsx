"use client";

import React, { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { Flame, Shield, Trophy, Activity, Award, TrendingUp, Crosshair, ArrowRight, Sparkles } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function ParallelScrollColumns() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const col1Ref = useRef<HTMLDivElement | null>(null);
  const col2Ref = useRef<HTMLDivElement | null>(null);
  const col3Ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    // Register plugin inside client effect safely
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    if (!section) return;

    // Check reduced motion or narrow screen
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;

    if (prefersReducedMotion || isMobile) {
      return; // Fall back to natural, non-animated grid for accessibility and performance
    }

    const ctx = gsap.context(() => {
      // Column 1: Moves upward (-140px)
      if (col1Ref.current) {
        gsap.fromTo(
          col1Ref.current,
          { y: 80 },
          {
            y: -140,
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

      // Column 2: Opposing direction! Moves downward (+120px)
      if (col2Ref.current) {
        gsap.fromTo(
          col2Ref.current,
          { y: -100 },
          {
            y: 120,
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

      // Column 3: Moves upward at different velocity (-200px)
      if (col3Ref.current) {
        gsap.fromTo(
          col3Ref.current,
          { y: 120 },
          {
            y: -200,
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
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-[#FF4B35]">
            02 • MULTI-AXIS HISTORICAL INTELLIGENCE
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-[#111318] dark:text-[#F1EBDD] tracking-tight">
            PARALLEL TELEMETRY STREAM
          </h2>
          <p className="text-xs sm:text-sm text-[#5C584E] dark:text-[#A8A295] leading-relaxed">
            Three independent operational streams moving across distinct analytical dimensions: Velocity Records, Suppression Baselines, and Knockout Dynamics.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#5C584E] dark:text-[#A8A295]">
          <span className="w-2 h-2 rounded-full bg-[#FF4B35] inline-block" />
          <span>Opposing Motion Synchronized via ScrollTrigger</span>
        </div>
      </div>

      {/* 3-Column Parallel Moving Canvas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 min-h-[580px]">
        {/* COLUMN 1: Ascending Stream (Velocity Records) */}
        <div
          ref={col1Ref}
          data-parallel-column="asc-1"
          className="space-y-5 will-change-transform"
        >
          <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-2xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-[#FF4B35]/10 text-[#FF4B35]">
                <Flame className="w-5 h-5" />
              </span>
              <span className="font-mono text-[10px] text-[#FF4B35] font-bold uppercase tracking-wider">
                All-Time Run Benchmark
              </span>
            </div>
            <div className="space-y-1">
              <span className="font-display font-black text-4xl text-[#111318] dark:text-[#F1EBDD]">
                138
              </span>
              <span className="text-xs font-bold text-[#5C584E] dark:text-[#A8A295] block">
                Total Runs (Sagar Kapadia)
              </span>
            </div>
            <p className="text-xs text-[#5C584E] dark:text-[#A8A295] leading-relaxed">
              134 regulation runs + 4 Super Over runs across 12 tournament matches. 17 all-time boundaries scored at 117.5 strike rate.
            </p>
          </div>

          <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-2xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-[#FF4B35]/10 text-[#FF4B35]">
                <TrendingUp className="w-5 h-5" />
              </span>
              <span className="font-mono text-[10px] text-[#FF4B35] font-bold uppercase tracking-wider">
                Boundary Surge
              </span>
            </div>
            <div className="space-y-1">
              <span className="font-display font-black text-4xl text-[#FF4B35]">
                +96.5%
              </span>
              <span className="text-xs font-bold text-[#5C584E] dark:text-[#A8A295] block">
                Boundary Evolution Rate
              </span>
            </div>
            <p className="text-xs text-[#5C584E] dark:text-[#A8A295] leading-relaxed">
              Tournament boundary scoring doubled from 3.11 boundaries per match in 2023 to 6.11 per match in 2025 as hitting velocity matured.
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#181A20] to-[#111318] text-[#F1EBDD] rounded-2xl p-6 border border-[#2A2E38] shadow-lg space-y-3">
            <span className="text-[10px] font-mono text-[#FF4B35] uppercase tracking-widest font-bold block">
              Historic Innings
            </span>
            <div className="font-display font-black text-3xl">62/2</div>
            <p className="text-xs text-[#A8A295] leading-relaxed">
              Exotica Warriors (2025 Match 5) highest team innings total in EPL history. Required run rate reached 10.33 RPO.
            </p>
          </div>
        </div>

        {/* COLUMN 2: Descending Stream (Suppression & Defensive Anchors) - Opposing Direction! */}
        <div
          ref={col2Ref}
          data-parallel-column="desc-1"
          className="space-y-5 will-change-transform"
        >
          <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-2xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-[#FF4B35]/10 text-[#FF4B35]">
                <Shield className="w-5 h-5" />
              </span>
              <span className="font-mono text-[10px] text-[#FF4B35] font-bold uppercase tracking-wider">
                Economy Benchmark
              </span>
            </div>
            <div className="space-y-1">
              <span className="font-display font-black text-4xl text-[#111318] dark:text-[#F1EBDD]">
                3.57
              </span>
              <span className="text-xs font-bold text-[#5C584E] dark:text-[#A8A295] block">
                Career Economy (Smeet Shah)
              </span>
            </div>
            <p className="text-xs text-[#5C584E] dark:text-[#A8A295] leading-relaxed">
              Lowest economy rate among bowlers with &ge; 30 legal balls bowled. 44 legal deliveries, 26 runs conceded, 56.8% dot ball rate.
            </p>
          </div>

          <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-2xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-[#FF4B35]/10 text-[#FF4B35]">
                <Crosshair className="w-5 h-5" />
              </span>
              <span className="font-mono text-[10px] text-[#FF4B35] font-bold uppercase tracking-wider">
                Defensive Miracle
              </span>
            </div>
            <div className="space-y-1">
              <span className="font-display font-black text-4xl text-[#111318] dark:text-[#F1EBDD]">
                30
              </span>
              <span className="text-xs font-bold text-[#5C584E] dark:text-[#A8A295] block">
                Lowest Defended Total
              </span>
            </div>
            <p className="text-xs text-[#5C584E] dark:text-[#A8A295] leading-relaxed">
              ACER ASPIRE successfully defended 30 runs against ACER SWIFT (24 all-out) in the 2024 Semifinal 2 under extreme knockout pressure.
            </p>
          </div>

          <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-2xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm space-y-2">
            <span className="text-[10px] font-mono text-[#FF4B35] uppercase tracking-widest font-bold block">
              Dot Ball Ledger
            </span>
            <div className="font-display font-black text-3xl text-[#111318] dark:text-[#F1EBDD]">
              827
            </div>
            <p className="text-xs text-[#5C584E] dark:text-[#A8A295] leading-relaxed">
              Verified legal dot balls recorded across 277 regulation spells, representing 49.8% of all balls bowled.
            </p>
          </div>
        </div>

        {/* COLUMN 3: Fast Ascending Stream (Knockout & Situational Dynamics) */}
        <div
          ref={col3Ref}
          data-parallel-column="asc-2"
          className="space-y-5 will-change-transform"
        >
          <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-2xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-[#FF4B35]/10 text-[#FF4B35]">
                <Trophy className="w-5 h-5" />
              </span>
              <span className="font-mono text-[10px] text-[#FF4B35] font-bold uppercase tracking-wider">
                Toss Neutrality
              </span>
            </div>
            <div className="space-y-1">
              <span className="font-display font-black text-4xl text-[#111318] dark:text-[#F1EBDD]">
                48.1%
              </span>
              <span className="text-xs font-bold text-[#5C584E] dark:text-[#A8A295] block">
                Toss Winner Match Rate
              </span>
            </div>
            <p className="text-xs text-[#5C584E] dark:text-[#A8A295] leading-relaxed">
              Teams winning the coin toss won 13 of 27 matches, confirming zero systemic toss advantage in underarm conditions.
            </p>
          </div>

          <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-2xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-[#FF4B35]/10 text-[#FF4B35]">
                <Activity className="w-5 h-5" />
              </span>
              <span className="font-mono text-[10px] text-[#FF4B35] font-bold uppercase tracking-wider">
                Run Chase Advantage
              </span>
            </div>
            <div className="space-y-1">
              <span className="font-display font-black text-4xl text-[#FF4B35]">
                55.6%
              </span>
              <span className="text-xs font-bold text-[#5C584E] dark:text-[#A8A295] block">
                Chasing Team Win Rate
              </span>
            </div>
            <p className="text-xs text-[#5C584E] dark:text-[#A8A295] leading-relaxed">
              Teams batting second won 15 of 27 matches, benefiting from clear target visibility in short 36-ball encounters.
            </p>
          </div>

          <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-2xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm space-y-3">
            <span className="text-[10px] font-mono text-[#FF4B35] uppercase tracking-widest font-bold block">
              Knockout Crucible
            </span>
            <div className="font-display font-black text-3xl text-[#111318] dark:text-[#F1EBDD]">
              9 Matches
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
