import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLeaderResponse, requireTeamLeader } from "@/lib/team-leader-auth";

export async function GET() {
  const leader = await requireTeamLeader();
  if (isLeaderResponse(leader)) return leader;

  const admin = createAdminClient();
  const { data: codes } = await admin
    .from("invite_codes")
    .select("id, code, label, uses_left, used_count, created_at")
    .eq("created_by_member_id", leader.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (!codes?.length) {
    return NextResponse.json({ funnels: [] });
  }

  const codeStrings = codes.map((c) => c.code);
  const { data: signups } = await admin
    .from("team_members")
    .select("id, name, email, invite_code, joined_at, is_active")
    .in("invite_code", codeStrings);

  const signupIds = (signups || []).map((s) => s.id);
  const claimedByMember: Record<string, number> = {};
  const leadsByMember: Record<string, number> = {};

  if (signupIds.length > 0) {
    const [claimedRes, leadsRes] = await Promise.all([
      admin.from("outreach_links").select("member_id").eq("status", "claimed").in("member_id", signupIds),
      admin.from("leads").select("member_id").is("project_id", null).in("member_id", signupIds),
    ]);
    for (const row of claimedRes.data || []) {
      if (row.member_id) claimedByMember[row.member_id] = (claimedByMember[row.member_id] || 0) + 1;
    }
    for (const row of leadsRes.data || []) {
      if (row.member_id) leadsByMember[row.member_id] = (leadsByMember[row.member_id] || 0) + 1;
    }
  }

  const funnels = codes.map((code) => {
    const recruits = (signups || []).filter((s) => s.invite_code === code.code);
    return {
      code: code.code,
      label: code.label,
      usesLeft: code.uses_left,
      usedCount: code.used_count,
      recruits: recruits.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        joinedAt: r.joined_at,
        isActive: r.is_active,
        hasClaimedLink: (claimedByMember[r.id] || 0) > 0,
        hasLoggedLead: (leadsByMember[r.id] || 0) > 0,
      })),
    };
  });

  return NextResponse.json({ funnels });
}
