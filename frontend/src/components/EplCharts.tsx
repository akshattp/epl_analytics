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

export const EPL_PALETTE = {
  midnight: "#02000D",
  navy: "#07203F",
  beige: "#EBDED4",
  peach: "#D9AA90",
  terracotta: "#A65E46",
};

const TOOLTIP_STYLE = {
  backgroundColor: "#07203F",
  border: "1px solid #D9AA90",
  borderRadius: "6px",
  color: "#EBDED4",
  fontSize: "11px",
  padding: "8px 10px",
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
    <div className="bg-white/95 rounded-xl border border-[#07203F]/15 shadow-sm p-5 flex flex-col justify-between print-avoid-break">
      <div className="mb-3 border-b border-[#07203F]/10 pb-2.5">
        <h3 className="font-serif text-base font-bold text-[#07203F]">{title}</h3>
        <p className="text-[11px] text-[#07203F]/70 mt-0.5">{definition}</p>
      </div>

      {empty ? (
        <div
          style={{ height }}
          className="flex items-center justify-center bg-[#EBDED4]/30 rounded-lg border border-dashed border-[#07203F]/20 text-xs text-[#07203F]/65 italic px-4 text-center"
        >
          {emptyText}
        </div>
      ) : (
        <div style={{ width: "100%", height }}>{children}</div>
      )}

      {interpretation && (
        <div className="mt-3 pt-2.5 border-t border-[#07203F]/10 text-[11px] text-[#07203F]/85 leading-relaxed">
          <span className="font-semibold text-[#A65E46] uppercase tracking-wider text-[10px] mr-1.5">
            Interpretation:
          </span>
          {interpretation}
        </div>
      )}
    </div>
  );
}

