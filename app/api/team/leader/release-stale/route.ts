import { NextRequest, NextResponse } from "next/server";
import { isLeaderAssignableWorker } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLeaderResponse, requireTeamLeader } from "@/lib/team-leader-auth";

const STALE_MS = 48 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const leader = await requireTeamLeader();
  if (isLeaderResponse(leader)) return leader;

  const { memberId } = await request.json();
  if (!memberId) {
    return NextResponse.json({ error: "memberId required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("team_members")
    .select("id, name, role, is_active, leader_id")
    .eq("id", memberId)
    .maybeSingle();

  if (
    !target?.is_active ||
    !isLeaderAssignableWorker(target.role) ||
    target.leader_id !== leader.id
  ) {
    return NextResponse.json({ error: "Member is not on your assigned team" }, { status: 400 });
  }

  const staleCutoff = new Date(Date.now() - STALE_MS).toISOString();
  const { data: staleLinks, error: fetchErr } = await admin
    .from("outreach_links")
    .select("id")
    .eq("member_id", memberId)
    .eq("status", "claimed")
    .lt("claimed_at", staleCutoff);

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!staleLinks?.length) {
    return NextResponse.json({ error: "No stale links (48h+) to release for this member" }, { status: 400 });
  }

  const ids = staleLinks.map((l) => l.id);
  const { error: updateErr } = await admin
    .from("outreach_links")
    .update({
      status: "available",
      member_id: null,
      claimed_at: null,
      updated_at: new Date().toISOString(),
    })
    .in("id", ids);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  await admin.from("link_release_events").insert({
    released_by_member_id: leader.id,
    target_member_id: memberId,
    link_count: ids.length,
  });

  return NextResponse.json({
    released: ids.length,
    memberName: target.name,
  });
}
