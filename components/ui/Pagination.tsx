"use client";

import { cn } from "@/lib/utils";
import { pageRange } from "@/lib/pagination";

export default function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPage,
  className = "",
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
  className?: string;
}) {
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = pageRange(page, totalPages);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/[0.06]",
        className
      )}
    >
      <p className="text-xs text-lux-muted tabular-nums">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <PaginationBtn disabled={page <= 1} onClick={() => onPage(page - 1)} label="← Prev" />
        {pages[0] > 1 && (
          <>
            <PaginationBtn onClick={() => onPage(1)} label="1" active={page === 1} />
            {pages[0] > 2 && <span className="px-1 text-lux-muted text-xs">…</span>}
          </>
        )}
        {pages.map((p) => (
          <PaginationBtn key={p} onClick={() => onPage(p)} label={String(p)} active={p === page} />
        ))}
        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span className="px-1 text-lux-muted text-xs">…</span>
            )}
            <PaginationBtn
              onClick={() => onPage(totalPages)}
              label={String(totalPages)}
              active={page === totalPages}
            />
          </>
        )}
        <PaginationBtn
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          label="Next →"
        />
      </div>
    </div>
  );
}

function PaginationBtn({
  label,
  onClick,
  disabled,
  active,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "min-w-[2rem] px-2.5 py-1.5 text-xs font-semibold rounded border transition-colors",
        active
          ? "bg-lux-cyan/15 text-lux-cyan border-lux-cyan/40"
          : "bg-white/[0.03] text-lux-muted border-white/[0.08] hover:border-lux-cyan/30 hover:text-lux-text",
        disabled && "opacity-40 cursor-not-allowed hover:border-white/[0.08] hover:text-lux-muted"
      )}
    >
      {label}
    </button>
  );
}
