"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LuxSelect from "@/components/ui/LuxSelect";
import Pagination from "@/components/ui/Pagination";
import type { OutreachLink, TeamMember } from "@/lib/types";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { useFetchGeneration } from "@/lib/use-fetch-generation";
import { formatDate, truncateUrl } from "@/lib/utils";

type LinkRow = OutreachLink & {
  team_members?: { name: string } | { name: string }[] | null;
};

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
  const [preview, setPreview] = useState<{ new: number; duplicates: number; invalid: number } | null>(null);
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
  const pageSize = DEFAULT_PAGE_SIZE;
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
    load();
  }, [load]);

  useEffect(() => {
    if (initialMemberFilter) setMemberFilter(initialMemberFilter);
  }, [initialMemberFilter]);

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [statusFilter, memberFilter]);

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

  async function handlePreview() {
    const res = await fetch(`/api/admin/links/preview?key=${adminKey}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ paste }),
    });
    setPreview(await res.json());
  }

  async function handleImport() {
    const res = await fetch(`/api/admin/links/import?key=${adminKey}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ paste, batchName }),
    });
    const data = await res.json();
    if (data.error) {
      onToast(data.error, "error");
      return;
    }
    onToast(`Imported ${data.inserted} links (${data.duplicates} duplicates skipped)`);
    setPaste("");
    setPreview(null);
    setStatusFilter("available");
    setPage(1);
    load({ page: 1, status: "available" });
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
        <textarea
          className="lux-input min-h-[120px] font-mono text-sm"
          placeholder="Paste URLs here, one per line…"
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
          <Button variant="lux-ghost" onClick={handlePreview}>
            Preview
          </Button>
          <Button variant="lux" onClick={handleImport}>
            Import
          </Button>
        </div>
        {preview && (
          <p className="text-sm text-lux-muted">
            {preview.new} new · {preview.duplicates} duplicates · {preview.invalid} invalid lines
          </p>
        )}
        <p className="text-xs text-lux-muted">
          After import, the list switches to <strong className="text-lux-text">Available</strong> so you see new links on page 1.
        </p>
      </div>

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
                  links.map((link) => (
                    <tr key={link.id} className="border-b border-white/[0.06]">
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
                          className="text-lux-cyan hover:underline"
                        >
                          {truncateUrl(link.url, 36)}
                        </a>
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
                  ))
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
