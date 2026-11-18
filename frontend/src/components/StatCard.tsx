import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
}

export function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  return (
    <div className="bg-[#07203F] text-[#EBDED4] rounded-lg p-5 border border-[#D9AA90]/20 shadow-sm hover:border-[#D9AA90]/40 transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-[#D9AA90]">
          {title}
        </span>
        {icon && <div className="text-[#D9AA90]">{icon}</div>}
      </div>
      <div className="font-serif text-2xl lg:text-3xl font-bold tracking-tight text-[#EBDED4]">
        {value}
      </div>
      {subtitle && (
        <p className="text-xs text-[#EBDED4]/70 mt-1.5 leading-relaxed">
          {subtitle}
        </p>
      )}
      {trend && (
        <div className="mt-2 text-[11px] font-medium text-[#D9AA90] flex items-center">
          {trend}
        </div>
      )}
    </div>
  );
}
