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
      className={`rounded-xl p-5 border transition-all duration-200 shadow-sm hover:shadow-md ${
        highlight
          ? "bg-[#FAF7F0] dark:bg-[#181A20] border-[#FF4B35] ring-1 ring-[#FF4B35]/20"
          : "bg-[#FAF7F0] dark:bg-[#181A20] border-[#DDD5C3] dark:border-[#2A2E38] hover:border-[#FF4B35]/40"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5C584E] dark:text-[#A8A296] font-mono">
          {title}
        </span>
        {icon && <div className="text-[#FF4B35]">{icon}</div>}
      </div>
      <div className="font-display text-2xl lg:text-3xl font-bold tracking-tight text-[#111318] dark:text-[#F1EBDD]">
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
