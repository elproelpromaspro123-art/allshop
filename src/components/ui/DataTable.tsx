"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  rows: T[];
  columns: DataTableColumn<T>[];
  getRowKey: (row: T) => string;
  renderMobileRow: (row: T) => ReactNode;
  emptyState?: ReactNode;
}

export function DataTable<T>({
  rows,
  columns,
  getRowKey,
  renderMobileRow,
  emptyState,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return <>{emptyState || null}</>;
  }

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <div key={getRowKey(row)}>{renderMobileRow(row)}</div>
        ))}
      </div>

      <div className="data-table-shell hidden md:block">
        <div className="overflow-x-auto rounded-[var(--card-radius)]">
          <table className="w-full min-w-[760px]">
            <thead className="bg-[var(--surface-muted)]">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-faint)]",
                      column.className,
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {rows.map((row) => (
                <tr key={getRowKey(row)} className="transition-colors hover:bg-[var(--surface-muted)]/45">
                  {columns.map((column) => (
                    <td
                      key={`${getRowKey(row)}:${column.key}`}
                      className={cn(
                        "px-5 py-4 align-top text-sm text-[var(--muted-strong)]",
                        column.cellClassName,
                      )}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
