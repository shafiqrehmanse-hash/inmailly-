import { NextRequest, NextResponse } from "next/server";
import { sendEmail, getNotifyEmail } from "@/lib/email";
import { emailLayout, p } from "@/lib/email-templates";
import { buildTerminationNotice } from "@/lib/employment-contract";
import type { OfferLetterForm } from "@/lib/offer-letter";
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

  const { contractId, effectiveDate, totalDaysWorked, pendingAmountPkr, reason, deactivateMember } =
    await request.json();

  if (!contractId || !effectiveDate) {
    return NextResponse.json({ error: "contractId and effectiveDate required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: contract } = await admin
    .from("employment_contracts")
    .select("*")
    .eq("id", contractId)
    .maybeSingle();

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }
  if (contract.status === "terminated") {
    return NextResponse.json({ error: "Contract already terminated" }, { status: 400 });
  }

  const form = contract.form_data as OfferLetterForm;
  const days =
    typeof totalDaysWorked === "number"
      ? totalDaysWorked
      : parseInt(String(totalDaysWorked), 10) || 0;
  const pending = parseFloat(String(pendingAmountPkr)) || 0;

  const noticeBody = buildTerminationNotice({
    candidateName: contract.candidate_name,
    roleTitle: form.roleTitle,
    referenceNo: contract.reference_no,
    effectiveDate,
    totalDaysWorked: days,
    pendingAmountPkr: pending,
    reason: reason || undefined,
    companyName: form.companyName,
    signerName: form.signerName,
  });

  const { data: termination, error: termErr } = await admin
    .from("contract_terminations")
    .insert({
      contract_id: contractId,
      member_id: contract.member_id,
      effective_date: effectiveDate,
      total_days_worked: days,
      pending_amount_pkr: pending,
      reason: reason?.trim() || null,
      notice_body: noticeBody,
    })
    .select()
    .single();

  if (termErr) return NextResponse.json({ error: termErr.message }, { status: 500 });

  await admin
    .from("employment_contracts")
    .update({ status: "terminated", updated_at: new Date().toISOString() })
    .eq("id", contractId);

  if (deactivateMember !== false && contract.member_id) {
    await admin.from("team_members").update({ is_active: false }).eq("id", contract.member_id);
  }

  const pdf = await generateTerminationNoticePdf(noticeBody, contract.reference_no);
  const filename = terminationNoticeFilename(contract.candidate_name);

  const html = emailLayout({
    eyebrow: "Contract ended",
    title: "Termination notice",
    bodyHtml: `${p(`Dear ${contract.candidate_name},`)}
      ${p("Please find your official termination notice attached. Your working arrangement with InMailly has ended as of the effective date stated in the document.")}
      ${p(`<strong style="color:#fafafa;">Total days worked:</strong> ${days}<br/>
      <strong style="color:#fafafa;">Pending approved payment:</strong> PKR ${pending.toLocaleString("en-PK")}`)}`,
    footerNote: `Contract ref: ${contract.reference_no}. Reply if you have questions about final payment.`,
  });

  const emailResult = await sendEmail({
    to: contract.candidate_email,
    subject: `Contract termination notice — InMailly (${contract.reference_no})`,
    html,
    text: noticeBody,
    attachments: [{ filename, content: Buffer.from(pdf).toString("base64") }],
  });

  await sendEmail({
    to: getNotifyEmail(),
    subject: `Contract terminated: ${contract.candidate_name}`,
    html: p(`Termination sent for ${contract.candidate_name}. ${days} days worked. Pending PKR ${pending.toLocaleString("en-PK")}.`),
    text: noticeBody,
  });

  return NextResponse.json({
    termination,
    emailSent: emailResult.ok,
    emailSkipped: emailResult.skipped,
  });
}
