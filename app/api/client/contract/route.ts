import { NextResponse } from "next/server";
import { getCurrentClient } from "@/lib/client-auth-server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const email = (client.email || "").toLowerCase();
  const clientFilter = email
    ? `client_id.eq.${client.id},contact_email.eq.${email}`
    : `client_id.eq.${client.id}`;

  const [{ data: pendingOffer }, { data: latest }] = await Promise.all([
    admin
      .from("client_service_contracts")
      .select("*")
      .or(clientFilter)
      .eq("status", "pending_signature")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("client_service_contracts")
      .select("*")
      .or(clientFilter)
      .in("status", ["signed", "terminated"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  let termination = null;
  if (latest?.status === "terminated") {
    const { data: term } = await admin
      .from("client_contract_terminations")
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
    client: { id: client.id, name: client.name, email: client.email },
  });
}
