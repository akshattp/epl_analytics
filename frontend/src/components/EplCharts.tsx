"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  ComposedChart,
  ScatterChart, Scatter, ZAxis,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import { useTheme } from "@/lib/theme";

export const EPL_PALETTE = {
  blue: "#FF4B35", // Electric Vermilion accent
  electricBlue: "#FF4B35",
  vermilion: "#FF4B35",
  vermilionDark: "#E03E29",
  cyan: "#E8E1D1",
  cyanDark: "#5C584E",
  midnight: "#111318",
  deepInk: "#181A20",
  obsidian: "#111318",
  ivory: "#F1EBDD",
  ivoryLight: "#FAF7F0",
  slate: "#5C584E",
  slateLight: "#A8A296",
  // Backward compatibility keys mapped to new luxury palette
  peach: "#FF4B35",
  terracotta: "#E03E29",
  navy: "#111318",
  beige: "#F1EBDD",
};

interface ChartCardProps {
  title: string;
  definition: string;
  interpretation?: string;
  empty?: boolean;
  emptyText?: string;
  height?: number;
  children: React.ReactNode;
}

export function ChartCard({
  title,
  definition,
  interpretation,
  empty = false,
  emptyText = "Insufficient historical data to render this chart.",
  height = 260,
  children,
}: ChartCardProps) {
  return (
    <div className="bg-[#FAF7F0] dark:bg-[#181A20] rounded-xl border border-[#DDD5C3] dark:border-[#2A2E38] shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between print-avoid-break text-[#111318] dark:text-[#F1EBDD]">
      <div className="mb-3 border-b border-[#DDD5C3] dark:border-[#2A2E38] pb-2.5">
        <h3 className="font-display text-base font-bold text-[#111318] dark:text-[#F1EBDD] tracking-tight">{title}</h3>
        <p className="text-[11px] text-[#5C584E] dark:text-[#A8A296] mt-0.5">{definition}</p>
      </div>

      {empty ? (
        <div
          style={{ height }}
          className="flex items-center justify-center bg-[#F1EBDD] dark:bg-[#111318] rounded-lg border border-dashed border-[#DDD5C3] dark:border-[#2A2E38] text-xs text-[#5C584E] dark:text-[#A8A296] italic px-4 text-center"
        >
          {emptyText}
        </div>
      ) : (
        <div style={{ width: "100%", height }}>{children}</div>
      )}

      {interpretation && (
        <div className="mt-3 pt-2.5 border-t border-[#DDD5C3] dark:border-[#2A2E38] text-[11px] text-[#5C584E] dark:text-[#A8A296] leading-relaxed">
          <span className="font-semibold text-[#FF4B35] uppercase tracking-wider text-[10px] mr-1.5 font-mono">
            Interpretation:
          </span>
          {interpretation}
        </div>
      )}
    </div>
  );
}

function useChartTheme() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return {
    isDark,
    tooltipStyle: {
      backgroundColor: isDark ? "#181A20" : "#FAF7F0",
      border: isDark ? "1px solid #2A2E38" : "1px solid #DDD5C3",
      borderRadius: "8px",
      color: isDark ? "#F1EBDD" : "#111318",
      fontSize: "11px",
      padding: "8px 12px",
      boxShadow: isDark ? "0 6px 16px rgba(0, 0, 0, 0.45)" : "0 4px 12px rgba(0, 0, 0, 0.08)",
    },
    gridStroke: isDark ? "rgba(42, 46, 56, 0.6)" : "rgba(221, 213, 195, 0.8)",
    axisColor: isDark ? "#A8A296" : "#5C584E",
    primarySeries: "#FF4B35",
    secondarySeries: isDark ? "#DDD5C3" : "#5C584E",
    accentSeries: isDark ? "#FAF7F0" : "#111318",
    legendColor: isDark ? "#F1EBDD" : "#111318",
  };
}

