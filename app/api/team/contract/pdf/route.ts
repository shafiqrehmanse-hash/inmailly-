import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/team";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOfferLetterPdf, offerLetterFilename } from "@/lib/offer-letter-pdf";
import type { OfferLetterForm } from "@/lib/offer-letter";

export async function GET() {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const email = member.email.toLowerCase();

  const { data: contract } = await admin
    .from("employment_contracts")
    .select("*")
    .or(`member_id.eq.${member.id},candidate_email.eq.${email}`)
    .in("status", ["signed", "terminated"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!contract || contract.status !== "signed") {
    return NextResponse.json({ error: "No signed contract to download" }, { status: 404 });
  }

  const form = contract.form_data as OfferLetterForm;
  const pdf = await generateOfferLetterPdf(form, {
    signaturePngBase64: contract.signature_png || undefined,
    signedAt: contract.signed_at || undefined,
  });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${offerLetterFilename(form)}"`,
    },
  });
}
