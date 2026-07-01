"use client";

import AdminStatCard from "@/components/admin/AdminStatCard";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import LuxSelect from "@/components/ui/LuxSelect";
import type { TeamMember } from "@/lib/types";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";

type MemberRow = TeamMember & { active_links: number; leads_count: number; deals_closed?: number };

const roleOptions = [
  { value: "member", label: "Outreach worker" },
  { value: "senior", label: "Senior worker" },
  { value: "team_leader", label: "Team leader" },
  { value: "campaign_manager", label: "Campaign manager" },
  { value: "admin", label: "Team admin" },
];

export default function AdminTeamMembersSection() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const headers = { "Content-Type": "application/json", "x-admin-key": adminKey };
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [newMember, setNewMember] = useState({ name: "", email: "", password: "", role: "member" });
  const [inviteLabel, setInviteLabel] = useState("");
  const [inviteUses, setInviteUses] = useState(10);
  const [generatedCode, setGeneratedCode] = useState("");

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

  const outreachMembers = members.filter((m) => m.is_active && m.role !== "campaign_manager");
  const totalLeads = outreachMembers.reduce((s, m) => s + m.leads_count, 0);
  const totalDeals = outreachMembers.reduce((s, m) => s + (m.deals_closed || 0), 0);
  const totalLinks = outreachMembers.reduce((s, m) => s + m.active_links, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Team members</h1>
        <p className="text-sm text-lux-muted mt-1">Access, roles, invites, and outreach worker accounts.</p>
      </div>

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
          <p className="admin-section-title">All members</p>
          <span className="text-xs text-lux-muted">{members.length} total</span>
        </div>
        <div className="lux-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-lux-muted text-xs uppercase bg-lux-bg2 border-b border-white/[0.06]">
                <th className="text-left px-4 py-3 font-semibold">Name</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Role</th>
                <th className="text-left px-4 py-3 font-semibold">Links</th>
                <th className="text-left px-4 py-3 font-semibold">Leads</th>
                <th className="text-left px-4 py-3 font-semibold">Deals</th>
                <th className="text-left px-4 py-3 font-semibold">Active</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-lux-muted">
                    No team members yet.
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="border-b border-white/[0.06] last:border-0 hover:bg-lux-bg2/50">
                    <td className="px-4 py-3 font-medium text-lux-text">
                      <div className="flex flex-wrap items-center gap-2">
                        {m.name}
                        {m.role === "team_leader" && (
                          <span className="text-[0.58rem] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                            Team leader
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-lux-muted">{m.email}</td>
                    <td className="px-4 py-3">
                      <LuxSelect size="sm" className="min-w-[160px]" value={m.role} onChange={(role) => updateRole(m.id, role)} options={roleOptions} />
                    </td>
                    <td className="px-4 py-3">{m.active_links}</td>
                    <td className="px-4 py-3">{m.leads_count}</td>
                    <td className="px-4 py-3 text-emerald-400">{m.deals_closed || 0}</td>
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
