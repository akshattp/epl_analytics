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
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    }, section);

    return () => ctx.revert();
  }, [players]);

  const displayPlayers = players.slice(0, 6);

  return (
    <section ref={sectionRef} className="relative py-12 overflow-hidden space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E8F0] dark:border-[#334155] pb-6">
        <div className="space-y-1 max-w-2xl">
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-[#2563EB] dark:text-[#38BDF8]">
            03 • SIGNATURE ATHLETE SHOWCASE
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-[#101828] dark:text-[#F8FAFC] tracking-tight">
            PINNED HORIZONTAL ATHLETE DOSSIER
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
            Scroll vertically to traverse verified canonical profiles. Real historical runs and legal wickets extracted from official scorecards.
          </p>
        </div>
        <Link
          href="/players"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] dark:text-[#38BDF8] hover:underline"
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
                className="w-[320px] sm:w-[380px] bg-white dark:bg-[#151F32] rounded-3xl p-7 border border-[#E2E8F0] dark:border-[#334155] shadow-md flex flex-col justify-between space-y-6 shrink-0 relative overflow-hidden group hover:border-[#2563EB] dark:hover:border-[#38BDF8] transition-all duration-300"
              >
                {/* Marquee Ambient Glow Accent */}
                {isMarquee && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                )}

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase font-bold text-[#2563EB] dark:text-[#38BDF8] bg-blue-50 dark:bg-[#0B1120] px-3 py-1 rounded-full border border-blue-200 dark:border-[#334155]">
                      {p.player_id}
                    </span>
                    <RatingBadge score={score} size="sm" />
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center font-display font-black text-xl border border-white/20 shadow-md shrink-0">
                      {getInitials(p.name)}
                    </div>
                    <div>
                      <h3 className="font-display font-black text-2xl text-[#101828] dark:text-[#F8FAFC] group-hover:text-[#2563EB] dark:group-hover:text-[#38BDF8] transition-colors leading-tight">
                        {p.name}
                      </h3>
                      <span className="text-xs text-[#64748B] dark:text-[#94A3B8] font-semibold uppercase tracking-wider block mt-0.5">
                        {p.role_classification || p.primary_role} • {p.batting_hand}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verified Ground-Truth Statistics Grid */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#E2E8F0] dark:border-[#334155] text-xs relative z-10">
                  <div className="bg-[#F8FAFC] dark:bg-[#0B1120] p-3.5 rounded-2xl border border-slate-200 dark:border-[#1E293B]">
                    <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block uppercase font-bold">
                      Career Runs
                    </span>
                    <span className="font-mono font-bold text-2xl text-[#101828] dark:text-[#F8FAFC]">
                      {runs}
                    </span>
                    <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block mt-0.5">
                      SR: <strong className="text-[#101828] dark:text-[#F8FAFC]">{Number(sr).toFixed(1)}</strong>
                    </span>
                  </div>

                  <div className="bg-[#F8FAFC] dark:bg-[#0B1120] p-3.5 rounded-2xl border border-slate-200 dark:border-[#1E293B]">
                    <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block uppercase font-bold">
                      Wickets Taken
                    </span>
                    <span className="font-mono font-bold text-2xl text-[#2563EB] dark:text-[#38BDF8]">
                      {wkts}
                    </span>
                    <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block mt-0.5">
                      Econ: <strong className="text-[#101828] dark:text-[#F8FAFC]">{wkts > 0 || p.legal_balls > 0 ? Number(econ).toFixed(2) : "—"}</strong>
                    </span>
                  </div>
                </div>

                {/* Action Link to Full Dossier */}
                <div className="pt-2 flex items-center justify-between text-xs font-semibold text-[#2563EB] dark:text-[#38BDF8] relative z-10">
                  <Link
                    href={`/players/${p.player_id}`}
                    className="inline-flex items-center gap-1.5 hover:underline"
                  >
                    <span>Inspect Athlete Dossier</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  </Link>
                  <span className="font-mono text-[10px] text-slate-400">
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
