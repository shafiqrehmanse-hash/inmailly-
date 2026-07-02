import { NextResponse } from "next/server";
import { getCurrentClient } from "@/lib/client-auth-server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateClientServiceAgreementPdf,
  clientServiceAgreementFilename,
} from "@/lib/client-service-agreement-pdf";
import type { ClientServiceAgreementForm } from "@/lib/client-service-agreement";

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
    .in("status", ["signed", "terminated"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!contract || contract.status !== "signed") {
    return NextResponse.json({ error: "No signed agreement to download" }, { status: 404 });
  }

  const form = contract.form_data as ClientServiceAgreementForm;
  const pdf = await generateClientServiceAgreementPdf(form, {
    signaturePngBase64: contract.signature_png || undefined,
    signedAt: contract.signed_at || undefined,
  });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${clientServiceAgreementFilename(form)}"`,
    },
  });
}
