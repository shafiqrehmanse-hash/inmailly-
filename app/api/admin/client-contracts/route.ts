import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { emailLayout, p } from "@/lib/email-templates";
import type { ClientServiceAgreementForm } from "@/lib/client-service-agreement";
import { formatInmailCount, formatUsd } from "@/lib/client-service-agreement";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/site-url";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: contracts, error } = await admin
    .from("client_service_contracts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (contracts || []).map((c) => c.id);
  let terminations: Record<string, unknown> = {};
  if (ids.length) {
    const { data: terms } = await admin
      .from("client_contract_terminations")
      .select("*")
      .in("contract_id", ids);
    terminations = Object.fromEntries((terms || []).map((t) => [t.contract_id, t]));
  }

  return NextResponse.json({
    contracts: (contracts || []).map((c) => ({
      ...c,
      termination: terminations[c.id] || null,
    })),
  });
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { form, clientId, projectId } = (await request.json()) as {
    form: ClientServiceAgreementForm;
    clientId?: string;
    projectId?: string;
  };

  if (!form?.contactName?.trim() || !form.contactEmail?.trim()) {
    return NextResponse.json({ error: "Contact name and email required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const email = form.contactEmail.trim().toLowerCase();

  let linkedClientId = clientId || null;
  if (!linkedClientId) {
    const { data: client } = await admin
      .from("clients")
      .select("id, name, email")
      .eq("email", email)
      .maybeSingle();
    linkedClientId = client?.id || null;
  }

  await admin
    .from("client_service_contracts")
    .delete()
    .eq("contact_email", email)
    .eq("status", "pending_signature");

  const { data: contract, error } = await admin
    .from("client_service_contracts")
    .insert({
      reference_no: form.referenceNo,
      client_id: linkedClientId,
      project_id: projectId || null,
      contact_name: form.contactName.trim(),
      contact_email: email,
      form_data: form,
      status: "pending_signature",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const signUrl = `${getSiteUrl()}/client/contract`;
  const priceLine =
    parseFloat(form.packagePriceUsd) === 0
      ? "Complimentary trial package"
      : formatUsd(form.packagePriceUsd);

  const html = emailLayout({
    eyebrow: "Service agreement",
    title: "Review & sign your InMail package agreement",
    bodyHtml: `${p(`Hi ${form.contactName.split(" ")[0]},`)}
      ${p(`Your <strong style="color:#fafafa;">${form.packageName}</strong> service agreement for <strong style="color:#fafafa;">${formatInmailCount(form.inmailPackageSize)} InMails</strong> is ready in your InMailly client portal. Please log in, read all terms, and sign electronically to activate trust-backed delivery.`)}
      ${p(`Investment: <strong style="color:#22d3ee;">${priceLine}</strong> · Project: ${form.projectName || "Your campaign"}`)}`,
    cta: { href: signUrl, label: "Open client portal to sign" },
    footerNote: `Agreement ref: ${form.referenceNo}. Questions? Reply to this email.`,
  });

  const send = await sendEmail({
    to: email,
    subject: `Action required: Sign your InMailly service agreement — ${form.packageName}`,
    html,
    text: `Your service agreement is ready. Log in at ${signUrl} to review and sign. Ref: ${form.referenceNo}`,
  });

  return NextResponse.json({
    contract,
    emailSent: send.ok,
    emailSkipped: send.skipped,
    signUrl,
    linkedClient: Boolean(linkedClientId),
  });
}
