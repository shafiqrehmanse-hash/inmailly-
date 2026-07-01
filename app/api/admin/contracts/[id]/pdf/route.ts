import { NextRequest, NextResponse } from "next/server";
import { generateOfferLetterPdf, offerLetterFilename } from "@/lib/offer-letter-pdf";
import type { OfferLetterForm } from "@/lib/offer-letter";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: contract, error } = await admin
    .from("employment_contracts")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (error || !contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const form = contract.form_data as OfferLetterForm;
  const pdf = await generateOfferLetterPdf(form, {
    signaturePngBase64: contract.signature_png || undefined,
    signedAt: contract.signed_at || undefined,
  });
  const filename = offerLetterFilename(form).replace("Offer-Letter", "Contract");

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
