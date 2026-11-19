"use client";

import React, { useMemo, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, ChevronLeft, ChevronRight } from "lucide-react";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  tooltip?: string;
  align?: "left" | "right" | "center";
  minWidth?: string;
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number;
  render?: (row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T, index: number) => string | number;
  title?: string;
  subtitle?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: string[];
  defaultSortKey?: string;
  defaultSortDir?: "asc" | "desc";
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  stickyFirstColumn?: boolean;
  highlightRow?: (row: T, index: number) => boolean;
  emptyMessage?: string;
  headerActions?: React.ReactNode;
  maxHeightClass?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  rowKey,
  title,
  subtitle,
  searchable = false,
  searchPlaceholder = "Filter records...",
  searchKeys,
  defaultSortKey,
  defaultSortDir = "desc",
  pageSizeOptions = [15, 25, 50, 100],
  defaultPageSize = 25,
  stickyFirstColumn = true,
  highlightRow,
  emptyMessage = "No matching records available.",
  headerActions,
  maxHeightClass = "max-h-[68vh]"
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey || null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSortDir);
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);
  const [page, setPage] = useState<number>(1);

  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.trim().toLowerCase();
    return data.filter((row) => {
      if (searchKeys && searchKeys.length > 0) {
        return searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(q));
      }
      return Object.values(row).some((v) => String(v ?? "").toLowerCase().includes(q));
    });
  }, [data, query, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    const arr = [...filtered];
    arr.sort((a, b) => {
      const va = col?.sortAccessor ? col.sortAccessor(a) : a[sortKey];
      const vb = col?.sortAccessor ? col.sortAccessor(b) : b[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va;
      }
      return sortDir === "asc"
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
    return arr;
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  return (
    <div className="bg-white dark:bg-[#151F32] rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm overflow-hidden text-[#101828] dark:text-[#F8FAFC] transition-colors duration-200">
      {(title || searchable || headerActions) && (
        <div className="px-4 py-3 border-b border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            {title && (
              <h3 className="font-display text-base font-bold text-[#101828] dark:text-[#F8FAFC] tracking-tight">{title}</h3>
            )}
            {subtitle && (
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {searchable && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#64748B] dark:text-[#94A3B8] pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder={searchPlaceholder}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#101828] dark:text-[#F8FAFC] placeholder-[#64748B]/60 dark:placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] focus:ring-1 focus:ring-[#2563EB] dark:focus:ring-[#3B82F6] w-56 transition"
                />
              </div>
            )}
            {headerActions}
          </div>
        </div>
      )}

      <div
        tabIndex={0}
        role="region"
        aria-label={title || "Data Table"}
        className={`table-wrapper ${maxHeightClass}`}
      >
        <table className={`table-editorial ${stickyFirstColumn ? "table-sticky-col" : ""}`}>
          <thead>
            <tr>
              {columns.map((col) => {
                const isSortable = col.sortable !== false;
                const active = sortKey === col.key;
                const alignCls =
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                    ? "text-center"
                    : "text-left";
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                    title={col.tooltip || col.header}
                    style={{ minWidth: col.minWidth || "88px" }}
                    className={`px-3 py-3 select-none text-[11px] font-semibold tracking-wider uppercase ${alignCls}`}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={`inline-flex items-center gap-1.5 w-full hover:text-[#2563EB] dark:hover:text-[#38BDF8] transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#2563EB] ${
                          col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : "justify-start"
                        }`}
                      >
                        <span className={active ? "text-[#2563EB] dark:text-[#38BDF8] font-bold" : ""}>{col.header}</span>
                        {active ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="w-3 h-3 text-[#2563EB] dark:text-[#38BDF8] shrink-0" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-[#2563EB] dark:text-[#38BDF8] shrink-0" aria-hidden="true" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40 shrink-0" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      <span>{col.header}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="text-xs">
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-[#64748B] dark:text-[#94A3B8] italic">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              visibleRows.map((row, idx) => {
                const absIdx = (safePage - 1) * pageSize + idx;
                const isHl = highlightRow ? highlightRow(row, absIdx) : false;
                return (
                  <tr
                    key={rowKey(row, absIdx)}
                    className={isHl ? "!bg-blue-50/70 dark:!bg-blue-950/40 font-medium border-l-2 border-[#2563EB] dark:border-[#3B82F6]" : ""}
                  >
                    {columns.map((col) => {
                      const alignCls =
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left";
                      return (
                        <td key={col.key} className={`px-3 py-2.5 ${alignCls}`}>
                          {col.render ? col.render(row, absIdx) : String(row[col.key] ?? "—")}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {sorted.length > pageSizeOptions[0] && (
        <div className="px-4 py-2.5 border-t border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#64748B] dark:text-[#94A3B8] no-print">
          <div>
            Showing <strong className="text-[#101828] dark:text-[#F8FAFC]">{(safePage - 1) * pageSize + 1}</strong>–
            <strong className="text-[#101828] dark:text-[#F8FAFC]">{Math.min(safePage * pageSize, sorted.length)}</strong> of{" "}
            <strong className="text-[#101828] dark:text-[#F8FAFC]">{sorted.length}</strong> records
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5">
              <span>Rows:</span>
              <select
                aria-label="Select rows per page"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-0.5 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#101828] dark:text-[#F8FAFC] font-mono text-[11px] focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6]"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value={sorted.length}>All ({sorted.length})</option>
              </select>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] text-[#101828] dark:text-[#F8FAFC] disabled:opacity-30 transition"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono px-2 text-[#101828] dark:text-[#F8FAFC]">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] text-[#101828] dark:text-[#F8FAFC] disabled:opacity-30 transition"
                aria-label="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
