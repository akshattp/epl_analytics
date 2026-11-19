import React from "react";

interface RatingBadgeProps {
  score: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function RatingBadge({ score, label, size = "md" }: RatingBadgeProps) {
  let tierColor = "bg-[#02000D] text-[#EBDED4]/80 border-[#D9AA90]/25";
  let tierLabel = "Specialist";

  if (score >= 75) {
    tierColor = "bg-[#A65E46] text-[#EBDED4] border-[#EBDED4]/40 font-bold";
    tierLabel = "Elite / Marquee";
  } else if (score >= 58) {
    tierColor = "bg-[#07203F] text-[#D9AA90] border-[#D9AA90]/50 font-semibold";
    tierLabel = "High Impact";
  } else if (score >= 42) {
    tierColor = "bg-[#07203F]/90 text-[#EBDED4] border-[#D9AA90]/25";
    tierLabel = "Solid Core";
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-semibold",
    md: "px-2.5 py-1 text-sm font-bold",
    lg: "px-3.5 py-1.5 text-xl font-bold",
  };

  return (
    <div className="inline-flex items-center space-x-2">
      <span className={`inline-flex items-center justify-center rounded border font-mono tracking-tight ${tierColor} ${sizeClasses[size]}`}>
        {score.toFixed(1)}
      </span>
      {label && (
        <span className="text-xs text-[#D9AA90] font-medium">
          {label}
        </span>
      )}
    </div>
  );
}
