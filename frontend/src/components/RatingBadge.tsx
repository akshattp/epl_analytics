import React from "react";

interface RatingBadgeProps {
  score: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function RatingBadge({ score, label, size = "md" }: RatingBadgeProps) {
  let tierColor = "bg-[#E8E1D1]/60 dark:bg-[#181A20] text-[#5C584E] dark:text-[#A8A295] border-[#DDD5C3] dark:border-[#2A2E38]";
  let tierLabel = "Specialist";

  if (score >= 75) {
    tierColor = "bg-[#FF4B35] text-white border-[#E03E29] font-bold shadow-md shadow-[#FF4B35]/20";
    tierLabel = "Elite / Marquee";
  } else if (score >= 58) {
    tierColor = "bg-[#181A20] text-[#F1EBDD] dark:bg-[#FAF7F0] dark:text-[#111318] border-[#2A2E38] dark:border-[#DDD5C3] font-semibold";
    tierLabel = "High Impact";
  } else if (score >= 42) {
    tierColor = "bg-[#FAF7F0] dark:bg-[#22252D] text-[#111318] dark:text-[#F1EBDD] border-[#DDD5C3] dark:border-[#2A2E38] font-medium";
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
        <span className="text-xs text-[#5C584E] dark:text-[#A8A295] font-medium">
          {label}
        </span>
      )}
    </div>
  );
}
