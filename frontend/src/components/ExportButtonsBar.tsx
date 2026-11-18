"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

interface ExportButtonsBarProps {
  role?: string;
  sortBy?: string;
  label?: string;
}

export function ExportButtonsBar({ role, sortBy = "overall_rating" }: ExportButtonsBarProps) {
  const [busy, setBusy] = useState<string | null>(null);

  const download = async (format: "pdf" | "xlsx" | "csv") => {
    setBusy(format);
    try {
      const params = new URLSearchParams({ format, sort_by: sortBy });
      if (role && role !== "ALL") params.append("role", role);
      const res = await fetch(`/api/exports/players?${params.toString()}`);
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `EPL_${sortBy}_Stats.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 no-print">
      <button
        type="button"
        onClick={() => download("pdf")}
        disabled={busy !== null}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#A65E46] text-[#EBDED4] hover:bg-[#A65E46]/90 text-xs font-semibold transition disabled:opacity-50"
      >
        <FileText className="w-3.5 h-3.5" />
        <span>{busy === "pdf" ? "PDF..." : "PDF"}</span>
      </button>
      <button
        type="button"
        onClick={() => download("xlsx")}
        disabled={busy !== null}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#07203F] text-[#EBDED4] hover:bg-[#02000D] text-xs font-semibold transition disabled:opacity-50"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 text-[#D9AA90]" />
        <span>{busy === "xlsx" ? "Excel..." : "Excel"}</span>
      </button>
      <button
        type="button"
        onClick={() => download("csv")}
        disabled={busy !== null}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#07203F] bg-white text-[#07203F] hover:bg-[#EBDED4] text-xs font-semibold transition disabled:opacity-50"
      >
        <Download className="w-3.5 h-3.5" />
        <span>{busy === "csv" ? "CSV..." : "CSV"}</span>
      </button>
    </div>
  );
}
