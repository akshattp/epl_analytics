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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF4B35] hover:bg-[#E03E29] text-white text-xs font-semibold transition disabled:opacity-40 shadow-sm"
      >
        <FileText className="w-3.5 h-3.5" />
        <span>{busy === "pdf" ? "Exporting PDF..." : "Export PDF"}</span>
      </button>
      <button
        type="button"
        onClick={() => download("xlsx")}
        disabled={busy !== null}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF7F0] dark:bg-[#181A20] border border-[#DDD5C3] dark:border-[#2A2E38] text-[#111318] dark:text-[#F1EBDD] hover:border-[#FF4B35] text-xs font-semibold transition disabled:opacity-40 shadow-sm"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 text-[#FF4B35]" />
        <span>{busy === "xlsx" ? "Exporting Excel..." : "Excel"}</span>
      </button>
      <button
        type="button"
        onClick={() => download("csv")}
        disabled={busy !== null}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF7F0] dark:bg-[#181A20] border border-[#DDD5C3] dark:border-[#2A2E38] text-[#111318] dark:text-[#F1EBDD] hover:border-[#FF4B35] text-xs font-semibold transition disabled:opacity-40 shadow-sm"
      >
        <Download className="w-3.5 h-3.5 text-[#FF4B35]" />
        <span>{busy === "csv" ? "Exporting CSV..." : "CSV"}</span>
      </button>
    </div>
  );
}
