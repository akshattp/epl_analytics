"use client";

import React, { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Star, Flame, Shield, TrendingUp, Sparkles, ChevronRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { RatingBadge } from "@/components/RatingBadge";

interface HorizontalScrollDossiersProps {
  players: any[];
}

function getInitials(name: string): string {
  if (!name) return "EP";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function HorizontalScrollDossiers({ players }: HorizontalScrollDossiersProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;

    if (prefersReducedMotion || isMobile) {
      return; // Fall back to natural horizontal touch scroll or static grid
    }

    const ctx = gsap.context(() => {
      const getScrollDistance = () => Math.max(0, track.scrollWidth - window.innerWidth + 80);

      gsap.to(track, {
        x: () => -getScrollDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top 12%",
          end: () => `+=${getScrollDistance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    }, section);

    return () => ctx.revert();
  }, [players]);

  const displayPlayers = (players && players.length > 0)
    ? players.slice(0, 7)
    : [
        { player_id: "EPL-P-001", name: "Sagar Kapadia", total_runs: 138, strike_rate: 117.5, wickets: 0, economy: 0, role_classification: "Pure Batter", batting_hand: "Right" },
        { player_id: "EPL-P-004", name: "Smeet Shah", total_runs: 45, strike_rate: 98.2, wickets: 5, economy: 3.57, role_classification: "Defensive Bowler", batting_hand: "Right" },
        { player_id: "EPL-P-011", name: "Harshil Patel", total_runs: 115, strike_rate: 142.0, wickets: 6, economy: 5.2, role_classification: "Impact Batter", batting_hand: "Right" },
        { player_id: "EPL-P-017", name: "Krunal Patel", total_runs: 95, strike_rate: 110.0, wickets: 8, economy: 4.8, role_classification: "All-Rounder", batting_hand: "Right" },
      ];

  return (
    <section ref={sectionRef} className="relative py-14 overflow-hidden space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#DDD5C3] dark:border-[#2A2E38] pb-6">
        <div className="space-y-1.5 max-w-2xl">
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-[#FF4B35]">
            03 • CANONICAL ATHLETE DOSSIERS
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-[#111318] dark:text-[#F1EBDD] tracking-tight">
            PINNED HORIZONTAL ATHLETE DOSSIER
          </h2>
          <p className="text-xs sm:text-sm text-[#5C584E] dark:text-[#A8A295] leading-relaxed">
            Scroll vertically to traverse verified canonical profiles. Real historical runs and legal wickets extracted from official scorecards.
          </p>
        </div>
        <Link
          href="/players"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF4B35] hover:underline"
        >
          <span>All 73 Canonical Athletes</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Horizontal Moving Track */}
      <div className="overflow-x-auto md:overflow-visible pb-4 md:pb-0 scrollbar-none">
        <div
          ref={trackRef}
          data-horizontal-track="true"
          className="flex flex-nowrap gap-6 will-change-transform w-max px-2"
        >
          {displayPlayers.map((p, idx) => {
            const runs = p.total_runs ?? p.career_batting?.total_runs ?? 0;
            const sr = p.strike_rate ?? p.career_batting?.strike_rate ?? 0;
            const wkts = p.wickets ?? p.career_bowling?.wickets ?? 0;
            const econ = p.economy ?? p.career_bowling?.economy ?? 0;
            const score = p.player_intelligence?.overall_player_intelligence_score ?? p.ratings?.overall_rating ?? 75;
            const isMarquee = score >= 75;

            return (
              <div
                key={p.player_id}
                className="w-[320px] sm:w-[380px] bg-[#FAF7F0] dark:bg-[#181A20] rounded-2xl p-7 border border-[#DDD5C3] dark:border-[#2A2E38] shadow-md flex flex-col justify-between space-y-6 shrink-0 relative overflow-hidden group hover:border-[#FF4B35] dark:hover:border-[#FF4B35] transition-all duration-300"
              >
                {/* Marquee Ambient Glow Accent in Vermilion */}
                {isMarquee && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF4B35]/10 rounded-full blur-2xl pointer-events-none" />
                )}

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase font-bold text-[#FF4B35] bg-[#FF4B35]/10 px-3 py-1 rounded-full border border-[#FF4B35]/20">
                      {p.player_id}
                    </span>
                    <RatingBadge score={score} size="sm" />
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#181A20] to-[#111318] text-[#F1EBDD] flex items-center justify-center font-display font-black text-xl border border-[#2A2E38] shadow-md shrink-0">
                      {getInitials(p.name)}
                    </div>
                    <div>
                      <h3 className="font-display font-black text-2xl text-[#111318] dark:text-[#F1EBDD] group-hover:text-[#FF4B35] dark:group-hover:text-[#FF4B35] transition-colors leading-tight">
                        {p.name}
                      </h3>
                      <span className="text-xs text-[#5C584E] dark:text-[#A8A295] font-semibold uppercase tracking-wider block mt-0.5">
                        {p.role_classification || p.primary_role} • {p.batting_hand}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verified Ground-Truth Statistics Grid */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#DDD5C3] dark:border-[#2A2E38] text-xs relative z-10">
                  <div className="bg-[#F1EBDD]/60 dark:bg-[#111318] p-3.5 rounded-xl border border-[#DDD5C3]/80 dark:border-[#2A2E38]">
                    <span className="text-[10px] text-[#5C584E] dark:text-[#A8A295] block uppercase font-bold">
                      Career Runs
                    </span>
                    <span className="font-mono font-bold text-2xl text-[#111318] dark:text-[#F1EBDD]">
                      {runs}
                    </span>
                    <span className="text-[10px] text-[#5C584E] dark:text-[#A8A295] block mt-0.5">
                      SR: <strong className="text-[#111318] dark:text-[#F1EBDD]">{Number(sr).toFixed(1)}</strong>
                    </span>
                  </div>

                  <div className="bg-[#F1EBDD]/60 dark:bg-[#111318] p-3.5 rounded-xl border border-[#DDD5C3]/80 dark:border-[#2A2E38]">
                    <span className="text-[10px] text-[#5C584E] dark:text-[#A8A295] block uppercase font-bold">
                      Wickets Taken
                    </span>
                    <span className="font-mono font-bold text-2xl text-[#FF4B35]">
                      {wkts}
                    </span>
                    <span className="text-[10px] text-[#5C584E] dark:text-[#A8A295] block mt-0.5">
                      Econ: <strong className="text-[#111318] dark:text-[#F1EBDD]">{wkts > 0 || p.legal_balls > 0 ? Number(econ).toFixed(2) : "—"}</strong>
                    </span>
                  </div>
                </div>

                {/* Action Link to Full Dossier */}
                <div className="pt-2 flex items-center justify-between text-xs font-semibold text-[#FF4B35] relative z-10">
                  <Link
                    href={`/players/${p.player_id}`}
                    className="inline-flex items-center gap-1.5 hover:underline"
                  >
                    <span>Inspect Athlete Dossier</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  </Link>
                  <span className="font-mono text-[10px] text-[#8C867A] dark:text-[#6E6A60]">
                    #{idx + 1}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
