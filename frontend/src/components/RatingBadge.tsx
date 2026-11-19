import React from "react";

interface RatingBadgeProps {
  score: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function RatingBadge({ score, label, size = "md" }: RatingBadgeProps) {
  let tierColor = "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
  let tierLabel = "Specialist";

  if (score >= 75) {
    tierColor = "bg-[#2563EB] dark:bg-[#3B82F6] text-white border-blue-600 dark:border-blue-400 font-bold shadow-sm";
    tierLabel = "Elite / Marquee";
  } else if (score >= 58) {
    tierColor = "bg-cyan-50 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700 font-semibold";
    tierLabel = "High Impact";
  } else if (score >= 42) {
    tierColor = "bg-slate-100 dark:bg-[#1E293B] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 font-medium";
    tierLabel = "Solid Core";
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-semibold",
    md: "px-2.5 py-1 text-sm font-bold",
    lg: "px-3.5 py-1.5 text-xl font-bold font-display",
  };

  return (
    <div className="inline-flex items-center space-x-2">
      <span className={`inline-flex items-center justify-center rounded-lg border font-mono tracking-tight ${tierColor} ${sizeClasses[size]}`}>
        {score.toFixed(1)}
      </span>
      {label && (
        <span className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">
          {label}
        </span>
      )}
    </div>
  );
}
