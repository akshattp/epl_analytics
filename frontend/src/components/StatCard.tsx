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
          ? "bg-blue-50/30 dark:bg-blue-950/20 border-[#2563EB] dark:border-[#3B82F6] ring-1 ring-[#2563EB]/20 dark:ring-[#3B82F6]/30"
          : "bg-white dark:bg-[#151F32] border-[#E2E8F0] dark:border-[#334155] hover:border-[#CBD5E1] dark:hover:border-[#475569]"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
          {title}
        </span>
        {icon && <div className="text-[#2563EB] dark:text-[#38BDF8]">{icon}</div>}
      </div>
      <div className="font-display text-2xl lg:text-3xl font-bold tracking-tight text-[#101828] dark:text-[#F8FAFC]">
        {value}
      </div>
      {subtitle && (
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
          {subtitle}
        </p>
      )}
      {trend && (
        <div className="mt-2.5 text-[11px] font-mono font-medium text-[#2563EB] dark:text-[#38BDF8] flex items-center gap-1">
          {trend}
        </div>
      )}
    </div>
  );
}
