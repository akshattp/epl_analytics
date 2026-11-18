import React from "react";

interface RatingBadgeProps {
  score: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function RatingBadge({ score, label, size = "md" }: RatingBadgeProps) {
  let tierColor = "bg-[#07203F] text-[#EBDED4] border-[#D9AA90]/30";
  let tierLabel = "Specialist";

  if (score >= 75) {
    tierColor = "bg-[#A65E46] text-[#EBDED4] border-[#EBDED4]/40";
    tierLabel = "Elite / Marquee";
  } else if (score >= 58) {
    tierColor = "bg-[#07203F] text-[#D9AA90] border-[#D9AA90]/40";
    tierLabel = "High Impact";
  } else if (score >= 42) {
    tierColor = "bg-[#07203F]/80 text-[#EBDED4] border-[#07203F]";
    tierLabel = "Solid Core";
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-semibold",
    md: "px-3 py-1 text-sm font-bold",
    lg: "px-4 py-2 text-xl font-bold",
  };

  return (
    <div className="inline-flex items-center space-x-2">
      <span className={`inline-flex items-center justify-center rounded border font-mono ${tierColor} ${sizeClasses[size]}`}>
        {score.toFixed(1)}
      </span>
      {label && (
        <span className="text-xs text-[#07203F]/80 font-medium">
          {label}
        </span>
      )}
    </div>
  );
}
