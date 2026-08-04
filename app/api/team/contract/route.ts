import { NextResponse } from "next/server";
import { getPendingContractForMember } from "@/lib/team-pending-actions";
import { getCurrentMember } from "@/lib/team";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const email = member.email.trim().toLowerCase();
  const memberFilter = `member_id.eq.${member.id},candidate_email.eq.${email}`;

  const [pendingOffer, { data: latestRows }] = await Promise.all([
    getPendingContractForMember(member),
    admin
      .from("employment_contracts")
      .select("*")
      .or(memberFilter)
      .in("status", ["signed", "terminated"])
      .order("created_at", { ascending: false })
      .limit(1),
  ]);
  const latest = latestRows?.[0] ?? null;

  let termination = null;
  if (latest?.status === "terminated") {
    const { data: term } = await admin
      .from("contract_terminations")
      .select("*")
      .eq("contract_id", latest.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    termination = term;
  }

  return NextResponse.json({
    pendingOffer,
    contract: latest,
    termination,
    member: { id: member.id, name: member.name, email: member.email },
  });
}
