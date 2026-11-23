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

  // Luxury Architectural Cricket Crest:
  // - 3 Precision-Beveled Angular Wickets (The 3 Stumps of Cricket)
  // - Interlocking Monogram Geometry forming 'E', 'P', and 'L'
  // - Sweeping Electric Vermilion (#FF4B35) Seam Trajectory Arc
  // - Precision Apex Diamond Telemetry Pip
  const CrestSvg = (
    <svg
      width={crestSize}
      height={crestSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-label="EPL Luxury Cricket Crest"
    >
      <defs>
        {/* Luxury Obsidian to Carbon Gradient */}
        <linearGradient id="epl-obsidian-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22252D" />
          <stop offset="60%" stopColor="#181A20" />
          <stop offset="100%" stopColor="#111318" />
        </linearGradient>

        {/* Warm Ivory Facet Gradient */}
        <linearGradient id="epl-ivory-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#F1EBDD" />
          <stop offset="100%" stopColor="#DDD5C3" />
        </linearGradient>

        {/* Electric Vermilion Speed Gradient */}
        <linearGradient id="epl-vermilion-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E03E29" />
          <stop offset="60%" stopColor="#FF4B35" />
          <stop offset="100%" stopColor="#FF6452" />
        </linearGradient>
      </defs>

      {/* Outer Hexagonal Shield Contour */}
      <polygon
        points="50,5 88,27 88,73 50,95 12,73 12,27"
        className="stroke-[#DDD5C3] dark:stroke-[#2A2E38]"
        strokeWidth="1.5"
        fill="none"
        opacity="0.85"
      />

      {/* Kinetic Pillar 1 (Left Stump / Stem of E) */}
      <path
        d="M24 30 L32 25 L32 75 L24 70 Z"
        className="fill-[#111318] dark:fill-[#FAF7F0]"
      />

      {/* Kinetic Pillar 2 (Center Middle Stump / Core Spine of P) */}
      <path
        d="M44 20 L52 15 L52 75 L44 80 Z"
        className="fill-[#181A20] dark:fill-[#F1EBDD]"
        opacity="0.95"
      />

      {/* Kinetic Pillar 3 (Right Stump / Leg of L) */}
      <path
        d="M64 35 L72 30 L72 85 L64 80 Z"
        className="fill-[#5C584E] dark:fill-[#DDD5C3]"
      />

      {/* Horizontal Stance Bars forming 'E' */}
      <path
        d="M32 25 L58 25 L54 33 L32 33 Z"
        className="fill-[#111318] dark:fill-[#FAF7F0]"
      />
      <path
        d="M32 46 L50 46 L46 53 L32 53 Z"
        fill="url(#epl-vermilion-grad)"
      />

      {/* Dynamic Loop of 'P' */}
      <path
        d="M52 20 C68 20, 78 28, 78 40 C78 52, 66 58, 52 58 L52 48 C60 48, 66 45, 66 39 C66 33, 60 30, 52 30 Z"
        className="fill-[#181A20] dark:fill-[#F1EBDD]"
      />

      {/* Baseline Foot of 'L' */}
      <path
        d="M64 74 L84 74 L80 82 L64 82 Z"
        className="fill-[#111318] dark:fill-[#FAF7F0]"
      />

      {/* Cricket Ball Dynamic Seam Swoosh (Transversal 45-degree Kinetic Trajectory) */}
      <path
        d="M14 78 Q 48 58, 86 22"
        stroke="url(#epl-vermilion-grad)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="6 3"
      />

      {/* Analytical Precision Core Point (Apex Vermilion Sensor) */}
      <circle
        cx="86"
        cy="22"
        r="4.5"
        fill="#FF4B35"
      />
      <circle cx="86" cy="22" r="2.2" fill="#F1EBDD" />
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
          className="relative mb-4"
        >
          {CrestSvg}
        </motion.div>

        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-1"
        >
          <div className="flex items-center justify-center gap-3">
            <span className="font-display font-black tracking-[-0.03em] text-4xl sm:text-6xl text-[#111318] dark:text-[#F1EBDD]">
              EPL
            </span>
            <span className="h-8 w-[2px] bg-[#DDD5C3] dark:bg-[#2A2E38] rounded-full mx-1"></span>
            <span className="font-display font-extrabold tracking-widest text-3xl sm:text-5xl text-[#FF4B35]">
              INTELLIGENCE
            </span>
          </div>
          {showSubtitle && (
            <p className="font-sans text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-[#5C584E] dark:text-[#A8A295]">
              Exotica Premier League • Luxury Cricket Analytics
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
          <span className={`font-display font-black tracking-[-0.03em] text-[#111318] dark:text-[#F1EBDD] ${fontSize}`}>
            EPL
          </span>
          <span className={`font-display font-bold tracking-tight text-[#FF4B35] ${fontSize}`}>
            ANALYTICS
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[9px] sm:text-[10px] font-sans uppercase tracking-[0.18em] font-semibold text-[#5C584E] dark:text-[#A8A295] mt-0.5 leading-none">
            Exotica Premier League
          </span>
        )}
      </div>
    </div>
  );
}
