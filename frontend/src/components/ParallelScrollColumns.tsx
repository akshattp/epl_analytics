"use client";

import React from "react";
import Link from "next/link";
import { Flame, Shield, Trophy, Activity, TrendingUp, Crosshair } from "lucide-react";

export function ParallelScrollColumns() {
  return (
    <section className="relative py-12 space-y-8">
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
            Three independent operational streams: scoring velocity records, defensive suppression baselines, and knockout dynamics.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#5C584E] dark:text-[#A8A295]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF4B35] inline-block" />
          <span>Extracted from 27 verified match logs</span>
        </div>
      </div>

      {/* 3-Column Static Balanced Intelligence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 items-start">
        {/* COLUMN 1: Velocity Records */}
        <div className="space-y-5">
          <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] space-y-3">
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

          <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] space-y-3">
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

          <div className="bg-[#181A20] text-[#F1EBDD] rounded-xl p-6 border border-[#2A2E38] space-y-2">
            <span className="text-[10px] font-mono text-[#A8A295] uppercase tracking-wider font-semibold block">
              Historic innings
            </span>
            <div className="font-display font-semibold text-3xl tabular-nums">62/2</div>
            <p className="text-xs text-[#A8A295] leading-relaxed">
              Exotica Warriors (2025 Match 5) highest team innings total in EPL history. Required run rate reached 10.33 RPO.
            </p>
          </div>
        </div>

        {/* COLUMN 2: Suppression & Defensive Anchors */}
        <div className="space-y-5">
          <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] space-y-3">
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

          <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] space-y-3">
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

          <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] space-y-2">
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

        {/* COLUMN 3: Knockout & Situational Dynamics */}
        <div className="space-y-5">
          <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] space-y-3">
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

          <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] space-y-3">
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

          <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-xl p-6 border border-[#DDD5C3] dark:border-[#2A2E38] space-y-2">
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
