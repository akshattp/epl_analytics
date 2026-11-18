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
    <div className="bg-white/95 rounded-xl border border-[#07203F]/15 shadow-sm overflow-hidden">
      {(title || searchable || headerActions) && (
        <div className="px-4 py-3 border-b border-[#07203F]/10 bg-[#EBDED4]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            {title && (
              <h3 className="font-serif text-base font-bold text-[#07203F]">{title}</h3>
            )}
            {subtitle && (
              <p className="text-[11px] text-[#07203F]/70 mt-0.5">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {searchable && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#07203F]/50" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder={searchPlaceholder}
                  className="pl-8 pr-3 py-1.5 text-xs rounded border border-[#07203F]/20 bg-white text-[#02000D] focus:outline-none focus:border-[#A65E46] w-52"
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
                    title={col.tooltip || col.header}
                    style={{ minWidth: col.minWidth || "88px" }}
                    onClick={isSortable ? () => toggleSort(col.key) : undefined}
                    className={`px-3 py-3 select-none ${alignCls} ${
                      isSortable ? "cursor-pointer hover:bg-[#02000D] transition-colors" : ""
                    }`}
                  >
                    <span className={`inline-flex items-center gap-1 ${col.align === "right" ? "justify-end" : ""}`}>
                      <span>{col.header}</span>
                      {isSortable && (
                        active ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="w-3 h-3 text-[#D9AA90] shrink-0" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-[#D9AA90] shrink-0" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-[#D9AA90]/45 shrink-0" />
                        )
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="text-xs text-[#02000D]">
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-10 text-center text-[#07203F]/60 italic">
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
                    className={isHl ? "!bg-[#D9AA90]/25 font-medium" : ""}
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
        <div className="px-4 py-2.5 border-t border-[#07203F]/10 bg-[#EBDED4]/25 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#07203F] no-print">
          <div>
            Showing <strong>{(safePage - 1) * pageSize + 1}</strong>–
            <strong>{Math.min(safePage * pageSize, sorted.length)}</strong> of{" "}
            <strong>{sorted.length}</strong> records
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5">
              <span>Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-0.5 rounded border border-[#07203F]/20 bg-white text-[#07203F] font-mono text-[11px]"
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
                className="p-1 rounded border border-[#07203F]/20 bg-white hover:bg-[#07203F] hover:text-[#EBDED4] disabled:opacity-35 transition"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono px-1.5">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded border border-[#07203F]/20 bg-white hover:bg-[#07203F] hover:text-[#EBDED4] disabled:opacity-35 transition"
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
