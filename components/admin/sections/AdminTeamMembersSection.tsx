"use client";

import AdminStatCard from "@/components/admin/AdminStatCard";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import LuxSelect from "@/components/ui/LuxSelect";
import TeamAvatar from "@/components/team/TeamAvatar";
import type { TeamMember } from "@/lib/types";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";

type MemberRow = TeamMember & { active_links: number; leads_count: number; deals_closed?: number };

const roleOptions = [
  { value: "member", label: "Outreach worker" },
  { value: "senior", label: "Senior worker" },
  { value: "team_leader", label: "Team leader" },
  { value: "campaign_manager", label: "Campaign manager" },
  { value: "content_manager", label: "Content manager" },
  { value: "admin", label: "Team admin" },
];

export default function AdminTeamMembersSection() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const headers = { "Content-Type": "application/json", "x-admin-key": adminKey };
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "member",
  });
  const [inviteLabel, setInviteLabel] = useState("");
  const [inviteUses, setInviteUses] = useState(10);
  const [generatedCode, setGeneratedCode] = useState("");
  const [hidePickerId, setHidePickerId] = useState("");

  const loadMembers = useCallback(async () => {
    const res = await fetch(`/api/admin/members?key=${adminKey}`);
    const data = await res.json();
    setMembers(data.members || []);
  }, [adminKey]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

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
      setNewMember({ name: "", email: "", phone: "", password: "", role: "member" });
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

  async function toggleHiddenFromTeam(memberId: string, hidden_from_team: boolean) {
    const res = await fetch(`/api/admin/members?key=${adminKey}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ memberId, hidden_from_team }),
    });
    const data = await res.json();
    if (data.error) {
      const hint =
        data.error.includes("hidden_from_team") || data.error.includes("column")
          ? " Run migration 029_team_member_hidden_from_team.sql in Supabase first."
          : "";
      showToast(data.error + hint, "error");
    } else {
      showToast(hidden_from_team ? "Hidden from team views" : "Visible to team again");
      loadMembers();
    }
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

  async function updateLeader(memberId: string, leaderId: string) {
    const res = await fetch(`/api/admin/members?key=${adminKey}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ memberId, leader_id: leaderId || null }),
    });
    const data = await res.json();
    if (data.error) showToast(data.error, "error");
    else {
      showToast(leaderId ? "Assigned to team leader" : "Unassigned from team leader");
      loadMembers();
    }
  }

  const leaders = members.filter((m) => m.role === "team_leader" && m.is_active);
  const leaderOptions = [
    { value: "", label: "No team leader" },
    ...leaders.map((l) => ({ value: l.id, label: l.name })),
  ];
  const canAssignLeader = (role: string) =>
    role === "member" || role === "senior" || role === "admin";
  const hiddenMembers = members.filter((m) => m.hidden_from_team);

  async function resetPassword(email: string) {
    await fetch(`/api/admin/members/reset-password?key=${adminKey}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email }),
    });
    showToast("Password reset email sent");
  }

  async function deleteMember(member: MemberRow) {
    const warn =
      member.active_links > 0 || member.leads_count > 0
        ? `${member.name} has ${member.active_links} active links and ${member.leads_count} leads. Delete permanently?`
        : `Delete ${member.name} permanently? This cannot be undone.`;
    if (!confirm(warn)) return;

    const res = await fetch(`/api/admin/members?key=${adminKey}`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ memberId: member.id }),
    });
    const data = await res.json();
    if (data.error) showToast(data.error, "error");
    else {
      showToast(`Deleted ${member.name}`);
      loadMembers();
    }
  }

  async function generateInvite() {
    if (!inviteLabel.trim()) {
      showToast("Enter a name/label first", "error");
      return;
    }
    const res = await fetch(`/api/admin/invite-codes?key=${adminKey}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ label: inviteLabel, uses: inviteUses }),
    });
    const data = await res.json();
    if (data.error) {
      showToast(data.error, "error");
      return;
    }
    setGeneratedCode(data.code?.code || "");
    showToast("Invite code generated from label");
  }

  const outreachMembers = members.filter(
    (m) => m.is_active && m.role !== "campaign_manager" && m.role !== "content_manager"
  );
  const totalLeads = outreachMembers.reduce((s, m) => s + m.leads_count, 0);
  const totalDeals = outreachMembers.reduce((s, m) => s + (m.deals_closed || 0), 0);
  const totalLinks = outreachMembers.reduce((s, m) => s + m.active_links, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Team members</h1>
        <p className="text-sm text-lux-muted mt-1">Access, roles, invites, and outreach worker accounts.</p>
      </div>

      <section className="lux-card-elite p-5 border-2 border-lux-violet/40 bg-gradient-to-br from-lux-violet/[0.12] via-lux-bg2/50 to-lux-blue/[0.06] shadow-[0_0_40px_rgba(139,92,246,0.12)]">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-violet mb-1">
              Hide from team
            </p>
            <h2 className="font-bricolage font-bold text-xl text-lux-text">Keep someone off the leaderboard</h2>
            <p className="text-sm text-lux-muted mt-1 max-w-2xl">
              Hidden members can still log in and work. They won&apos;t appear on the team performance board, hub podium, or victory banners for everyone else. You still see them here and in admin performance.
            </p>
          </div>
          {hiddenMembers.length > 0 && (
            <span className="text-xs font-bold uppercase tracking-wide text-slate-300 bg-slate-500/15 border border-slate-400/25 px-3 py-1.5 rounded-lg">
              {hiddenMembers.length} hidden
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[0.65rem] font-semibold uppercase tracking-wide text-lux-muted mb-1.5 block">
              Select member
            </label>
            <LuxSelect
              value={hidePickerId}
              onChange={setHidePickerId}
              placeholder="Choose who to hide…"
              options={members.map((m) => ({
                value: m.id,
                label: `${m.name}${m.hidden_from_team ? " (already hidden)" : ""}`,
              }))}
            />
          </div>
          <Button
            variant="lux"
            disabled={!hidePickerId}
            onClick={() => {
              const picked = members.find((m) => m.id === hidePickerId);
              if (!picked) return;
              toggleHiddenFromTeam(picked.id, !picked.hidden_from_team);
            }}
            className="shrink-0 min-w-[160px]"
          >
            {members.find((m) => m.id === hidePickerId)?.hidden_from_team
              ? "Show to team again"
              : "Hide from team"}
          </Button>
        </div>
        {hiddenMembers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-lux-muted mb-2">
              Currently hidden
            </p>
            <div className="flex flex-wrap gap-2">
              {hiddenMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleHiddenFromTeam(m.id, false)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-400/25 bg-slate-500/10 px-3 py-1.5 text-sm text-lux-text hover:bg-slate-500/20 transition-colors"
                  title="Click to show this member to the team again"
                >
                  <TeamAvatar name={m.name} photoUrl={m.photo_url} size="sm" />
                  {m.name}
                  <span className="text-xs text-lux-cyan font-semibold">Show again</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard value={outreachMembers.length} label="Outreach members" />
        <AdminStatCard value={totalLeads} label="Outreach leads" />
        <AdminStatCard value={totalDeals} label="Deals closed" />
        <AdminStatCard value={totalLinks} label="Active links" />
      </div>

      <section>
        <p className="admin-section-title mb-4">Quick actions</p>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="lux-card p-5 space-y-3">
            <h3 className="font-bricolage font-bold text-lux-text">Add member</h3>
            <p className="text-xs text-lux-muted -mt-1">Create account with email and temp password</p>
            <input className="lux-input" placeholder="Full name" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} />
            <input className="lux-input" placeholder="Email" type="email" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} />
            <input className="lux-input" placeholder="WhatsApp / phone (+92…)" type="tel" value={newMember.phone} onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })} />
            <input className="lux-input" type="password" placeholder="Temporary password" value={newMember.password} onChange={(e) => setNewMember({ ...newMember, password: e.target.value })} />
            <LuxSelect value={newMember.role} onChange={(role) => setNewMember({ ...newMember, role })} options={roleOptions} />
            <Button variant="lux" onClick={addMember} className="w-full">Add member</Button>
          </div>
          <div className="lux-card p-5 space-y-3">
            <h3 className="font-bricolage font-bold text-lux-text">Invite code</h3>
            <p className="text-xs text-lux-muted -mt-1">For self-registration at /team/register</p>
            <input className="lux-input" placeholder="Name / label (e.g. Hania batch)" value={inviteLabel} onChange={(e) => setInviteLabel(e.target.value)} />
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
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="admin-section-title">All members</p>
            <p className="text-xs text-lux-muted mt-1">
              Use the <strong className="text-lux-violet">Visibility</strong> column (2nd column) to hide someone from the team leaderboard.
            </p>
          </div>
          <span className="text-xs text-lux-muted">{members.length} total</span>
        </div>
        <div className="lux-card overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-lux-muted text-xs uppercase bg-lux-bg2 border-b border-white/[0.06]">
                <th className="text-left px-4 py-3 font-semibold">Name</th>
                <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Visibility</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold hidden xl:table-cell">Phone</th>
                <th className="text-left px-4 py-3 font-semibold">Role</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Team leader</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Links</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Leads</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Deals</th>
                <th className="text-left px-4 py-3 font-semibold">Active</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-lux-muted">
                    No team members yet.
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="border-b border-white/[0.06] last:border-0 hover:bg-lux-bg2/50">
                    <td className="px-4 py-3 font-medium text-lux-text">
                      <div className="flex items-center gap-2.5">
                        <TeamAvatar name={m.name} photoUrl={m.photo_url} size="sm" />
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          {m.name}
                          {m.hidden_from_team && (
                            <span className="text-[0.58rem] font-bold uppercase tracking-wider text-slate-300 bg-slate-500/15 border border-slate-400/25 px-2 py-0.5 rounded-md">
                              Hidden from team
                            </span>
                          )}
                          {m.role === "team_leader" && (
                            <span className="text-[0.58rem] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                              Team leader · {members.filter((w) => w.leader_id === m.id).length} workers
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <Button
                        variant={m.hidden_from_team ? "lux-ghost" : "lux"}
                        size="sm"
                        className={
                          m.hidden_from_team
                            ? "text-lux-cyan border-lux-cyan/30 text-xs"
                            : "text-xs bg-lux-violet/20 border-lux-violet/40 hover:bg-lux-violet/30"
                        }
                        onClick={() => toggleHiddenFromTeam(m.id, !m.hidden_from_team)}
                      >
                        {m.hidden_from_team ? "Show team" : "Hide team"}
                      </Button>
                    </td>
                    <td className="px-4 py-3 text-lux-muted">{m.email}</td>
                    <td className="px-4 py-3 text-lux-muted whitespace-nowrap text-xs hidden xl:table-cell">
                      {m.phone ? (
                        <a href={`https://wa.me/${m.phone.replace(/[^0-9]/g, "")}`} className="text-lux-cyan hover:underline" target="_blank" rel="noopener noreferrer">
                          {m.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <LuxSelect size="sm" className="min-w-[160px]" value={m.role} onChange={(role) => updateRole(m.id, role)} options={roleOptions} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {canAssignLeader(m.role) ? (
                        <LuxSelect
                          size="sm"
                          className="min-w-[140px]"
                          value={m.leader_id || ""}
                          onChange={(leaderId) => updateLeader(m.id, leaderId)}
                          options={leaderOptions}
                        />
                      ) : (
                        <span className="text-xs text-lux-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">{m.active_links}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{m.leads_count}</td>
                    <td className="px-4 py-3 text-emerald-400 hidden md:table-cell">{m.deals_closed || 0}</td>
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded border-white/20 text-lux-cyan focus:ring-lux-cyan" checked={m.is_active} onChange={(e) => toggleActive(m.id, e.target.checked)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Link href={`/admin/team/links?memberId=${m.id}`}>
                          <Button variant="lux-ghost" size="sm">Links</Button>
                        </Link>
                        <Button variant="lux-ghost" size="sm" onClick={() => resetPassword(m.email)}>Reset pwd</Button>
                        <Button variant="lux-ghost" size="sm" onClick={() => deleteMember(m)} className="text-red-400 hover:text-red-300">
                          Delete
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
  );
}
