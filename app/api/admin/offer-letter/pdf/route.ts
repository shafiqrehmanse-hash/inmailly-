import { NextRequest, NextResponse } from "next/server";
import { generateOfferLetterPdf, offerLetterFilename } from "@/lib/offer-letter-pdf";
import { type OfferLetterForm } from "@/lib/offer-letter";
import { verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = (await request.json()) as OfferLetterForm;
  if (!form.candidateName?.trim()) {
    return NextResponse.json({ error: "Candidate name is required" }, { status: 400 });
  }

  const pdf = await generateOfferLetterPdf(form);
  const filename = offerLetterFilename(form);

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
