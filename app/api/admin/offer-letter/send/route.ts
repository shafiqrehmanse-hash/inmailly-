import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { offerLetterEmailHtml } from "@/lib/offer-letter-html";
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

  const { form, emailSubject, emailNote } = (await request.json()) as {
    form: OfferLetterForm;
    emailSubject?: string;
    emailNote?: string;
  };

  if (!form?.candidateName?.trim()) {
    return NextResponse.json({ error: "Candidate name is required" }, { status: 400 });
  }
  if (!form.candidateEmail?.trim()) {
    return NextResponse.json({ error: "Candidate email is required to send" }, { status: 400 });
  }

  const pdf = await generateOfferLetterPdf(form);
  const filename = offerLetterFilename(form);
  const subject =
    emailSubject?.trim() || `Your offer from InMailly — ${form.roleTitle}`;

  const noteBlock = emailNote?.trim()
    ? `<p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:#a1a1aa;">${emailNote.replace(/</g, "&lt;").replace(/\n/g, "<br/>")}</p>`
    : "";

  const html = offerLetterEmailHtml(form).replace(
    "</td></tr>",
    `${noteBlock}</td></tr>`
  );

  const text = [
    `Congratulations ${form.candidateName}!`,
    "",
    `Please find your offer letter attached for the role of ${form.roleTitle} at InMailly.`,
    `Monthly salary: PKR ${form.monthlySalaryPkr}`,
    `Start date: ${form.startDate}`,
    "",
    emailNote?.trim() || "",
    "",
    "Reply to accept or ask questions.",
    "",
    form.signerName,
    form.signerTitle,
  ]
    .filter(Boolean)
    .join("\n");

  const result = await sendEmail({
    to: form.candidateEmail.trim(),
    subject,
    html,
    text,
    replyTo: undefined,
    attachments: [
      {
        filename,
        content: Buffer.from(pdf).toString("base64"),
      },
    ],
  });

  if (!result.ok && !result.skipped) {
    return NextResponse.json({ error: result.error || "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    skipped: result.skipped,
    sentTo: form.candidateEmail,
    filename,
  });
}
