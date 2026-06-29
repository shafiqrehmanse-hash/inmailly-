"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import StatCard from "@/components/team/StatCard";
import { createClient } from "@/lib/supabase/client";
import type { MemberFund, Referral, TeamMember } from "@/lib/types";
import { getSiteUrl } from "@/lib/site-url";
import { formatDate, getReferralCode } from "@/lib/utils";

export default function ReferralsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [member, setMember] = useState<TeamMember | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [funds, setFunds] = useState<MemberFund[]>([]);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: m } = await supabase
      .from("team_members")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (!m) return;
    setMember(m as TeamMember);

    const [{ data: refs }, { data: fundRows }] = await Promise.all([
      supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", m.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("member_funds")
        .select("*")
        .eq("member_id", m.id)
        .order("added_at", { ascending: false }),
    ]);

    setReferrals((refs as Referral[]) || []);
    setFunds((fundRows as MemberFund[]) || []);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!member) return null;

  const code = getReferralCode(member.id);
  const appUrl = getSiteUrl();
  const shareLink = `${appUrl}/register?ref=${code}`;
  const joined = referrals.filter((r) => r.status === "joined" || r.status === "converted").length;
  const converted = referrals.filter((r) => r.status === "converted").length;
  const totalEarned = funds.reduce((s, f) => s + Number(f.amount_pkr), 0);

  async function copyLink() {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">✦ Earn & Refer</h1>
        <p className="text-lux-muted text-sm mt-1">Share your code and earn when referrals convert</p>
      </div>

      <div className="lux-card p-6 space-y-4">
        <div>
          <div className="text-xs text-lux-muted uppercase tracking-wide mb-2">Your referral code</div>
          <div className="font-mono text-lg bg-lux-bg2 border border-white/[0.08] rounded-xl px-4 py-3 text-lux-text">
            {code}
          </div>
        </div>
        <div>
          <div className="text-xs text-lux-muted uppercase tracking-wide mb-2">Shareable link</div>
          <div className="flex gap-2">
            <input readOnly className="lux-input text-sm flex-1" value={shareLink} />
            <Button variant="lux" onClick={copyLink} size="sm">
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard value={referrals.length} label="Referred" />
        <StatCard value={joined} label="Joined" />
        <StatCard value={converted} label="Converted" />
        <StatCard value={`${totalEarned.toLocaleString()} PKR`} label="Total earned" />
      </div>

      <div className="lux-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.08] font-bricolage font-bold text-lux-text">
          Recent referrals
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-lux-muted text-xs uppercase border-b border-white/[0.08]">
                <th className="text-left px-5 py-3">Email</th>
                <th className="text-left px-5 py-3">Name</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {referrals.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-lux-muted">
                    No referrals yet
                  </td>
                </tr>
              ) : (
                referrals.map((r) => (
                  <tr key={r.id} className="border-b border-white/[0.06] hover:bg-white/[0.03]">
                    <td className="px-5 py-3 text-lux-text">{r.referred_email}</td>
                    <td className="px-5 py-3 text-lux-text">{r.referred_name || "—"}</td>
                    <td className="px-5 py-3 capitalize text-lux-muted">{r.status}</td>
                    <td className="px-5 py-3 text-lux-muted/70">{formatDate(r.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lux-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.08] font-bricolage font-bold text-lux-text">
          Earnings history
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-lux-muted text-xs uppercase border-b border-white/[0.08]">
                <th className="text-left px-5 py-3">Amount</th>
                <th className="text-left px-5 py-3">Note</th>
                <th className="text-left px-5 py-3">Added by</th>
                <th className="text-left px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {funds.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-lux-muted">
                    No earnings yet
                  </td>
                </tr>
              ) : (
                funds.map((f) => (
                  <tr key={f.id} className="border-b border-white/[0.06]">
                    <td className="px-5 py-3 font-semibold text-emerald-400">
                      +{Number(f.amount_pkr).toLocaleString()} PKR
                    </td>
                    <td className="px-5 py-3 text-lux-muted">{f.note || "—"}</td>
                    <td className="px-5 py-3 text-lux-muted">{f.added_by}</td>
                    <td className="px-5 py-3 text-lux-muted/70">{formatDate(f.added_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
