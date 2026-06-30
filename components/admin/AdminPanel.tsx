"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LeadModal from "@/components/team/LeadModal";
import AdminClientsSection from "@/components/admin/AdminClientsSection";
import AdminProjectsSection from "@/components/admin/AdminProjectsSection";
import AdminLinksSection from "@/components/admin/AdminLinksSection";
import AdminWebsiteSection from "@/components/admin/AdminWebsiteSection";
import AdminStatCard from "@/components/admin/AdminStatCard";
import Toast, { ToastType } from "@/components/team/Toast";
import LuxSelect from "@/components/ui/LuxSelect";
import type { Lead, TeamMember } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import AdminShell, { type AdminTab } from "@/components/admin/AdminShell";

type MemberRow = TeamMember & { active_links: number; leads_count: number };

export default function AdminPanel({ adminKey }: { adminKey: string }) {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState("");
  const headers = { "Content-Type": "application/json", "x-admin-key": adminKey };
  const showToast = (message: string, type: ToastType = "success") =>
    setToast({ message, type });

  // Overview
  const [overview, setOverview] = useState<Record<string, unknown> | null>(null);

  // Links / projects cross-nav
  const [linksMemberFilter, setLinksMemberFilter] = useState<string | undefined>();
  const [projectsClientFilter, setProjectsClientFilter] = useState<string | undefined>();

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
    setOverviewLoading(true);
    setOverviewError("");
    try {
      const res = await fetch(`/api/admin/overview?key=${adminKey}`);
      const data = await res.json();
      if (!res.ok) {
        setOverviewError(data.error || "Could not load overview");
        setOverview(null);
      } else {
        setOverview(data);
      }
    } catch {
      setOverviewError("Network error loading overview");
      setOverview(null);
    }
    setOverviewLoading(false);
  }, [adminKey]);

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
    if (tab === "links" || tab === "team") loadMembers();
    if (tab === "projects") loadMembers();
    if (tab === "clients") loadMembers();
    if (tab === "leads") { loadLeads(); loadMembers(); }
    if (tab === "scripts") loadScript();
    if (tab === "referrals") loadReferrals();
    if (tab === "funds") { loadFunds(); loadMembers(); }
  }, [tab, loadOverview, loadMembers, loadLeads, loadScript, loadReferrals, loadFunds]);

  function openProjectsForClient(clientId: string) {
    setProjectsClientFilter(clientId);
    setTab("projects");
  }

  function openLinksForMember(memberId: string) {
    setLinksMemberFilter(memberId);
    setTab("links");
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

  async function updateRole(memberId: string, role: string) {
    const res = await fetch(`/api/admin/members?key=${adminKey}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ memberId, role }),
    });
    const data = await res.json();
    if (data.error) showToast(data.error, "error");
    else {
      showToast("Role updated");
      loadMembers();
    }
  }

  const roleOptions = [
    { value: "member", label: "Outreach worker" },
    { value: "senior", label: "Senior worker" },
    { value: "campaign_manager", label: "Campaign manager" },
    { value: "admin", label: "Team admin" },
  ];

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

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  const ov = overview as {
    members?: number;
    clients?: number;
    projects?: { total: number; active: number; preview: number; needs_setup: number };
    links?: { available: number; claimed: number; used: number };
    leads?: number;
    deals?: number;
    today?: { links: number; leads: number };
  } | null;

  return (
    <AdminShell tab={tab} onTab={setTab} onLogout={handleLogout}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="font-bricolage font-extrabold text-2xl text-lux-text capitalize">{tab}</h1>
          <p className="text-sm text-lux-muted mt-1">InMailly operations</p>
        </div>

      {tab === "overview" && (
        overviewLoading ? (
          <p className="text-lux-muted">Loading overview…</p>
        ) : overviewError ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
            {overviewError}
          </div>
        ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminStatCard value={ov?.clients || 0} label="Clients" />
            <AdminStatCard value={ov?.projects?.total || 0} label="Projects" />
            <AdminStatCard value={ov?.members || 0} label="Team members" />
            <AdminStatCard value={ov?.leads || 0} label="Leads" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminStatCard value={ov?.projects?.active || 0} label="Active campaigns" sub="projects" />
            <AdminStatCard value={ov?.projects?.preview || 0} label="Preview / draft" sub="projects" />
            <AdminStatCard value={ov?.deals || 0} label="Deals closed" />
            <AdminStatCard
              value={(ov?.links?.available || 0) + (ov?.links?.claimed || 0) + (ov?.links?.used || 0)}
              label="Total links"
            />
          </div>
          {(ov?.projects?.needs_setup || 0) > 0 && (
            <div className="lux-card p-5 border-amber-500/25 bg-amber-500/5">
              <h3 className="font-bricolage font-bold text-amber-300 mb-1">
                {ov?.projects?.needs_setup} client{ov?.projects?.needs_setup === 1 ? "" : "s"} need setup
              </h3>
              <p className="text-sm text-lux-muted">
                Self-signup accounts still in preview — open Clients → Projects to assign a manager, add scripts, and
                activate.
              </p>
              <Button variant="lux-ghost" size="sm" className="mt-3" onClick={() => setTab("clients")}>
                Go to clients →
              </Button>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <AdminStatCard value={ov?.links?.available || 0} label="Available" sub="links" />
            <AdminStatCard value={ov?.links?.claimed || 0} label="Claimed" sub="links" />
            <AdminStatCard value={ov?.links?.used || 0} label="Used" sub="links" />
          </div>
          <div className="lux-card p-5">
            <h3 className="font-bricolage font-bold text-lux-text mb-2">Today&apos;s activity</h3>
            <p className="text-sm text-lux-muted">
              {ov?.today?.links || 0} links imported · {ov?.today?.leads || 0} leads added
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { tab: "clients" as AdminTab, label: "Manage clients" },
              { tab: "projects" as AdminTab, label: "Campaign projects" },
              { tab: "links" as AdminTab, label: "Assign links" },
              { tab: "team" as AdminTab, label: "Team & invites" },
            ].map((q) => (
              <button
                key={q.tab}
                type="button"
                onClick={() => setTab(q.tab)}
                className="lux-card p-4 text-left text-sm font-semibold text-lux-cyan hover:border-lux-cyan/30 transition-colors"
              >
                {q.label} →
              </button>
            ))}
          </div>
        </div>
        )
      )}

      {tab === "links" && (
        <AdminLinksSection
          adminKey={adminKey}
          members={members}
          onToast={(message, type) => showToast(message, type)}
          initialMemberFilter={linksMemberFilter}
        />
      )}

      {tab === "clients" && (
        <AdminClientsSection
          adminKey={adminKey}
          onToast={(message, type) => showToast(message, type)}
          onOpenProjects={openProjectsForClient}
        />
      )}

      {tab === "projects" && (
        <AdminProjectsSection
          adminKey={adminKey}
          members={members.filter((m) => m.role === "campaign_manager")}
          onToast={(message, type) => showToast(message, type)}
          initialClientFilter={projectsClientFilter}
        />
      )}

      {tab === "website" && (
        <AdminWebsiteSection
          adminKey={adminKey}
          onToast={(message, type) => showToast(message, type)}
        />
      )}

      {tab === "team" && (
        <div className="space-y-8">
          <section>
            <p className="admin-section-title mb-4">Quick actions</p>
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="lux-card p-5 space-y-3">
                <h3 className="font-bricolage font-bold text-lux-text">Add member</h3>
                <p className="text-xs text-lux-muted -mt-1">Create account with email and temp password</p>
                <input className="lux-input" placeholder="Full name" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} />
                <input className="lux-input" placeholder="Email" type="email" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} />
                <input className="lux-input" type="password" placeholder="Temporary password" value={newMember.password} onChange={(e) => setNewMember({ ...newMember, password: e.target.value })} />
                <LuxSelect
                  value={newMember.role}
                  onChange={(role) => setNewMember({ ...newMember, role })}
                  options={roleOptions}
                />
                <Button variant="lux" onClick={addMember} className="w-full">Add member</Button>
              </div>
              <div className="lux-card p-5 space-y-3">
                <h3 className="font-bricolage font-bold text-lux-text">Invite code</h3>
                <p className="text-xs text-lux-muted -mt-1">For team self-registration at /team/register</p>
                <input className="lux-input" placeholder="Label (e.g. March batch)" value={inviteLabel} onChange={(e) => setInviteLabel(e.target.value)} />
                <input className="lux-input" type="number" min={1} placeholder="Number of uses" value={inviteUses} onChange={(e) => setInviteUses(parseInt(e.target.value) || 1)} />
                <Button variant="lux" onClick={generateInvite} className="w-full">Generate code</Button>
                {generatedCode && (
                  <div className="bg-lux-blue/10 border border-lux-blue/30 px-4 py-3 text-center">
                    <p className="text-[0.65rem] uppercase tracking-wide text-lux-muted mb-1">Share this code</p>
                    <p className="font-mono font-bold text-lux-cyan text-lg">{generatedCode}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="lux-card p-5 space-y-3 mt-4">
              <h3 className="font-bricolage font-bold text-lux-text">Add funds</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <LuxSelect
                  className="sm:col-span-2"
                  value={fundMemberId}
                  onChange={setFundMemberId}
                  placeholder="Select member"
                  options={members.map((m) => ({ value: m.id, label: m.name }))}
                />
                <input className="lux-input" type="number" placeholder="Amount PKR" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} />
                <input className="lux-input" placeholder="Note" value={fundNote} onChange={(e) => setFundNote(e.target.value)} />
              </div>
              <Button variant="lux" onClick={addFunds} className="w-full sm:w-auto">Add funds</Button>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <p className="admin-section-title">Team members</p>
              <span className="text-xs text-lux-muted">{members.length} total</span>
            </div>
            <div className="lux-card overflow-x-auto overflow-y-visible">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-lux-muted text-xs uppercase bg-lux-bg2 border-b border-white/[0.06]">
                    <th className="text-left px-4 py-3 font-semibold">Name</th>
                    <th className="text-left px-4 py-3 font-semibold">Email</th>
                    <th className="text-left px-4 py-3 font-semibold">Role</th>
                    <th className="text-left px-4 py-3 font-semibold">Links</th>
                    <th className="text-left px-4 py-3 font-semibold">Leads</th>
                    <th className="text-left px-4 py-3 font-semibold">Active</th>
                    <th className="text-left px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-lux-muted">
                        No team members yet. Add one above or share an invite code.
                      </td>
                    </tr>
                  ) : (
                    members.map((m) => (
                      <tr key={m.id} className="border-b border-white/[0.06] last:border-0 hover:bg-lux-bg2/50">
                        <td className="px-4 py-3 font-medium text-lux-text">{m.name}</td>
                        <td className="px-4 py-3 text-lux-muted">{m.email}</td>
                        <td className="px-4 py-3">
                          <LuxSelect
                            size="sm"
                            className="min-w-[160px]"
                            value={m.role}
                            onChange={(role) => updateRole(m.id, role)}
                            options={roleOptions}
                          />
                        </td>
                        <td className="px-4 py-3">{m.active_links}</td>
                        <td className="px-4 py-3">{m.leads_count}</td>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="rounded border-white/20 text-lux-cyan focus:ring-lux-cyan"
                            checked={m.is_active}
                            onChange={(e) => toggleActive(m.id, e.target.checked)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            <Button variant="lux-ghost" size="sm" onClick={() => openLinksForMember(m.id)}>
                              Links
                            </Button>
                            <Button variant="lux-ghost" size="sm" onClick={() => resetPassword(m.email)}>
                              Reset pwd
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {tab === "leads" && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <LuxSelect
              className="w-44"
              size="sm"
              value={leadMemberFilter}
              onChange={setLeadMemberFilter}
              options={[
                { value: "all", label: "All members" },
                ...members.map((m) => ({ value: m.id, label: m.name })),
              ]}
            />
            <LuxSelect
              className="w-44"
              size="sm"
              value={leadStatusFilter}
              onChange={setLeadStatusFilter}
              options={["all", "new", "contacted", "replied", "interested", "closed", "dead"].map(
                (s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })
              )}
            />
          </div>
          <div className="lux-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-lux-muted text-xs uppercase bg-lux-bg2 border-b border-white/[0.06]">
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
                    className="border-b border-white/[0.06] hover:bg-lux-bg2 cursor-pointer"
                    onClick={() => { setSelectedLead(lead); setLeadModalOpen(true); }}
                  >
                    <td className="px-4 py-3">{lead.name}</td>
                    <td className="px-4 py-3 text-lux-muted">{lead.team_members?.name}</td>
                    <td className="px-4 py-3">{lead.company || "—"}</td>
                    <td className="px-4 py-3"><Badge variant={lead.status}>{lead.status}</Badge></td>
                    <td className="px-4 py-3 text-lux-muted text-xs">{formatDate(lead.updated_at)}</td>
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
        <div className="lux-card p-5 space-y-4">
          <h3 className="font-bricolage font-bold">Daily script template</h3>
          <textarea
            className="lux-input min-h-[200px]"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Write today's outreach script template…"
          />
          <Button variant="lux" onClick={saveScript}>Save script</Button>
        </div>
      )}

      {tab === "referrals" && (
        <div className="lux-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-lux-muted text-xs uppercase border-b border-white/[0.06]">
                <th className="text-left px-4 py-3">Referrer</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Reward</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.id as string} className="border-b border-white/[0.06]">
                  <td className="px-4 py-3">{(r.team_members as { name: string })?.name}</td>
                  <td className="px-4 py-3">{r.referred_email as string}</td>
                  <td className="px-4 py-3 capitalize">{r.status as string}</td>
                  <td className="px-4 py-3">{r.reward_pkr as number} PKR</td>
                  <td className="px-4 py-3">
                    {r.status !== "converted" && (
                      <Button
                        variant="lux-ghost"
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
          <LuxSelect
            className="w-44"
            size="sm"
            value={fundFilter}
            onChange={setFundFilter}
            options={[
              { value: "all", label: "All members" },
              ...members.map((m) => ({ value: m.id, label: m.name })),
            ]}
          />
          <div className="lux-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-lux-muted text-xs uppercase bg-lux-bg2 border-b border-white/[0.06]">
                  <th className="text-left px-4 py-3">Member</th>
                  <th className="text-left px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Note</th>
                  <th className="text-left px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {funds.map((f) => (
                  <tr key={f.id as string} className="border-b border-white/[0.06]">
                    <td className="px-4 py-3">{(f.team_members as { name: string })?.name}</td>
                    <td className="px-4 py-3 text-emerald-400 font-medium">+{f.amount_pkr as number} PKR</td>
                    <td className="px-4 py-3 text-lux-muted">{f.note as string}</td>
                    <td className="px-4 py-3 text-lux-muted">{formatDate(f.added_at as string)}</td>
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
    </AdminShell>
  );
}
