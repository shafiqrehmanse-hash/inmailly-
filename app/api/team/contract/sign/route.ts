import { NextRequest, NextResponse } from "next/server";
import { sendEmail, getNotifyEmail } from "@/lib/email";
import { emailLayout, p } from "@/lib/email-templates";
import type { OfferLetterForm } from "@/lib/offer-letter";
import { getCurrentMember } from "@/lib/team";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contractId, signaturePng, agreed } = await request.json();
  if (!contractId || !signaturePng) {
    return NextResponse.json({ error: "contractId and signature required" }, { status: 400 });
  }
  if (!agreed) {
    return NextResponse.json({ error: "You must agree to all terms before signing" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: contract } = await admin
    .from("employment_contracts")
    .select("*")
    .eq("id", contractId)
    .eq("status", "pending_signature")
    .maybeSingle();

  if (!contract) {
    return NextResponse.json({ error: "Offer not found or already signed" }, { status: 404 });
  }

  const email = member.email.toLowerCase();
  if (
    contract.member_id &&
    contract.member_id !== member.id &&
    contract.candidate_email.toLowerCase() !== email
  ) {
    return NextResponse.json({ error: "This offer is not for your account" }, { status: 403 });
  }
  if (!contract.member_id && contract.candidate_email.toLowerCase() !== email) {
    return NextResponse.json({ error: "This offer is not for your account" }, { status: 403 });
  }

  const signedAt = new Date().toISOString();
  const { data: updated, error } = await admin
    .from("employment_contracts")
    .update({
      status: "signed",
      signature_png: signaturePng,
      signed_at: signedAt,
      member_id: member.id,
      updated_at: signedAt,
    })
    .eq("id", contractId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const form = contract.form_data as OfferLetterForm;
  await sendEmail({
    to: getNotifyEmail(),
    subject: `Contract signed: ${contract.candidate_name}`,
    html: emailLayout({
      eyebrow: "Contract signed",
      title: `${contract.candidate_name} signed their offer`,
      bodyHtml: p(
        `Role: ${form.roleTitle}<br/>Ref: ${contract.reference_no}<br/>Signed at: ${new Date(signedAt).toLocaleString()}`
      ),
    }),
    text: `${contract.candidate_name} signed contract ${contract.reference_no}`,
  });

  return NextResponse.json({ contract: updated, signedAt });
}
