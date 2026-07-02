import { NextRequest, NextResponse } from "next/server";
import { sendEmail, getNotifyEmail } from "@/lib/email";
import { emailLayout, p } from "@/lib/email-templates";
import { buildClientServiceEndNotice } from "@/lib/client-contract";
import type { ClientServiceAgreementForm } from "@/lib/client-service-agreement";
import { formatUsd } from "@/lib/client-service-agreement";
import { generateTerminationNoticePdf, terminationNoticeFilename } from "@/lib/termination-notice-pdf";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    contractId,
    effectiveDate,
    inmailsDelivered,
    inmailsRemaining,
    refundAmountUsd,
    reason,
    pauseProject,
  } = await request.json();

  if (!contractId || !effectiveDate) {
    return NextResponse.json({ error: "contractId and effectiveDate required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: contract } = await admin
    .from("client_service_contracts")
    .select("*")
    .eq("id", contractId)
    .maybeSingle();

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }
  if (contract.status === "terminated") {
    return NextResponse.json({ error: "Contract already ended" }, { status: 400 });
  }

  const form = contract.form_data as ClientServiceAgreementForm;
  const delivered = parseInt(String(inmailsDelivered), 10) || 0;
  const remaining = parseInt(String(inmailsRemaining), 10) || 0;
  const refund = parseFloat(String(refundAmountUsd)) || 0;

  const noticeBody = buildClientServiceEndNotice({
    contactName: contract.contact_name,
    clientCompany: form.clientCompany,
    projectName: form.projectName,
    packageName: form.packageName,
    inmailPackageSize: form.inmailPackageSize,
    referenceNo: contract.reference_no,
    effectiveDate,
    inmailsDelivered: delivered,
    inmailsRemaining: remaining,
    refundAmountUsd: refund,
    reason: reason || undefined,
    providerName: form.providerName,
    signerName: form.signerName,
  });

  const { data: termination, error: termErr } = await admin
    .from("client_contract_terminations")
    .insert({
      contract_id: contractId,
      client_id: contract.client_id,
      effective_date: effectiveDate,
      inmails_delivered: delivered,
      inmails_remaining: remaining,
      refund_amount_usd: refund,
      reason: reason?.trim() || null,
      notice_body: noticeBody,
    })
    .select()
    .single();

  if (termErr) return NextResponse.json({ error: termErr.message }, { status: 500 });

  await admin
    .from("client_service_contracts")
    .update({ status: "terminated", updated_at: new Date().toISOString() })
    .eq("id", contractId);

  if (pauseProject !== false && contract.project_id) {
    await admin.from("projects").update({ status: "paused" }).eq("id", contract.project_id);
  }

  const pdf = await generateTerminationNoticePdf(noticeBody, contract.reference_no);
  const filename = terminationNoticeFilename(contract.contact_name).replace("Termination", "Service-End");

  const html = emailLayout({
    eyebrow: "Service ended",
    title: "Service end notice",
    bodyHtml: `${p(`Dear ${contract.contact_name},`)}
      ${p("Please find your official service end notice attached. Your InMail outreach agreement has ended as of the effective date in the document.")}
      ${p(`<strong style="color:#fafafa;">InMails delivered:</strong> ${delivered.toLocaleString("en-US")}<br/>
      <strong style="color:#fafafa;">Remaining quota:</strong> ${remaining.toLocaleString("en-US")}<br/>
      <strong style="color:#fafafa;">Refund (if applicable):</strong> ${formatUsd(refund)}`)}`,
    footerNote: `Agreement ref: ${contract.reference_no}. Reply if you have questions.`,
  });

  const emailResult = await sendEmail({
    to: contract.contact_email,
    subject: `Service end notice — InMailly (${contract.reference_no})`,
    html,
    text: noticeBody,
    attachments: [{ filename, content: Buffer.from(pdf).toString("base64") }],
  });

  await sendEmail({
    to: getNotifyEmail(),
    subject: `Client service ended: ${form.clientCompany || contract.contact_name}`,
    html: p(
      `Service end sent for ${contract.contact_name}. Delivered: ${delivered}. Remaining: ${remaining}. Refund: ${formatUsd(refund)}.`
    ),
    text: noticeBody,
  });

  return NextResponse.json({
    termination,
    emailSent: emailResult.ok,
    emailSkipped: emailResult.skipped,
  });
}
