import { NextRequest, NextResponse } from "next/server";
import {
  generateClientServiceAgreementPdf,
  clientServiceAgreementFilename,
} from "@/lib/client-service-agreement-pdf";
import type { ClientServiceAgreementForm } from "@/lib/client-service-agreement";
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
    .from("client_service_contracts")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (error || !contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
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
