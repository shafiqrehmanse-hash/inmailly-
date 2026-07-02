import { NextResponse } from "next/server";
import { getCurrentClient } from "@/lib/client-auth-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTerminationNoticePdf } from "@/lib/termination-notice-pdf";

export async function GET() {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const email = (client.email || "").toLowerCase();
  const filter = email
    ? `client_id.eq.${client.id},contact_email.eq.${email}`
    : `client_id.eq.${client.id}`;

  const { data: contract } = await admin
    .from("client_service_contracts")
    .select("*")
    .or(filter)
    .eq("status", "terminated")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!contract) {
    return NextResponse.json({ error: "No service end notice found" }, { status: 404 });
  }

  const { data: termination } = await admin
    .from("client_contract_terminations")
    .select("*")
    .eq("contract_id", contract.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!termination) {
    return NextResponse.json({ error: "Notice not found" }, { status: 404 });
  }

  const pdf = await generateTerminationNoticePdf(termination.notice_body, contract.reference_no);

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="InMailly-Service-End-${contract.reference_no}.pdf"`,
    },
  });
}
