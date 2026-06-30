export const DEFAULT_PAGE_SIZE = 10;

export function parsePage(value: string | null | undefined) {
  const n = parseInt(value || "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function parsePageSize(value: string | null | undefined, fallback = DEFAULT_PAGE_SIZE) {
  const n = parseInt(value || String(fallback), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(50, n);
}

export function paginateSlice<T>(items: T[], page: number, pageSize = DEFAULT_PAGE_SIZE) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages,
  };
}

export function pageRange(page: number, totalPages: number, maxButtons = 5) {
  if (totalPages <= maxButtons) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const half = Math.floor(maxButtons / 2);
  let start = Math.max(1, page - half);
  const end = Math.min(totalPages, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
