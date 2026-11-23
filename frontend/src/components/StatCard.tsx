import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  highlight?: boolean;
}

export function StatCard({ title, value, subtitle, icon, trend, highlight }: StatCardProps) {
  return (
    <div
      className={`rounded-xl p-5 border backdrop-blur-md transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-[1.02] ${
        highlight
          ? "bg-[#FAF7F0]/85 dark:bg-[#181A20]/85 border-[#FF4B35] ring-1 ring-[#FF4B35]/20 shadow-[#FF4B35]/10"
          : "bg-[#FAF7F0]/70 dark:bg-[#181A20]/70 border-[#DDD5C3]/80 dark:border-[#2A2E38]/80 hover:border-[#FF4B35]/50"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5C584E] dark:text-[#A8A296] font-mono">
          {title}
        </span>
        {icon && <div className="text-[#FF4B35] transition-transform duration-300 group-hover:scale-110">{icon}</div>}
      </div>
      <div className="font-display text-2xl lg:text-3xl font-bold tracking-tight text-[#111318] dark:text-[#F1EBDD] tabular-nums">
        {value}
      </div>
      {subtitle && (
        <p className="text-xs text-[#5C584E] dark:text-[#A8A296] mt-1.5 leading-relaxed">
          {subtitle}
        </p>
      )}
      {trend && (
        <div className="mt-2.5 text-[11px] font-mono font-medium text-[#FF4B35] flex items-center gap-1">
          {trend}
        </div>
      )}
    </div>
  );
}
