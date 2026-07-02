import { NextRequest, NextResponse } from "next/server";
import { sendEmail, getNotifyEmail } from "@/lib/email";
import { emailLayout, p } from "@/lib/email-templates";
import type { ClientServiceAgreementForm } from "@/lib/client-service-agreement";
import { getCurrentClient } from "@/lib/client-auth-server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contractId, signaturePng, agreed } = await request.json();
  if (!contractId || !signaturePng) {
    return NextResponse.json({ error: "contractId and signature required" }, { status: 400 });
  }
  if (!agreed) {
    return NextResponse.json({ error: "You must agree to all terms before signing" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: contract } = await admin
    .from("client_service_contracts")
    .select("*")
    .eq("id", contractId)
    .eq("status", "pending_signature")
    .maybeSingle();

  if (!contract) {
    return NextResponse.json({ error: "Agreement not found or already signed" }, { status: 404 });
  }

  const email = (client.email || "").toLowerCase();
  if (
    contract.client_id &&
    contract.client_id !== client.id &&
    contract.contact_email.toLowerCase() !== email
  ) {
    return NextResponse.json({ error: "This agreement is not for your account" }, { status: 403 });
  }
  if (!contract.client_id && contract.contact_email.toLowerCase() !== email) {
    return NextResponse.json({ error: "This agreement is not for your account" }, { status: 403 });
  }

  const signedAt = new Date().toISOString();
  const { data: updated, error } = await admin
    .from("client_service_contracts")
    .update({
      status: "signed",
      signature_png: signaturePng,
      signed_at: signedAt,
      client_id: client.id,
      updated_at: signedAt,
    })
    .eq("id", contractId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const form = contract.form_data as ClientServiceAgreementForm;
  await sendEmail({
    to: getNotifyEmail(),
    subject: `Client agreement signed: ${form.clientCompany || contract.contact_name}`,
    html: emailLayout({
      eyebrow: "Client agreement signed",
      title: `${contract.contact_name} signed their service agreement`,
      bodyHtml: p(
        `Package: ${form.packageName} · ${form.inmailPackageSize} InMails<br/>Ref: ${contract.reference_no}<br/>Signed at: ${new Date(signedAt).toLocaleString()}`
      ),
    }),
    text: `${contract.contact_name} signed agreement ${contract.reference_no}`,
  });

  return NextResponse.json({ contract: updated, signedAt });
}
