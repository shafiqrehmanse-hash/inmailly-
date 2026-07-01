import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/team";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTerminationNoticePdf, terminationNoticeFilename } from "@/lib/termination-notice-pdf";

export async function GET() {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: contract } = await admin
    .from("employment_contracts")
    .select("id, reference_no, candidate_name, status")
    .or(`member_id.eq.${member.id},candidate_email.eq.${member.email.toLowerCase()}`)
    .eq("status", "terminated")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!contract) {
    return NextResponse.json({ error: "No termination notice found" }, { status: 404 });
  }

  const { data: term } = await admin
    .from("contract_terminations")
    .select("notice_body")
    .eq("contract_id", contract.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!term?.notice_body) {
    return NextResponse.json({ error: "Termination notice not found" }, { status: 404 });
  }

  const pdf = await generateTerminationNoticePdf(term.notice_body, contract.reference_no);
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${terminationNoticeFilename(contract.candidate_name)}"`,
    },
  });
}
