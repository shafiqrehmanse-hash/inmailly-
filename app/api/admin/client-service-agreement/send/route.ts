import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { emailLayout, p } from "@/lib/email-templates";
import { clientServiceAgreementEmailHtml } from "@/lib/client-service-agreement-html";
import {
  generateClientServiceAgreementPdf,
  clientServiceAgreementFilename,
} from "@/lib/client-service-agreement-pdf";
import { formatInmailCount, formatUsd, type ClientServiceAgreementForm } from "@/lib/client-service-agreement";
import { verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { form, emailSubject, emailNote } = (await request.json()) as {
    form: ClientServiceAgreementForm;
    emailSubject?: string;
    emailNote?: string;
  };

  if (!form?.contactName?.trim()) {
    return NextResponse.json({ error: "Contact name required" }, { status: 400 });
  }
  if (!form.contactEmail?.trim()) {
    return NextResponse.json({ error: "Contact email required to send" }, { status: 400 });
  }

  const pdf = await generateClientServiceAgreementPdf(form);
  const filename = clientServiceAgreementFilename(form);
  const subject =
    emailSubject?.trim() ||
    `Your InMailly service agreement — ${form.packageName} (${formatInmailCount(form.inmailPackageSize)} InMails)`;

  const priceLine =
    parseFloat(form.packagePriceUsd) === 0 ? "Complimentary trial" : formatUsd(form.packagePriceUsd);

  const html = emailLayout({
    eyebrow: "Service agreement",
    title: `Your ${form.packageName} package agreement`,
    bodyHtml: `${p(`Hi ${form.contactName.split(" ")[0]},`)}
      ${p(`Please find your InMailly service agreement attached for the <strong style="color:#fafafa;">${form.packageName}</strong> package — ${formatInmailCount(form.inmailPackageSize)} InMails at ${priceLine}.`)}
      ${clientServiceAgreementEmailHtml(form, emailNote)}`,
    footerNote: `Ref: ${form.referenceNo}`,
  });

  const text = [
    `Hi ${form.contactName},`,
    "",
    `Attached: ${form.packageName} service agreement — ${formatInmailCount(form.inmailPackageSize)} InMails.`,
    `Investment: ${priceLine}`,
    "",
    emailNote?.trim() || "",
    "",
    form.signerName,
    form.signerTitle,
  ]
    .filter(Boolean)
    .join("\n");

  const result = await sendEmail({
    to: form.contactEmail.trim(),
    subject,
    html,
    text,
    attachments: [{ filename, content: Buffer.from(pdf).toString("base64") }],
  });

  if (!result.ok && !result.skipped) {
    return NextResponse.json({ error: result.error || "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    skipped: result.skipped,
    sentTo: form.contactEmail,
    filename,
  });
}
