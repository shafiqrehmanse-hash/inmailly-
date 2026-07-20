"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import LuxSelect from "@/components/ui/LuxSelect";
import Pagination from "@/components/ui/Pagination";
import PageSizeSelect from "@/components/ui/PageSizeSelect";
import type { OutreachLink, TeamMember } from "@/lib/types";
import { DEFAULT_PAGE_SIZE, readStoredPageSize, storePageSize } from "@/lib/pagination";
import { useFetchGeneration } from "@/lib/use-fetch-generation";
import { useVisitedLinks } from "@/lib/use-visited-links";
import { cn, formatDate, truncateUrl } from "@/lib/utils";

type LinkRow = OutreachLink & {
  team_members?: { name: string } | { name: string }[] | null;
};

type LinkImportStats = {
  new: number;
  duplicates: number;
  duplicateInPaste?: number;
  duplicateInDb?: number;
  invalid: number;
  parsed?: number;
  totalLines?: number;
  rawUrlTokens?: number;
  inserted?: number;
  error?: string;
};

function ImportStatsSummary({ stats }: { stats: LinkImportStats }) {
  const urlsFound = stats.rawUrlTokens ?? stats.parsed ?? 0;
  const unique = stats.parsed ?? 0;
  const dupPaste = stats.duplicateInPaste ?? 0;
  const dupDb = stats.duplicateInDb ?? 0;
  const invalid = stats.invalid ?? 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3">
          <div className="text-[0.65rem] uppercase tracking-wider text-lux-muted mb-1">URLs found</div>
          <div className="font-bricolage font-extrabold text-xl text-lux-text tabular-nums">{urlsFound}</div>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3">
          <div className="text-[0.65rem] uppercase tracking-wider text-lux-muted mb-1">Unique profiles</div>
          <div className="font-bricolage font-extrabold text-xl text-lux-text tabular-nums">{unique}</div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-3">
          <div className="text-[0.65rem] uppercase tracking-wider text-emerald-400/90 mb-1">New to upload</div>
          <div className="font-bricolage font-extrabold text-xl text-emerald-400 tabular-nums">
            {stats.inserted ?? stats.new}
          </div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3">
          <div className="text-[0.65rem] uppercase tracking-wider text-amber-300/90 mb-1">Skipped (duplicates)</div>
          <div className="font-bricolage font-extrabold text-xl text-amber-300 tabular-nums">
            {dupPaste + dupDb}
          </div>
        </div>
      </div>
      <ul className="text-xs text-lux-muted space-y-1.5 pl-1">
        {dupPaste > 0 && (
          <li>
            <span className="text-amber-300 font-semibold tabular-nums">{dupPaste}</span> repeated in your paste (same
            LinkedIn profile, different URL)
          </li>
        )}
        {dupDb > 0 && (
          <li>
            <span className="text-amber-300 font-semibold tabular-nums">{dupDb}</span> already in the link pool
          </li>
        )}
        {invalid > 0 && (
          <li>
            <span className="text-red-400 font-semibold tabular-nums">{invalid}</span> lines with no recognizable URL
          </li>
        )}
        {dupPaste === 0 && dupDb === 0 && invalid === 0 && (
          <li>All URLs are unique and ready to import.</li>
        )}
      </ul>
    </div>
  );
}

