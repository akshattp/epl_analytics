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
      className={`rounded-xl p-5 border transition-all duration-200 shadow-md ${
        highlight
          ? "bg-[#07203F] border-[#A65E46] shadow-[#A65E46]/10"
          : "bg-[#07203F] border-[#D9AA90]/25 hover:border-[#D9AA90]/50"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D9AA90]">
          {title}
        </span>
        {icon && <div className="text-[#D9AA90]/90">{icon}</div>}
      </div>
      <div className="font-serif text-2xl lg:text-3xl font-bold tracking-tight text-[#EBDED4]">
        {value}
      </div>
      {subtitle && (
        <p className="text-xs text-[#EBDED4]/75 mt-1.5 leading-relaxed">
          {subtitle}
        </p>
      )}
      {trend && (
        <div className="mt-2.5 text-[11px] font-mono text-[#D9AA90] flex items-center gap-1">
          {trend}
        </div>
      )}
    </div>
  );
}
