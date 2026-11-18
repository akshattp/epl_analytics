"use client";

import { useEffect, useState } from "react";
import { 
  Sparkles, CheckCircle2, Bot, ChevronDown, 
  ChevronUp, Shield, Flame, Trophy, Info 
} from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function TournamentInsightsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [explanations, setExplanations] = useState<{ [key: string]: any }>({});
  const [explaining, setExplaining] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    async function loadInsights() {
      try {
        const res = await fetchApi("/api/insights");
        setData(res);
      } catch (err) {
        console.error("Error loading insights:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInsights();
  }, []);

  const handleExplain = async (item: any, idx: number) => {
    const key = `${item.title}-${idx}`;
    if (explanations[key]) {
      // Toggle off
      const updated = { ...explanations };
      delete updated[key];
      setExplanations(updated);
      return;
    }

    setExplaining((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await fetchApi("/api/insights/explain", {
        method: "POST",
        body: JSON.stringify(item),
      });
      setExplanations((prev) => ({ ...prev, [key]: res }));
    } catch (err) {
      console.error("Error generating explanation:", err);
    } finally {
      setExplaining((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-[#07203F] border-t-transparent rounded-full mb-4"></div>
        <p className="font-serif text-lg text-[#07203F]">Synthesizing Tournament Intelligence & Historical Trends...</p>
      </div>
    );
  }

  const allItems = data?.all || [];
  const filtered = activeCategory === "ALL" 
    ? allItems 
    : allItems.filter((i: any) => i.category.toLowerCase().includes(activeCategory.toLowerCase()));

  const categories = [
    { id: "ALL", label: "All Insights" },
    { id: "player", label: "Player Insights" },
    { id: "bowling", label: "Bowling Insights" },
    { id: "team", label: "Team Insights" },
    { id: "match", label: "Match Insights" },
    { id: "cross-season", label: "Cross-Season Trends" },
  ];

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="border-b border-[#07203F]/20 pb-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-[#A65E46] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Verified Statistical Discoveries</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#02000D]">
              Tournament Intelligence Feed
            </h1>
            <p className="text-sm text-[#07203F]/80 mt-1 max-w-2xl leading-relaxed">
              Automated analytical discoveries from EPL scorecards: extraordinary individual campaigns, match-defining spells, franchise dependencies, and cross-season evolutions.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#07203F]/60 block">Verified Insights</span>
            <span className="font-mono text-xl font-bold text-[#A65E46]">{allItems.length} Discoveries</span>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex overflow-x-auto space-x-2 pb-2">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
              activeCategory === c.id
                ? "bg-[#07203F] text-[#EBDED4] border-[#07203F]"
                : "bg-white/80 text-[#07203F] border-[#07203F]/15 hover:bg-[#EBDED4]"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Editorial Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((item: any, idx: number) => {
          const key = `${item.title}-${idx}`;
          const exp = explanations[key];
          const isExpLoading = explaining[key];

          return (
            <div 
              key={idx}
              className="bg-white/90 backdrop-blur rounded-lg p-6 border border-[#07203F]/15 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-[#07203F] text-[#EBDED4] px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                  <span className="text-[11px] font-mono text-[#07203F]/60">
                    {item.season_references}
                  </span>
                </div>

                <h3 className="font-serif text-xl font-bold text-[#07203F] leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-[#07203F]/85 leading-relaxed">
                  {item.short_explanation}
                </p>

                {/* Supporting Numerical Evidence Box */}
                <div className="bg-[#EBDED4]/60 p-3 rounded border border-[#07203F]/10 space-y-1 text-xs">
                  <span className="font-semibold text-[#A65E46] block text-[11px] uppercase tracking-wider">
                    Numerical Proof
                  </span>
                  <p className="font-mono text-[#02000D] text-[11px]">
                    {item.supporting_evidence}
                  </p>
                </div>

                {/* Methodology & Limitations */}
                <div className="text-[11px] text-[#07203F]/70 space-y-0.5 pt-1">
                  <div><strong>Methodology:</strong> {item.methodology}</div>
                  <div><strong>Confidence:</strong> <span className="text-emerald-800 font-semibold">{item.confidence_level}</span></div>
                  {item.data_limitations && (
                    <div className="text-[10px] text-[#07203F]/60"><em>Note: {item.data_limitations}</em></div>
                  )}
                </div>

                {/* Optional Explainable Commentary (Local Ollama / Deterministic Engine) */}
                {exp && (
                  <div className="mt-4 p-4 rounded bg-[#07203F] text-[#EBDED4] border border-[#D9AA90]/20 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-[#D9AA90]/20 pb-1.5">
                      <span className="text-[10px] uppercase font-bold text-[#D9AA90] flex items-center space-x-1">
                        <Bot className="w-3.5 h-3.5" />
                        <span>{exp.source}</span>
                      </span>
                    </div>
                    <div className="font-semibold text-sm text-[#EBDED4]">{exp.headline}</div>
                    <p className="text-xs text-[#EBDED4]/80 leading-relaxed">{exp.summary}</p>
                    {exp.analytical_context && (
                      <p className="text-xs text-[#D9AA90]/90 leading-relaxed">
                        <strong>Context:</strong> {exp.analytical_context}
                      </p>
                    )}
                    {exp.tactical_takeaway && (
                      <p className="text-xs text-white/90">
                        <strong>Tactical Takeaway:</strong> {exp.tactical_takeaway}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-[#07203F]/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleExplain(item, idx)}
                  disabled={isExpLoading}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#A65E46] hover:text-[#07203F] transition"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>
                    {isExpLoading 
                      ? "Generating Deep Analysis..." 
                      : exp 
                        ? "Hide Detailed Breakdown" 
                        : "Explain with Local Intelligence"}
                  </span>
                  {exp ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                </button>

                <div className="flex items-center space-x-1 text-[11px] text-emerald-800 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  <span>Verified Scorecard Fact</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
