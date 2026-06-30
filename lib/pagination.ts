export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25] as const;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

export function normalizePageSize(value: number | string | null | undefined): PageSizeOption {
  const n = typeof value === "string" ? parseInt(value, 10) : value;
  if (n === 25) return 25;
  return DEFAULT_PAGE_SIZE;
}

export function parsePage(value: string | null | undefined) {
  const n = parseInt(value || "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function parsePageSize(value: string | null | undefined, fallback = DEFAULT_PAGE_SIZE) {
  return normalizePageSize(value ?? fallback);
}

export function readStoredPageSize(key: string, fallback = DEFAULT_PAGE_SIZE): PageSizeOption {
  if (typeof window === "undefined") return normalizePageSize(fallback);
  return normalizePageSize(localStorage.getItem(key) ?? fallback);
}

export function storePageSize(key: string, size: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, String(normalizePageSize(size)));
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
