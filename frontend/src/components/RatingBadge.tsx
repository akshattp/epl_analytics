import React from "react";

interface RatingBadgeProps {
  score: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function RatingBadge({ score, label, size = "md" }: RatingBadgeProps) {
  let tierColor = "bg-[#FAF7F0]/70 dark:bg-[#181A20]/70 backdrop-blur-md text-[#5C584E] dark:text-[#A8A295] border-[#DDD5C3]/80 dark:border-[#2A2E38]/80 shadow-xs";
  let tierLabel = "Specialist";

  if (score >= 75) {
    tierColor = "bg-[#FF4B35]/90 backdrop-blur-md text-white border-[#E03E29] font-bold shadow-md shadow-[#FF4B35]/25 hover:scale-105 transition-transform duration-200";
    tierLabel = "Elite / Marquee";
  } else if (score >= 58) {
    tierColor = "bg-[#181A20]/80 text-[#F1EBDD] dark:bg-[#FAF7F0]/85 dark:text-[#111318] backdrop-blur-md border-[#2A2E38] dark:border-[#DDD5C3] font-semibold hover:scale-105 transition-transform duration-200";
    tierLabel = "High Impact";
  } else if (score >= 42) {
    tierColor = "bg-[#FAF7F0]/75 dark:bg-[#22252D]/75 text-[#111318] dark:text-[#F1EBDD] backdrop-blur-md border-[#DDD5C3] dark:border-[#2A2E38] font-medium hover:scale-105 transition-transform duration-200";
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
