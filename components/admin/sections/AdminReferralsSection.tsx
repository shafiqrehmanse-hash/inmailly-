"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import LuxSelect from "@/components/ui/LuxSelect";
import type { TeamMember } from "@/lib/types";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";
import { formatDate } from "@/lib/utils";

export default function AdminReferralsSection() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const [referrals, setReferrals] = useState<Record<string, unknown>[]>([]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/referrals?key=${adminKey}`);
    const data = await res.json();
    setReferrals(data.referrals || []);
  }, [adminKey]);

  useEffect(() => {
    load();
  }, [load]);

  async function convertReferral(referralId: string, reward: number) {
    await fetch(`/api/admin/referrals?key=${adminKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ referralId, reward_pkr: reward }),
    });
    showToast("Referral converted");
    load();
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Referrals</h1>
        <p className="text-sm text-lux-muted mt-1">Track commissions when referrals close deals.</p>
      </div>
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
    </div>
  );
}

export function AdminFundsSection({ showInvite = false }: { showInvite?: boolean }) {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const headers = { "Content-Type": "application/json", "x-admin-key": adminKey };
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [funds, setFunds] = useState<Record<string, unknown>[]>([]);
  const [fundFilter, setFundFilter] = useState("all");
  const [fundMemberId, setFundMemberId] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [fundNote, setFundNote] = useState("");
  const [inviteLabel, setInviteLabel] = useState("");
  const [inviteUses, setInviteUses] = useState(10);
  const [generatedCode, setGeneratedCode] = useState("");

  const loadMembers = useCallback(async () => {
    const res = await fetch(`/api/admin/members?key=${adminKey}`);
    const data = await res.json();
    setMembers(data.members || []);
  }, [adminKey]);

  const loadFunds = useCallback(async () => {
    const res = await fetch(
      `/api/admin/funds?key=${adminKey}${fundFilter !== "all" ? `&memberId=${fundFilter}` : ""}`
    );
    const data = await res.json();
    setFunds(data.funds || []);
  }, [adminKey, fundFilter]);

  useEffect(() => {
    loadMembers();
    loadFunds();
  }, [loadMembers, loadFunds]);

  async function addFunds() {
    await fetch(`/api/admin/funds?key=${adminKey}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ memberId: fundMemberId, amount: parseFloat(fundAmount), note: fundNote }),
    });
    showToast("Funds added");
    setFundAmount("");
    setFundNote("");
    loadFunds();
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Funds &amp; invite</h1>
        <p className="text-sm text-lux-muted mt-1">Add PKR rewards and generate team signup codes.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="lux-card p-5 space-y-3">
          <h3 className="font-bricolage font-bold text-lux-text">Add funds</h3>
          <LuxSelect
            value={fundMemberId}
            onChange={setFundMemberId}
            placeholder="Select member"
            options={members.map((m) => ({ value: m.id, label: m.name }))}
          />
          <input className="lux-input" type="number" placeholder="Amount PKR" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} />
          <input className="lux-input" placeholder="Note" value={fundNote} onChange={(e) => setFundNote(e.target.value)} />
          <Button variant="lux" onClick={addFunds}>Add funds</Button>
        </div>
        {showInvite && (
          <div className="lux-card p-5 space-y-3">
            <h3 className="font-bricolage font-bold text-lux-text">Invite code</h3>
            <input className="lux-input" placeholder="Label" value={inviteLabel} onChange={(e) => setInviteLabel(e.target.value)} />
            <input className="lux-input" type="number" min={1} value={inviteUses} onChange={(e) => setInviteUses(parseInt(e.target.value) || 1)} />
            <Button variant="lux" onClick={generateInvite}>Generate code</Button>
            {generatedCode && <p className="font-mono text-lux-cyan text-center">{generatedCode}</p>}
          </div>
        )}
      </div>

      <LuxSelect
        className="w-44"
        size="sm"
        value={fundFilter}
        onChange={setFundFilter}
        options={[{ value: "all", label: "All members" }, ...members.map((m) => ({ value: m.id, label: m.name }))]}
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
  );
}
