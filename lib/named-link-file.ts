import * as XLSX from "xlsx";
import { extractUrlFromLine } from "@/lib/links";

export type NamedFileRow = {
  first_name: string;
  last_name: string;
  url: string;
};

export type NamedFileParseResult = {
  rows: NamedFileRow[];
  invalid: number;
  totalRows: number;
  usedHeader: boolean;
  fileName: string;
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const FIRST_HEADERS = new Set(["firstname", "first", "fname", "givenname", "namefirst"]);
const LAST_HEADERS = new Set(["lastname", "last", "lname", "surname", "familyname", "namelast"]);
const URL_HEADERS = new Set([
  "url",
  "link",
  "profile",
  "linkedin",
  "linkedinurl",
  "profileurl",
  "linkedinprofile",
  "linkedinlink",
  "salesnavigator",
  "salesnav",
]);

function isHeaderRow(cells: string[]): boolean {
  const normalized = cells.map(normalizeHeader);
  const hasFirst = normalized.some((h) => FIRST_HEADERS.has(h));
  const hasUrl = normalized.some((h) => URL_HEADERS.has(h) || h.includes("linkedin") || h.includes("url"));
  return hasFirst && hasUrl;
}

function detectColumns(headers: string[]): { first: number; last: number; url: number } | null {
  const normalized = headers.map(normalizeHeader);
  let first = -1;
  let last = -1;
  let url = -1;

  normalized.forEach((h, i) => {
    if (first < 0 && FIRST_HEADERS.has(h)) first = i;
    if (last < 0 && LAST_HEADERS.has(h)) last = i;
    if (url < 0 && (URL_HEADERS.has(h) || h.includes("linkedin") || h.endsWith("url"))) url = i;
  });

  if (first >= 0 && url >= 0) {
    return { first, last, url };
  }
  return null;
}

function cellValue(row: unknown[], index: number): string {
  if (index < 0 || index >= row.length) return "";
  return String(row[index] ?? "").trim();
}

function rowToNamed(cells: string[], cols: { first: number; last: number; url: number }): NamedFileRow | null {
  const first_name = cellValue(cells, cols.first);
  let last_name = cols.last >= 0 ? cellValue(cells, cols.last) : "";
  let urlRaw = cellValue(cells, cols.url);

  if (!urlRaw) {
    const joined = cells.join(" ");
    const extracted = extractUrlFromLine(joined);
    if (extracted) urlRaw = extracted;
  }

  const url = extractUrlFromLine(urlRaw) || urlRaw;
  if (!first_name || !url || !/linkedin\.com|https?:\/\//i.test(url)) return null;

  if (!last_name && cols.last < 0) {
    const rest = cells
      .map((c, i) => (i === cols.first || i === cols.url ? "" : c))
      .filter(Boolean)
      .join(" ")
      .trim();
    if (rest && !/linkedin\.com|https?:\/\//i.test(rest)) {
      last_name = rest;
    }
  }

  return { first_name, last_name, url };
}

function sheetToMatrix(buffer: ArrayBuffer): string[][] {
  const wb = XLSX.read(buffer, { type: "array", raw: false });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  return matrix.map((row) => (Array.isArray(row) ? row.map((c) => String(c ?? "").trim()) : []));
}

/** Parse Intelligence CSV / Excel into first name, last name, URL rows. */
export function parseNamedLinksFile(buffer: ArrayBuffer, fileName: string): NamedFileParseResult {
  const matrix = sheetToMatrix(buffer);
  const rows: NamedFileRow[] = [];
  let invalid = 0;
  let usedHeader = false;

  if (matrix.length === 0) {
    return { rows, invalid: 0, totalRows: 0, usedHeader: false, fileName };
  }

  let start = 0;
  let cols = { first: 0, last: 1, url: 2 };

  const firstRow = matrix[0] || [];
  if (isHeaderRow(firstRow)) {
    const detected = detectColumns(firstRow);
    if (detected) {
      cols = { first: detected.first, last: detected.last, url: detected.url };
      usedHeader = true;
      start = 1;
    }
  }

  for (let i = start; i < matrix.length; i++) {
    const cells = matrix[i] || [];
    if (!cells.some((c) => c.trim())) continue;

    const parsed = rowToNamed(cells, cols);
    if (parsed) rows.push(parsed);
    else invalid++;
  }

  return {
    rows,
    invalid,
    totalRows: Math.max(0, matrix.length - start),
    usedHeader,
    fileName,
  };
}

export function namedRowsToPaste(rows: NamedFileRow[]): string {
  return rows.map((r) => `${r.first_name},${r.last_name},${r.url}`).join("\n");
}

export async function readNamedLinksFile(file: File): Promise<NamedFileParseResult> {
  const buffer = await file.arrayBuffer();
  return parseNamedLinksFile(buffer, file.name);
}

export const NAMED_LINK_FILE_ACCEPT =
  ".csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv";
