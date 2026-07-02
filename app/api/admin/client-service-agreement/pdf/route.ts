import { NextRequest, NextResponse } from "next/server";
import {
  generateClientServiceAgreementPdf,
  clientServiceAgreementFilename,
} from "@/lib/client-service-agreement-pdf";
import type { ClientServiceAgreementForm } from "@/lib/client-service-agreement";
import { verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = (await request.json()) as ClientServiceAgreementForm;
  if (!form?.contactName?.trim()) {
    return NextResponse.json({ error: "Contact name required" }, { status: 400 });
  }

  const pdf = await generateClientServiceAgreementPdf(form);
  const filename = clientServiceAgreementFilename(form);

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
