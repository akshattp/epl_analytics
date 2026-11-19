"use client";

import React from "react";
import { motion } from "framer-motion";

export interface EplBrandLogoProps {
  variant?: "full" | "monogram" | "icon" | "hero" | "horizontal";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero";
  animated?: boolean;
  className?: string;
  showSubtitle?: boolean;
}

export function EplBrandLogo({
  variant = "full",
  size = "md",
  animated = false,
  className = "",
  showSubtitle = true,
}: EplBrandLogoProps) {
  // Dimensions mapping
  const sizeMap = {
    xs: { crestSize: 24, fontSize: "text-xs", textGap: "gap-1.5" },
    sm: { crestSize: 32, fontSize: "text-sm", textGap: "gap-2" },
    md: { crestSize: 40, fontSize: "text-base", textGap: "gap-2.5" },
    lg: { crestSize: 52, fontSize: "text-xl", textGap: "gap-3" },
    xl: { crestSize: 64, fontSize: "text-2xl", textGap: "gap-3.5" },
    hero: { crestSize: 96, fontSize: "text-4xl sm:text-5xl", textGap: "gap-5" },
  };

  const { crestSize, fontSize, textGap } = sizeMap[size];

  // Original geometric cricket crest
  // Combines:
  // 1. Three vertical kinetic angled pillars (The 3 Stumps / Wickets of cricket)
  // 2. Continuous interlocking aerodynamic ribbon forming 'E', 'P', and 'L'
  // 3. Curved seam arc sweeping from bottom-left to top-right (Cricket ball seam & trajectory)
  // 4. Precision analytical core point at apex
  const CrestSvg = (
    <svg
      width={crestSize}
      height={crestSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-300 group-hover:scale-105"
      aria-label="EPL Geometric Cricket Crest"
    >
      <defs>
        {/* Core Electric Blue to Cyan Gradient */}
        <linearGradient id="epl-grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>

        {/* Speed Arc Gradient */}
        <linearGradient id="epl-grad-accent" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0891B2" />
          <stop offset="60%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>

        {/* Deep Ink Facet Gradient */}
        <linearGradient id="epl-grad-dark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        {/* Dynamic Glow Filter */}
        <filter id="epl-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Hexagonal Shield Contour */}
      <polygon
        points="50,4 90,26 90,74 50,96 10,74 10,26"
        className="stroke-[#E2E8F0] dark:stroke-[#334155]"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
      />

      {/* Kinetic Pillar 1 (Left Stump / Stem of E) */}
      <path
        d="M24 30 L32 25 L32 75 L24 70 Z"
        fill="url(#epl-grad-primary)"
      />

      {/* Kinetic Pillar 2 (Center Middle Stump / Core Spine of P) */}
      <path
        d="M44 20 L52 15 L52 75 L44 80 Z"
        fill="url(#epl-grad-primary)"
        opacity="0.95"
      />

      {/* Kinetic Pillar 3 (Right Stump / Leg of L) */}
      <path
        d="M64 35 L72 30 L72 85 L64 80 Z"
        fill="url(#epl-grad-accent)"
      />

      {/* Horizontal Stance Bars forming 'E' and 'L' Baseline */}
      {/* Top Bar of 'E' */}
      <path
        d="M32 25 L58 25 L54 33 L32 33 Z"
        fill="url(#epl-grad-primary)"
      />
      {/* Middle Bar of 'E' */}
      <path
        d="M32 46 L50 46 L46 53 L32 53 Z"
        fill="url(#epl-grad-accent)"
      />
      {/* Dynamic Loop of 'P' (Sweeping Arc) */}
      <path
        d="M52 20 C68 20, 78 28, 78 40 C78 52, 66 58, 52 58 L52 48 C60 48, 66 45, 66 39 C66 33, 60 30, 52 30 Z"
        fill="url(#epl-grad-accent)"
      />

      {/* Baseline Foot of 'L' */}
      <path
        d="M64 74 L84 74 L80 82 L64 82 Z"
        fill="url(#epl-grad-primary)"
      />

      {/* Cricket Ball Dynamic Seam Swoosh (Transversal 45-degree Kinetic Trajectory) */}
      <path
        d="M14 78 Q 48 58, 86 22"
        stroke="url(#epl-grad-accent)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="6 3"
      />

      {/* Analytical Precision Core Point (Apex Sensor) */}
      <circle
        cx="86"
        cy="22"
        r="4.5"
        fill="#22D3EE"
        filter="url(#epl-glow)"
      />
      <circle cx="86" cy="22" r="2.5" fill="#FFFFFF" />
    </svg>
  );

  // Icon Only Variant
  if (variant === "monogram" || variant === "icon") {
    return (
      <div className={`relative inline-flex items-center justify-center ${className}`}>
        {animated ? (
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {CrestSvg}
          </motion.div>
        ) : (
          CrestSvg
        )}
      </div>
    );
  }

  // Hero Centerpiece Variant
  if (variant === "hero") {
    return (
      <div className={`flex flex-col items-center justify-center text-center ${className}`}>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative group mb-4"
        >
          {/* Ambient Glow Aura */}
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-cyan-500/25 to-blue-600/20 blur-2xl rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          {CrestSvg}
        </motion.div>

        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-1"
        >
          <div className="flex items-center justify-center gap-3">
            <span className="font-display font-black tracking-tight text-4xl sm:text-6xl text-[#101828] dark:text-[#F8FAFC]">
              EPL
            </span>
            <span className="h-8 w-[2px] bg-[#E2E8F0] dark:bg-[#334155] rounded-full mx-1"></span>
            <span className="font-display font-extrabold tracking-widest text-3xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#0891B2] dark:from-[#3B82F6] dark:to-[#22D3EE]">
              INTELLIGENCE
            </span>
          </div>
          {showSubtitle && (
            <p className="font-sans text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-[#64748B] dark:text-[#94A3B8]">
              Exotica Premier League • Cricket Analytics Platform
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  // Default Full Horizontal Brand Lockup
  return (
    <div className={`inline-flex items-center ${textGap} ${className} group`}>
      {CrestSvg}

      <div className="flex flex-col justify-center select-none">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-display font-black tracking-tight text-[#101828] dark:text-[#F8FAFC] ${fontSize}`}>
            EPL
          </span>
          <span className={`font-display font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#0891B2] dark:from-[#3B82F6] dark:to-[#22D3EE] ${fontSize}`}>
            ANALYTICS
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[9px] sm:text-[10px] font-sans uppercase tracking-[0.18em] font-semibold text-[#64748B] dark:text-[#94A3B8] mt-0.5 leading-none">
            Exotica Premier League
          </span>
        )}
      </div>
    </div>
  );
}