export function SeasonRunsWicketsChart({ data }: { data: any[] }) {
  return (
    <ChartCard
      title="Season-Wise Runs & Wickets Volume"
      definition="Total regulation-innings runs scored (bars) and wickets fallen (terracotta bars) across EPL 2023–2025."
      interpretation="Scoring volume expanded markedly from 2023 to 2025 while wicket totals stabilized, reflecting stronger batting aggression across 6-over innings."
      empty={!data || data.length === 0}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#07203F" strokeOpacity={0.1} />
          <XAxis dataKey="season" tick={{ fill: "#07203F", fontSize: 11 }} />
          <YAxis yAxisId="left" tick={{ fill: "#07203F", fontSize: 11 }} label={{ value: "Runs", angle: -90, position: "insideLeft", fill: "#07203F", fontSize: 10 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: "#A65E46", fontSize: 11 }} label={{ value: "Wickets", angle: 90, position: "insideRight", fill: "#A65E46", fontSize: 10 }} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          <Bar yAxisId="left" dataKey="total_runs" name="Total Runs" fill={EPL_PALETTE.navy} radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="total_wickets" name="Total Wickets" fill={EPL_PALETTE.terracotta} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function RunRateBoundaryTrendChart({ data }: { data: any[] }) {
  return (
    <ChartCard
      title="Tournament Run Rate & Boundaries Per Match"
      definition="Regulation run rate (RPO) and mean boundaries (4s + 6s) per match across seasons."
      interpretation="Boundaries per match climbed +96.5% between 2023 (3.11) and 2025 (6.11), driving the tournament scoring rate upward."
      empty={!data || data.length === 0}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#07203F" strokeOpacity={0.1} />
          <XAxis dataKey="season" tick={{ fill: "#07203F", fontSize: 11 }} />
          <YAxis tick={{ fill: "#07203F", fontSize: 11 }} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          <Line type="monotone" dataKey="run_rate" name="Run Rate (RPO)" stroke={EPL_PALETTE.navy} strokeWidth={2.5} dot={{ r: 4, fill: EPL_PALETTE.navy }} />
          <Line type="monotone" dataKey="boundaries_per_match" name="Boundaries / Match" stroke={EPL_PALETTE.terracotta} strokeWidth={2.5} dot={{ r: 4, fill: EPL_PALETTE.terracotta }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function TeamWinDistributionChart({ data }: { data: any[] }) {
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
          <CartesianGrid strokeDasharray="3 3" stroke="#07203F" strokeOpacity={0.1} />
          <XAxis type="number" allowDecimals={false} tick={{ fill: "#07203F", fontSize: 11 }} />
          <YAxis type="category" dataKey="team" width={115} tick={{ fill: "#02000D", fontSize: 10 }} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          <Bar dataKey="wins" name="Wins" stackId="a" fill={EPL_PALETTE.navy} />
          <Bar dataKey="losses" name="Losses" stackId="a" fill={EPL_PALETTE.peach} radius={[0, 4, 4, 0]} />
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
  const colors = [EPL_PALETTE.navy, EPL_PALETTE.terracotta, EPL_PALETTE.peach, EPL_PALETTE.midnight];
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
              <Cell key={idx} fill={colors[idx % colors.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PlayerSeasonProgressionChart({ data, playerName }: { data: any[]; playerName: string }) {
  return (
    <ChartCard
      title="Season-Wise Runs & Wickets Progression"
      definition={`Year-over-year regulation runs and wickets recorded by ${playerName}.`}
      interpretation="Tracks multi-season trajectory to separate sustained multi-year performers from single-season spikes."
      empty={!data || data.length === 0}
      emptyText="Player has no historical multi-season scorecards recorded."
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#07203F" strokeOpacity={0.1} />
          <XAxis dataKey="season" tick={{ fill: "#07203F", fontSize: 11 }} />
          <YAxis yAxisId="left" tick={{ fill: "#07203F", fontSize: 11 }} label={{ value: "Runs", angle: -90, position: "insideLeft", fill: "#07203F", fontSize: 10 }} />
          <YAxis yAxisId="right" orientation="right" allowDecimals={false} tick={{ fill: "#A65E46", fontSize: 11 }} label={{ value: "Wkts", angle: 90, position: "insideRight", fill: "#A65E46", fontSize: 10 }} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          <Bar yAxisId="left" dataKey="runs" name="Runs" fill={EPL_PALETTE.navy} radius={[4, 4, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="wickets" name="Wickets" stroke={EPL_PALETTE.terracotta} strokeWidth={2.5} dot={{ r: 4, fill: EPL_PALETTE.terracotta }} />
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
          <PolarGrid stroke="#07203F" strokeOpacity={0.2} />
          <PolarAngleAxis dataKey="axis" tick={{ fill: "#07203F", fontSize: 11, fontWeight: 600 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#07203F", fontSize: 9 }} />
          {series.map((s) => (
            <Radar
              key={s.dataKey}
              name={s.name}
              dataKey={s.dataKey}
              stroke={s.color}
              fill={s.color}
              fillOpacity={0.22}
              strokeWidth={2}
            />
          ))}
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
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
  const peers = (data || []).filter((d) => !d.is_target);
  const target = (data || []).filter((d) => d.is_target);
  return (
    <ChartCard title={title} definition={definition} interpretation={interpretation} empty={!data || data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 18, bottom: 16, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#07203F" strokeOpacity={0.12} />
          <XAxis type="number" dataKey={xKey} name={xLabel} tick={{ fill: "#07203F", fontSize: 10 }} label={{ value: xLabel, position: "insideBottom", offset: -8, fill: "#07203F", fontSize: 10 }} />
          <YAxis type="number" dataKey={yKey} name={yLabel} tick={{ fill: "#07203F", fontSize: 10 }} label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "#07203F", fontSize: 10 }} />
          <ZAxis range={[45, 110]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            contentStyle={TOOLTIP_STYLE}
            formatter={(val: any, name: any) => [val, name]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ""}
          />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          <Scatter name="EPL Peers" data={peers} fill={EPL_PALETTE.peach} fillOpacity={0.85} />
          {target.length > 0 && (
            <Scatter name={target[0].name} data={target} fill={EPL_PALETTE.terracotta} stroke={EPL_PALETTE.midnight} strokeWidth={2} />
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
  return (
    <ChartCard title={title} definition={definition} interpretation={interpretation} empty={!data || data.length === 0} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#07203F" strokeOpacity={0.1} />
          <XAxis dataKey={xKey} tick={{ fill: "#07203F", fontSize: 10 }} />
          <YAxis tick={{ fill: "#07203F", fontSize: 10 }} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          {bars.map((b) => (
            <Bar key={b.dataKey} dataKey={b.dataKey} name={b.name} fill={b.color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
