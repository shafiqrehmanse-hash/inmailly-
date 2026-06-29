"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LeadModal from "@/components/team/LeadModal";
import StatCard from "@/components/team/StatCard";
import Toast, { ToastType } from "@/components/team/Toast";
import type { Lead, OutreachLink, TeamMember } from "@/lib/types";
import { formatDate, truncateUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TABS = ["overview", "links", "team", "leads", "scripts", "referrals", "funds"] as const;
type Tab = (typeof TABS)[number];

type MemberRow = TeamMember & { active_links: number; leads_count: number };

export default function AdminPanel({ adminKey }: { adminKey: string }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const headers = { "Content-Type": "application/json", "x-admin-key": adminKey };
  const showToast = (message: string, type: ToastType = "success") =>
    setToast({ message, type });

  // Overview
  const [overview, setOverview] = useState<Record<string, unknown> | null>(null);

  // Links
  const [paste, setPaste] = useState("");
  const [batchName, setBatchName] = useState("");
  const [preview, setPreview] = useState<{ new: number; duplicates: number; invalid: number } | null>(null);
  const [adminLinks, setAdminLinks] = useState<OutreachLink[]>([]);
  const [linkStatusFilter, setLinkStatusFilter] = useState("all");

  // Team
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [newMember, setNewMember] = useState({ name: "", email: "", password: "", role: "member" });
  const [inviteLabel, setInviteLabel] = useState("");
  const [inviteUses, setInviteUses] = useState(10);
  const [generatedCode, setGeneratedCode] = useState("");
  const [fundMemberId, setFundMemberId] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [fundNote, setFundNote] = useState("");

  // Leads
  const [adminLeads, setAdminLeads] = useState<(Lead & { team_members?: { name: string; email: string } })[]>([]);
  const [leadMemberFilter, setLeadMemberFilter] = useState("all");
  const [leadStatusFilter, setLeadStatusFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadModalOpen, setLeadModalOpen] = useState(false);

  // Scripts
  const [script, setScript] = useState("");

  // Referrals & Funds
  const [referrals, setReferrals] = useState<Record<string, unknown>[]>([]);
  const [funds, setFunds] = useState<Record<string, unknown>[]>([]);
  const [fundFilter, setFundFilter] = useState("all");

  const loadOverview = useCallback(async () => {
    const res = await fetch(`/api/admin/overview?key=${adminKey}`);
    setOverview(await res.json());
  }, [adminKey]);

  const loadLinks = useCallback(async () => {
    const res = await fetch(`/api/admin/links?key=${adminKey}&status=${linkStatusFilter}`);
    const data = await res.json();
    setAdminLinks(data.links || []);
  }, [adminKey, linkStatusFilter]);

  const loadMembers = useCallback(async () => {
    const res = await fetch(`/api/admin/members?key=${adminKey}`);
    const data = await res.json();
    setMembers(data.members || []);
  }, [adminKey]);

  const loadLeads = useCallback(async () => {
    const res = await fetch(
      `/api/admin/leads?key=${adminKey}&memberId=${leadMemberFilter === "all" ? "" : leadMemberFilter}&status=${leadStatusFilter}`
    );
    const data = await res.json();
    setAdminLeads(data.leads || []);
  }, [adminKey, leadMemberFilter, leadStatusFilter]);

  const loadScript = useCallback(async () => {
    const res = await fetch(`/api/admin/scripts?key=${adminKey}`);
    const data = await res.json();
    setScript(data.script || "");
  }, [adminKey]);

  const loadReferrals = useCallback(async () => {
    const res = await fetch(`/api/admin/referrals?key=${adminKey}`);
    const data = await res.json();
    setReferrals(data.referrals || []);
  }, [adminKey]);

  const loadFunds = useCallback(async () => {
    const res = await fetch(
      `/api/admin/funds?key=${adminKey}${fundFilter !== "all" ? `&memberId=${fundFilter}` : ""}`
    );
    const data = await res.json();
    setFunds(data.funds || []);
  }, [adminKey, fundFilter]);

  useEffect(() => {
    if (tab === "overview") loadOverview();
    if (tab === "links") loadLinks();
    if (tab === "team") loadMembers();
    if (tab === "leads") { loadLeads(); loadMembers(); }
    if (tab === "scripts") loadScript();
    if (tab === "referrals") loadReferrals();
    if (tab === "funds") { loadFunds(); loadMembers(); }
  }, [tab, loadOverview, loadLinks, loadMembers, loadLeads, loadScript, loadReferrals, loadFunds]);

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
    showToast(`Imported ${data.inserted} links (${data.duplicates} duplicates skipped)`);
    setPaste("");
    setPreview(null);
    loadLinks();
  }

  async function resetLink(linkId: string) {
    await fetch(`/api/admin/links/reset?key=${adminKey}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ linkId }),
    });
    showToast("Link reset to available");
    loadLinks();
  }

  async function addMember() {
    const res = await fetch(`/api/admin/members?key=${adminKey}`, {
      method: "POST",
      headers,
      body: JSON.stringify(newMember),
    });
    const data = await res.json();
    if (data.error) showToast(data.error, "error");
    else {
      showToast("Member added");
      setNewMember({ name: "", email: "", password: "", role: "member" });
      loadMembers();
    }
  }

  async function toggleActive(memberId: string, is_active: boolean) {
    await fetch(`/api/admin/members?key=${adminKey}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ memberId, is_active }),
    });
    loadMembers();
  }

  async function resetPassword(email: string) {
    await fetch(`/api/admin/members/reset-password?key=${adminKey}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email }),
    });
    showToast("Password reset email sent");
  }

  async function generateInvite() {
    const res = await fetch(`/api/admin/invite-codes?key=${adminKey}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ label: inviteLabel, uses: inviteUses }),
    });
    const data = await res.json();
    setGeneratedCode(data.code?.code || "");
    showToast("Invite code generated");
  }

  async function addFunds() {
    await fetch(`/api/admin/funds?key=${adminKey}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ memberId: fundMemberId, amount: parseFloat(fundAmount), note: fundNote }),
    });
    showToast("Funds added");
    setFundAmount("");
    setFundNote("");
  }

  async function saveScript() {
    await fetch(`/api/admin/scripts?key=${adminKey}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ script }),
    });
    showToast("Script saved");
  }

  async function convertReferral(referralId: string, reward: number) {
    await fetch(`/api/admin/referrals?key=${adminKey}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ referralId, reward_pkr: reward }),
    });
    showToast("Referral converted");
    loadReferrals();
  }

  const ov = overview as {
    members?: number;
    links?: { available: number; claimed: number; used: number };
    leads?: number;
    deals?: number;
    today?: { links: number; leads: number };
  } | null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-bricolage font-extrabold text-2xl">Admin Panel</h1>
        <span className="text-xs text-dimmer">InMailly Admin</span>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-line pb-0">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-semibold capitalize border-b-2 -mb-px",
              tab === t ? "text-ind border-ind" : "text-dimmer border-transparent hover:text-mid"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && ov && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard value={ov.members || 0} label="Members" />
            <StatCard value={ov.leads || 0} label="Leads" />
            <StatCard value={ov.deals || 0} label="Deals closed" />
            <StatCard
              value={(ov.links?.available || 0) + (ov.links?.claimed || 0) + (ov.links?.used || 0)}
              label="Total links"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <StatCard value={ov.links?.available || 0} label="Available" sub="links" />
            <StatCard value={ov.links?.claimed || 0} label="Claimed" sub="links" />
            <StatCard value={ov.links?.used || 0} label="Used" sub="links" />
          </div>
          <div className="card-dark p-5">
            <h3 className="font-bricolage font-bold mb-3">Today&apos;s activity</h3>
            <p className="text-sm text-mid">
              {ov.today?.links || 0} links imported · {ov.today?.leads || 0} leads added
            </p>
          </div>
        </div>
      )}

      {tab === "links" && (
        <div className="space-y-6">
          <div className="card-dark p-5 space-y-4">
            <h3 className="font-bricolage font-bold">Import links</h3>
            <textarea
              className="input-field min-h-[120px] font-mono text-sm"
              placeholder="Paste URLs here, one per line…"
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
            />
            <input
              className="input-field"
              placeholder="Batch name (optional)"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
            />
            <div className="flex gap-3">
              <Button variant="ghost" onClick={handlePreview}>Preview</Button>
              <Button onClick={handleImport}>Import</Button>
            </div>
            {preview && (
              <p className="text-sm text-mid">
                {preview.new} new · {preview.duplicates} duplicates · {preview.invalid} invalid lines
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <select
              className="input-field w-auto text-sm py-2"
              value={linkStatusFilter}
              onChange={(e) => setLinkStatusFilter(e.target.value)}
            >
              {["all", "available", "claimed", "used"].map((s) => (
                <option key={s} value={s} className="bg-card capitalize">{s}</option>
              ))}
            </select>
          </div>
          <div className="card-dark overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-dimmer text-xs uppercase border-b border-line">
                  <th className="text-left px-4 py-3">URL</th>
                  <th className="text-left px-4 py-3">Label</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Claimed</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminLinks.map((link) => (
                  <tr key={link.id} className="border-b border-line">
                    <td className="px-4 py-3 max-w-[200px] truncate text-ind">{truncateUrl(link.url, 40)}</td>
                    <td className="px-4 py-3">{link.smart_label}</td>
                    <td className="px-4 py-3"><Badge variant={link.status}>{link.status}</Badge></td>
                    <td className="px-4 py-3 text-dimmer text-xs">{formatDate(link.claimed_at)}</td>
                    <td className="px-4 py-3">
                      {link.status === "used" && (
                        <Button variant="ghost" size="sm" onClick={() => resetLink(link.id)}>Reset</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "team" && (
        <div className="space-y-6">
          <div className="card-dark overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-dimmer text-xs uppercase border-b border-line">
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Links</th>
                  <th className="text-left px-4 py-3">Leads</th>
                  <th className="text-left px-4 py-3">Active</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-line">
                    <td className="px-4 py-3">{m.name}</td>
                    <td className="px-4 py-3">{m.email}</td>
                    <td className="px-4 py-3 capitalize">{m.role}</td>
                    <td className="px-4 py-3">{m.active_links}</td>
                    <td className="px-4 py-3">{m.leads_count}</td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={m.is_active}
                        onChange={(e) => toggleActive(m.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => resetPassword(m.email)}>Reset pwd</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card-dark p-5 space-y-3">
              <h3 className="font-bricolage font-bold">Add member</h3>
              <input className="input-field" placeholder="Name" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} />
              <input className="input-field" placeholder="Email" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} />
              <input className="input-field" type="password" placeholder="Password" value={newMember.password} onChange={(e) => setNewMember({ ...newMember, password: e.target.value })} />
              <Button onClick={addMember} className="w-full">Add member</Button>
            </div>
            <div className="card-dark p-5 space-y-3">
              <h3 className="font-bricolage font-bold">Generate invite code</h3>
              <input className="input-field" placeholder="Label" value={inviteLabel} onChange={(e) => setInviteLabel(e.target.value)} />
              <input className="input-field" type="number" placeholder="Uses" value={inviteUses} onChange={(e) => setInviteUses(parseInt(e.target.value))} />
              <Button onClick={generateInvite} className="w-full">Generate</Button>
              {generatedCode && <p className="font-mono text-ind text-center">{generatedCode}</p>}
            </div>
            <div className="card-dark p-5 space-y-3 lg:col-span-2">
              <h3 className="font-bricolage font-bold">Add funds</h3>
              <select className="input-field" value={fundMemberId} onChange={(e) => setFundMemberId(e.target.value)}>
                <option value="" className="bg-card">Select member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id} className="bg-card">{m.name}</option>
                ))}
              </select>
              <input className="input-field" type="number" placeholder="Amount PKR" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} />
              <input className="input-field" placeholder="Note" value={fundNote} onChange={(e) => setFundNote(e.target.value)} />
              <Button onClick={addFunds} className="w-full">Add funds</Button>
            </div>
          </div>
        </div>
      )}

      {tab === "leads" && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <select className="input-field w-auto text-sm py-2" value={leadMemberFilter} onChange={(e) => setLeadMemberFilter(e.target.value)}>
              <option value="all" className="bg-card">All members</option>
              {members.map((m) => (
                <option key={m.id} value={m.id} className="bg-card">{m.name}</option>
              ))}
            </select>
            <select className="input-field w-auto text-sm py-2" value={leadStatusFilter} onChange={(e) => setLeadStatusFilter(e.target.value)}>
              {["all", "new", "contacted", "replied", "interested", "closed", "dead"].map((s) => (
                <option key={s} value={s} className="bg-card capitalize">{s}</option>
              ))}
            </select>
          </div>
          <div className="card-dark overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-dimmer text-xs uppercase border-b border-line">
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Member</th>
                  <th className="text-left px-4 py-3">Company</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {adminLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-line hover:bg-off cursor-pointer"
                    onClick={() => { setSelectedLead(lead); setLeadModalOpen(true); }}
                  >
                    <td className="px-4 py-3">{lead.name}</td>
                    <td className="px-4 py-3 text-mid">{lead.team_members?.name}</td>
                    <td className="px-4 py-3">{lead.company || "—"}</td>
                    <td className="px-4 py-3"><Badge variant={lead.status}>{lead.status}</Badge></td>
                    <td className="px-4 py-3 text-dimmer text-xs">{formatDate(lead.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectedLead && (
            <LeadModal
              open={leadModalOpen}
              onClose={() => setLeadModalOpen(false)}
              mode="view"
              memberId={selectedLead.member_id}
              memberName="Admin"
              lead={selectedLead}
              isAdmin
              onSaved={loadLeads}
            />
          )}
        </div>
      )}

      {tab === "scripts" && (
        <div className="card-dark p-5 space-y-4">
          <h3 className="font-bricolage font-bold">Daily script template</h3>
          <textarea
            className="input-field min-h-[200px]"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Write today's outreach script template…"
          />
          <Button onClick={saveScript}>Save script</Button>
        </div>
      )}

      {tab === "referrals" && (
        <div className="card-dark overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-dimmer text-xs uppercase border-b border-line">
                <th className="text-left px-4 py-3">Referrer</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Reward</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.id as string} className="border-b border-line">
                  <td className="px-4 py-3">{(r.team_members as { name: string })?.name}</td>
                  <td className="px-4 py-3">{r.referred_email as string}</td>
                  <td className="px-4 py-3 capitalize">{r.status as string}</td>
                  <td className="px-4 py-3">{r.reward_pkr as number} PKR</td>
                  <td className="px-4 py-3">
                    {r.status !== "converted" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const reward = prompt("Reward PKR amount:", "1000");
                          if (reward) convertReferral(r.id as string, parseFloat(reward));
                        }}
                      >
                        Convert
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "funds" && (
        <div className="space-y-4">
          <select className="input-field w-auto text-sm py-2" value={fundFilter} onChange={(e) => setFundFilter(e.target.value)}>
            <option value="all" className="bg-card">All members</option>
            {members.map((m) => (
              <option key={m.id} value={m.id} className="bg-card">{m.name}</option>
            ))}
          </select>
          <div className="card-dark overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-dimmer text-xs uppercase border-b border-line">
                  <th className="text-left px-4 py-3">Member</th>
                  <th className="text-left px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Note</th>
                  <th className="text-left px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {funds.map((f) => (
                  <tr key={f.id as string} className="border-b border-line">
                    <td className="px-4 py-3">{(f.team_members as { name: string })?.name}</td>
                    <td className="px-4 py-3 text-green-400">+{f.amount_pkr as number} PKR</td>
                    <td className="px-4 py-3 text-mid">{f.note as string}</td>
                    <td className="px-4 py-3 text-dimmer">{formatDate(f.added_at as string)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