export default function AdminLinksSection({
  adminKey,
  members,
  onToast,
  initialMemberFilter,
}: {
  adminKey: string;
  members: TeamMember[];
  onToast: (msg: string, type?: "success" | "error") => void;
  initialMemberFilter?: string;
}) {
  const headers = { "Content-Type": "application/json", "x-admin-key": adminKey };
  const [paste, setPaste] = useState("");
  const [batchName, setBatchName] = useState("");
  const [importMode, setImportMode] = useState<"urls" | "named">("urls");
  const [preview, setPreview] = useState<LinkImportStats | null>(null);
  const [confirmImportOpen, setConfirmImportOpen] = useState(false);
  const [previewOnlyOpen, setPreviewOnlyOpen] = useState(false);
  const [importResultOpen, setImportResultOpen] = useState(false);
  const [importStats, setImportStats] = useState<LinkImportStats | null>(null);
  const [importResult, setImportResult] = useState<LinkImportStats | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState(initialMemberFilter || "all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assignMemberId, setAssignMemberId] = useState("");
  const [bulkCount, setBulkCount] = useState("25");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { isVisited, markVisited } = useVisitedLinks();
  const { nextGeneration, isLatest } = useFetchGeneration();

  const outreachMembers = members.filter((m) => m.role !== "campaign_manager" && m.is_active);

  const load = useCallback(
    async (overrides?: { page?: number; status?: string; memberId?: string }) => {
      const activePage = overrides?.page ?? page;
      const activeStatus = overrides?.status ?? statusFilter;
      const activeMember = overrides?.memberId ?? memberFilter;
      const gen = nextGeneration();
      setLoading(true);
      setLoadError(null);
      const params = new URLSearchParams({
        key: adminKey,
        status: activeStatus,
        page: String(activePage),
        limit: String(pageSize),
      });
      if (activeMember !== "all") params.set("memberId", activeMember);
      const res = await fetch(`/api/admin/links?${params}`);
      const data = await res.json();
      if (!isLatest(gen)) return;
      if (!res.ok || data.error) {
        setLoadError(data.error || `Failed to load links (${res.status})`);
        setLinks([]);
        setTotal(0);
        setTotalPages(1);
        setLoading(false);
        return;
      }
      const apiTotal = data.pagination?.total ?? 0;
      const apiTotalPages = Math.max(1, data.pagination?.totalPages ?? 1);
      if (activePage > apiTotalPages && apiTotal > 0) {
        setPage(apiTotalPages);
        setLoading(false);
        return;
      }
      setLinks(data.links || []);
      setTotal(apiTotal);
      setTotalPages(apiTotalPages);
      setLoading(false);
    },
    [adminKey, statusFilter, memberFilter, page, pageSize, nextGeneration, isLatest]
  );

  useEffect(() => {
    setPageSize(readStoredPageSize("inmailly:page-size:admin-links"));
  }, []);

  useEffect(() => {
    storePageSize("inmailly:page-size:admin-links", pageSize);
  }, [pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (initialMemberFilter) setMemberFilter(initialMemberFilter);
  }, [initialMemberFilter]);

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [statusFilter, memberFilter, pageSize]);

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  function memberName(link: LinkRow) {
    if (!link.member_id) return "—";
    return members.find((m) => m.id === link.member_id)?.name || "—";
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function fetchPreviewStats(): Promise<LinkImportStats | null> {
    if (!paste.trim()) {
      onToast("Paste some URLs first", "error");
      return null;
    }
    setPreviewLoading(true);
    const res = await fetch(`/api/admin/links/preview?key=${adminKey}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ paste, mode: importMode }),
    });
    const data = await res.json();
    setPreviewLoading(false);
    if (!res.ok || data.error) {
      onToast(data.error || "Preview failed", "error");
      return null;
    }
    setPreview(data);
    return data as LinkImportStats;
  }

  async function handlePreview() {
    const data = await fetchPreviewStats();
    if (data) {
      setImportStats(data);
      setPreviewOnlyOpen(true);
    }
  }

  async function startImport() {
    const data = await fetchPreviewStats();
    if (!data) return;
    setImportStats(data);
    if (data.new === 0) {
      setImportResult({ ...data, inserted: 0 });
      setImportResultOpen(true);
      return;
    }
    setConfirmImportOpen(true);
  }

  async function confirmImport() {
    if (!importStats) return;
    setImporting(true);
    const res = await fetch(`/api/admin/links/import?key=${adminKey}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ paste, batchName, mode: importMode }),
    });
    const data = await res.json();
    setImporting(false);
    setConfirmImportOpen(false);

    if (!res.ok || data.error) {
      onToast(data.error || "Import failed", "error");
      return;
    }

    const result: LinkImportStats = { ...importStats, ...data, inserted: data.inserted };
    setImportResult(result);
    setImportResultOpen(true);
    setPaste("");
    setPreview(null);
    setImportStats(null);
    setStatusFilter("available");
    setPage(1);
    load({ page: 1, status: "available" });
  }

  function closeImportResult() {
    setImportResultOpen(false);
    setImportResult(null);
  }

  async function resetLink(linkId: string) {
    await fetch(`/api/admin/links/reset?key=${adminKey}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ linkId }),
    });
    onToast("Link reset to available");
    load();
  }

  async function assignSelected() {
    if (!assignMemberId) {
      onToast("Select a team member first", "error");
      return;
    }
    const link_ids = Array.from(selected).filter((id) => {
      const link = links.find((l) => l.id === id);
      return link?.status === "available";
    });
    if (!link_ids.length) {
      onToast("Select available links to assign", "error");
      return;
    }
    const res = await fetch(`/api/admin/links/assign?key=${adminKey}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "assign", link_ids, member_id: assignMemberId }),
    });
    const data = await res.json();
    if (data.error) onToast(data.error, "error");
    else {
      onToast(`Assigned ${data.assigned} links to ${data.member}`);
      setSelected(new Set());
      load();
    }
  }

  async function assignBulk() {
    if (!assignMemberId) {
      onToast("Select a team member first", "error");
      return;
    }
    const res = await fetch(`/api/admin/links/assign?key=${adminKey}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "assign_bulk",
        member_id: assignMemberId,
        count: parseInt(bulkCount, 10) || 25,
      }),
    });
    const data = await res.json();
    if (data.error) onToast(data.error, "error");
    else onToast(`Assigned ${data.assigned} links to ${data.member}`);
    load();
  }

  async function releaseSelected() {
    const link_ids = Array.from(selected);
    if (!link_ids.length) {
      onToast("Select links to release", "error");
      return;
    }
    const res = await fetch(`/api/admin/links/assign?key=${adminKey}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "release", link_ids }),
    });
    const data = await res.json();
    if (data.error) onToast(data.error, "error");
    else {
      onToast(`Released ${data.released} links back to pool`);
      setSelected(new Set());
      setStatusFilter("available");
      setPage(1);
      load({ page: 1, status: "available" });
    }
  }

  const availableSelected = Array.from(selected).filter(
    (id) => links.find((l) => l.id === id)?.status === "available"
  ).length;

  return (
    <div className="space-y-6">
      <div className="lux-card p-5 space-y-4">
        <h3 className="font-bricolage font-bold">Import links</h3>
        <p className="text-xs text-lux-cyan font-semibold -mt-2">
          New: choose URLs only or ✦ Named (Intelligence) below
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setImportMode("urls")}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border ${
              importMode === "urls"
                ? "border-lux-cyan/40 bg-lux-cyan/10 text-lux-cyan"
                : "border-white/10 text-lux-muted"
            }`}
          >
            URLs only (usual)
          </button>
          <button
            type="button"
            onClick={() => setImportMode("named")}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border ${
              importMode === "named"
                ? "border-lux-cyan/40 bg-lux-cyan/10 text-lux-cyan"
                : "border-white/10 text-lux-muted"
            }`}
          >
            ✦ Named (Intelligence)
          </button>
        </div>
        <textarea
          className="lux-input min-h-[120px] font-mono text-sm"
          placeholder={
            importMode === "named"
              ? "FirstName,LastName,https://linkedin.com/in/...\nJane\tDoe\thttps://linkedin.com/in/jane-doe"
              : "Paste URLs — one per line, or comma / tab separated on the same line"
          }
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
        />
        <input
          className="lux-input"
          placeholder="Batch name (optional)"
          value={batchName}
          onChange={(e) => setBatchName(e.target.value)}
        />
        <div className="flex gap-3">
          <Button variant="lux-ghost" onClick={handlePreview} disabled={previewLoading || importing}>
            {previewLoading ? "Checking…" : "Preview"}
          </Button>
          <Button variant="lux" onClick={startImport} disabled={previewLoading || importing}>
            {importing ? "Uploading…" : "Import"}
          </Button>
        </div>
        {preview && (
          <p className="text-sm text-lux-muted leading-relaxed">
            <strong className="text-lux-text">{preview.rawUrlTokens ?? preview.parsed}</strong>{" "}
            {importMode === "named" ? "named rows" : "URLs"} found →{" "}
            <strong className="text-lux-text">{preview.parsed}</strong> unique profiles →{" "}
            <strong className="text-emerald-400">{preview.new}</strong> new to import
            {(preview.duplicateInPaste ?? 0) > 0 && (
              <> · {preview.duplicateInPaste} repeated in paste (same LinkedIn profile)</>
            )}
            {(preview.duplicateInDb ?? 0) > 0 && <> · {preview.duplicateInDb} already in pool</>}
            {preview.invalid > 0 && <> · {preview.invalid} invalid lines</>}
          </p>
        )}
        <p className="text-xs text-lux-muted leading-relaxed">
          {importMode === "named" ? (
            <>
              Named import unlocks <strong className="text-lux-cyan">Intelligence outreach</strong> (screenshot → AI
              InMail). Format: <code className="text-lux-text/80">First,Last,URL</code> per line.
            </>
          ) : (
            <>
              Click <strong className="text-lux-text">Import</strong> to see a breakdown popup, confirm upload, then a
              success summary. Same LinkedIn profile in different URL formats counts once.
            </>
          )}
        </p>
      </div>

      <Modal
        open={previewOnlyOpen}
        onClose={() => setPreviewOnlyOpen(false)}
        title="Import preview"
      >
        {importStats && (
          <div className="space-y-5">
            <ImportStatsSummary stats={importStats} />
            <div className="flex justify-end">
              <Button variant="lux-ghost" onClick={() => setPreviewOnlyOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmImportOpen}
        onClose={() => !importing && setConfirmImportOpen(false)}
        title="Confirm link upload"
        confirmLabel={
          importStats
            ? `Upload ${importStats.new} link${importStats.new === 1 ? "" : "s"}`
            : "Upload"
        }
        loading={importing}
        loadingLabel="Uploading…"
        onConfirm={confirmImport}
        description={
          importStats ? (
            <>
              <p className="mb-4 text-lux-text">
                Review the breakdown below. Only <strong>{importStats.new}</strong> new link
                {importStats.new === 1 ? "" : "s"} will be added to the pool.
              </p>
              <ImportStatsSummary stats={importStats} />
            </>
          ) : null
        }
      />

      <Modal open={importResultOpen} onClose={closeImportResult} title="Upload complete">
        {importResult && (
          <div className="space-y-5">
            {importResult.inserted === 0 ? (
              <p className="text-sm text-amber-300 border border-amber-500/25 bg-amber-500/5 px-3 py-2 rounded-lg">
                No new links were added — everything was already in the pool or duplicated in your paste.
              </p>
            ) : (
              <p className="text-sm text-emerald-400 border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 rounded-lg font-semibold">
                Successfully uploaded {importResult.inserted} new link{importResult.inserted === 1 ? "" : "s"} to the
                pool.
              </p>
            )}
            <ImportStatsSummary stats={importResult} />
            <p className="text-xs text-lux-muted">
              Filter set to <strong className="text-lux-text">Available</strong> — check the total at the top of the
              table (not just page 1).
            </p>
            <div className="flex justify-end">
              <Button variant="lux" onClick={closeImportResult}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <div className="lux-card p-5 space-y-4 border-lux-cyan/20">
        <div>
          <p className="admin-section-title mb-1">Assign links to team</p>
          <p className="text-xs text-lux-muted">
            Push links directly to outreach workers — or they can self-claim from the pool at /team/links.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <LuxSelect
            value={assignMemberId}
            onChange={setAssignMemberId}
            placeholder="Assign to member"
            options={outreachMembers.map((m) => ({ value: m.id, label: m.name }))}
          />
          <input
            className="lux-input"
            type="number"
            min={1}
            max={500}
            placeholder="Bulk count"
            value={bulkCount}
            onChange={(e) => setBulkCount(e.target.value)}
          />
          <Button variant="lux" onClick={assignBulk} className="sm:col-span-2 lg:col-span-1">
            Assign next {bulkCount || "N"} from pool
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="lux-ghost" size="sm" onClick={assignSelected} disabled={!availableSelected}>
            Assign selected ({availableSelected})
          </Button>
          <Button variant="lux-ghost" size="sm" onClick={releaseSelected} disabled={!selected.size}>
            Release selected to pool
          </Button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <LuxSelect
          className="w-44"
          size="sm"
          value={statusFilter}
          onChange={setStatusFilter}
          options={["all", "available", "claimed", "used"].map((s) => ({
            value: s,
            label: s.charAt(0).toUpperCase() + s.slice(1),
          }))}
        />
        <LuxSelect
          className="w-48"
          size="sm"
          value={memberFilter}
          onChange={setMemberFilter}
          options={[
            { value: "all", label: "All members" },
            ...members.map((m) => ({ value: m.id, label: m.name })),
          ]}
        />
        <PageSizeSelect value={pageSize} onChange={handlePageSizeChange} />
        <span className="text-xs text-lux-muted ml-auto tabular-nums">
          {total} links · page {page} of {totalPages}
          {statusFilter === "available" && total === 0 && (
            <span className="text-lux-cyan ml-2">Try filter “All statuses”</span>
          )}
        </span>
      </div>

      <div className="lux-card overflow-x-auto">
        {loadError && (
          <p className="p-4 text-sm text-red-400 border-b border-white/[0.06]">{loadError}</p>
        )}
        {loading ? (
          <p className="p-6 text-sm text-lux-muted">Loading links…</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-lux-muted text-xs uppercase bg-lux-bg2 border-b border-white/[0.06]">
                  <th className="px-3 py-3 w-10" />
                  <th className="text-left px-4 py-3">URL</th>
                  <th className="text-left px-4 py-3">Label</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Member</th>
                  <th className="text-left px-4 py-3">Claimed</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-lux-muted">
                      No links match this filter.
                    </td>
                  </tr>
                ) : (
                  links.map((link) => {
                    const opened = isVisited(link.id);
                    return (
                    <tr
                      key={link.id}
                      className={cn(
                        "border-b border-white/[0.06]",
                        opened && "bg-emerald-500/[0.04]"
                      )}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(link.id)}
                          onChange={() => toggleSelect(link.id)}
                          className="rounded border-white/20"
                        />
                      </td>
                      <td className="px-4 py-3 max-w-[180px] truncate">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => markVisited(link.id)}
                          className={cn(
                            "hover:underline transition-colors",
                            opened ? "text-emerald-400/90" : "text-lux-cyan"
                          )}
                        >
                          {truncateUrl(link.url, 36)}
                        </a>
                        {opened && (
                          <span className="block text-[0.65rem] text-emerald-400/70 mt-0.5">Opened</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{link.smart_label || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={link.status}>{link.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-lux-text">{memberName(link)}</td>
                      <td className="px-4 py-3 text-lux-muted text-xs">{formatDate(link.claimed_at)}</td>
                      <td className="px-4 py-3">
                        {link.status === "used" && (
                          <Button variant="lux-ghost" size="sm" onClick={() => resetLink(link.id)}>
                            Reset
                          </Button>
                        )}
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <div className="px-4 pb-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                onPage={setPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