export function SeasonRunsWicketsChart({ data }: { data: any[] }) {
  const t = useChartTheme();
  return (
    <ChartCard
      title="Season-Wise Runs &amp; Wickets Volume"
      definition="Total regulation-innings runs scored (bars) and wickets fallen across EPL 2023–2025."
      interpretation="Scoring volume expanded markedly from 2023 to 2025 while wicket totals stabilized, reflecting stronger batting aggression across 6-over innings."
      empty={!data || data.length === 0}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} />
          <XAxis dataKey="season" tick={{ fill: t.axisColor, fontSize: 11 }} stroke={t.axisColor} />
          <YAxis yAxisId="left" tick={{ fill: t.axisColor, fontSize: 11 }} stroke={t.axisColor} label={{ value: "Runs", angle: -90, position: "insideLeft", fill: t.axisColor, fontSize: 10 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: t.secondarySeries, fontSize: 11 }} stroke={t.secondarySeries} label={{ value: "Wickets", angle: 90, position: "insideRight", fill: t.secondarySeries, fontSize: 10 }} />
          <Tooltip contentStyle={t.tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: "11px", color: t.legendColor }} />
          <Bar yAxisId="left" dataKey="total_runs" name="Total Runs" fill={t.primarySeries} radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="total_wickets" name="Total Wickets" fill={t.secondarySeries} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function RunRateBoundaryTrendChart({ data }: { data: any[] }) {
  const t = useChartTheme();
  return (
    <ChartCard
      title="Tournament Run Rate &amp; Boundaries Per Match"
      definition="Regulation run rate (RPO) and mean boundaries (4s + 6s) per match across seasons."
      interpretation="Boundaries per match climbed +96.5% between 2023 (3.11) and 2025 (6.11), driving the tournament scoring rate upward."
      empty={!data || data.length === 0}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} />
          <XAxis dataKey="season" tick={{ fill: t.axisColor, fontSize: 11 }} stroke={t.axisColor} />
          <YAxis tick={{ fill: t.axisColor, fontSize: 11 }} stroke={t.axisColor} />
          <Tooltip contentStyle={t.tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: "11px", color: t.legendColor }} />
          <Line type="monotone" dataKey="run_rate" name="Run Rate (RPO)" stroke={t.primarySeries} strokeWidth={2.5} dot={{ r: 4, fill: t.primarySeries }} />
          <Line type="monotone" dataKey="boundaries_per_match" name="Boundaries / Match" stroke={t.secondarySeries} strokeWidth={2.5} dot={{ r: 4, fill: t.secondarySeries }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function TeamWinDistributionChart({ data }: { data: any[] }) {
  const t = useChartTheme();
  return (
    <ChartCard
      title="Franchise Win–Loss Distribution"
      definition="Historical match wins vs losses across EPL franchises (2023–2025)."
      interpretation="Exotica Warriors (4-0 in 2025) and TEAM VB lead historical efficiency, demonstrating how dominant single-season campaigns shape EPL records."
      empty={!data || data.length === 0}
      height={280}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 18, left: 10, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} />
          <XAxis type="number" allowDecimals={false} tick={{ fill: t.axisColor, fontSize: 11 }} stroke={t.axisColor} />
          <YAxis type="category" dataKey="team" width={115} tick={{ fill: t.axisColor, fontSize: 10 }} stroke={t.axisColor} />
          <Tooltip contentStyle={t.tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: "11px", color: t.legendColor }} />
          <Bar dataKey="wins" name="Wins" stackId="a" fill={t.primarySeries} />
          <Bar dataKey="losses" name="Losses" stackId="a" fill={t.secondarySeries} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function OutcomesSplitChart({
  title,
  definition,
  interpretation,
  data,
  valueKey = "count",
}: {
  title: string;
  definition: string;
  interpretation: string;
  data: any[];
  valueKey?: string;
}) {
  const t = useChartTheme();
  const colors = [t.primarySeries, t.secondarySeries, t.accentSeries, "#38BDF8"];
  return (
    <ChartCard title={title} definition={definition} interpretation={interpretation} empty={!data || data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={82}
            paddingAngle={3}
            label={({ label, percent }) => `${label}: ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill={colors[idx % colors.length]} stroke={t.isDark ? "#151F32" : "#FFFFFF"} strokeWidth={1.5} />
            ))}
          </Pie>
          <Tooltip contentStyle={t.tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: "11px", color: t.legendColor }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PlayerSeasonProgressionChart({ data, playerName }: { data: any[]; playerName: string }) {
  const t = useChartTheme();
  return (
    <ChartCard
      title="Season-Wise Runs &amp; Wickets Progression"
      definition={`Year-over-year regulation runs and wickets recorded by ${playerName}.`}
      interpretation="Tracks multi-season trajectory to separate sustained multi-year performers from single-season spikes."
      empty={!data || data.length === 0}
      emptyText="Player has no historical multi-season scorecards recorded."
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} />
          <XAxis dataKey="season" tick={{ fill: t.axisColor, fontSize: 11 }} stroke={t.axisColor} />
          <YAxis yAxisId="left" tick={{ fill: t.axisColor, fontSize: 11 }} stroke={t.axisColor} label={{ value: "Runs", angle: -90, position: "insideLeft", fill: t.axisColor, fontSize: 10 }} />
          <YAxis yAxisId="right" orientation="right" allowDecimals={false} tick={{ fill: t.secondarySeries, fontSize: 11 }} stroke={t.secondarySeries} label={{ value: "Wkts", angle: 90, position: "insideRight", fill: t.secondarySeries, fontSize: 10 }} />
          <Tooltip contentStyle={t.tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: "11px", color: t.legendColor }} />
          <Bar yAxisId="left" dataKey="runs" name="Runs" fill={t.primarySeries} radius={[4, 4, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="wickets" name="Wickets" stroke={t.secondarySeries} strokeWidth={2.5} dot={{ r: 4, fill: t.secondarySeries }} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PlayerRatingRadarChart({
  data,
  series,
  title = "Multi-Dimensional Rating Profile",
  definition = "Normalized 0–100 EPL component scores across Batting, Bowling, All-Round, Consistency, Clutch, and Overall.",
}: {
  data: any[];
  series: { dataKey: string; name: string; color: string }[];
  title?: string;
  definition?: string;
}) {
  const t = useChartTheme();
  return (
    <ChartCard
      title={title}
      definition={definition}
      interpretation="Wider polygons denote balanced two-way utility; sharp spikes indicate specialist dominance."
      empty={!data || data.length === 0}
      height={280}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke={t.gridStroke} />
          <PolarAngleAxis dataKey="axis" tick={{ fill: t.axisColor, fontSize: 11, fontWeight: 600 }} />
          <PolarRadiusAxis domain={[0, 100]} stroke={t.axisColor} strokeOpacity={0.4} tick={{ fill: t.axisColor, fontSize: 9 }} />
          {series.map((s) => (
            <Radar
              key={s.dataKey}
              name={s.name}
              dataKey={s.dataKey}
              stroke={s.color}
              fill={s.color}
              fillOpacity={0.25}
              strokeWidth={2}
            />
          ))}
          <Tooltip contentStyle={t.tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: "11px", color: t.legendColor }} />
        </RadarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PlayerScatterChart({
  title,
  definition,
  interpretation,
  data,
  xKey,
  yKey,
  xLabel,
  yLabel,
}: {
  title: string;
  definition: string;
  interpretation: string;
  data: any[];
  xKey: string;
  yKey: string;
  xLabel: string;
  yLabel: string;
}) {
  const t = useChartTheme();
  const peers = (data || []).filter((d) => !d.is_target);
  const target = (data || []).filter((d) => d.is_target);
  return (
    <ChartCard title={title} definition={definition} interpretation={interpretation} empty={!data || data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 18, bottom: 16, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} />
          <XAxis type="number" dataKey={xKey} name={xLabel} tick={{ fill: t.axisColor, fontSize: 10 }} stroke={t.axisColor} label={{ value: xLabel, position: "insideBottom", offset: -8, fill: t.axisColor, fontSize: 10 }} />
          <YAxis type="number" dataKey={yKey} name={yLabel} tick={{ fill: t.axisColor, fontSize: 10 }} stroke={t.axisColor} label={{ value: yLabel, angle: -90, position: "insideLeft", fill: t.axisColor, fontSize: 10 }} />
          <ZAxis range={[45, 110]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3", stroke: t.primarySeries }}
            contentStyle={t.tooltipStyle}
            formatter={(val: any, name: any) => [val, name]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ""}
          />
          <Legend wrapperStyle={{ fontSize: "11px", color: t.legendColor }} />
          <Scatter name="EPL Peers" data={peers} fill={t.primarySeries} fillOpacity={0.8} />
          {target.length > 0 && (
            <Scatter name={target[0].name} data={target} fill={t.secondarySeries} stroke={t.isDark ? "#FFFFFF" : "#101828"} strokeWidth={2} />
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function SimpleComparisonBarChart({
  title,
  definition,
  interpretation,
  data,
  xKey,
  bars,
  height = 250,
}: {
  title: string;
  definition: string;
  interpretation?: string;
  data: any[];
  xKey: string;
  bars: { dataKey: string; name: string; color: string }[];
  height?: number;
}) {
  const t = useChartTheme();
  return (
    <ChartCard title={title} definition={definition} interpretation={interpretation} empty={!data || data.length === 0} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} />
          <XAxis dataKey={xKey} tick={{ fill: t.axisColor, fontSize: 10 }} stroke={t.axisColor} />
          <YAxis tick={{ fill: t.axisColor, fontSize: 10 }} stroke={t.axisColor} />
          <Tooltip contentStyle={t.tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: "11px", color: t.legendColor }} />
          {bars.map((b) => (
            <Bar key={b.dataKey} dataKey={b.dataKey} name={b.name} fill={b.color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
