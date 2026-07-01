import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { emailLayout, p } from "@/lib/email-templates";
import type { OfferLetterForm } from "@/lib/offer-letter";
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
    .from("employment_contracts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (contracts || []).map((c) => c.id);
  let terminations: Record<string, unknown> = {};
  if (ids.length) {
    const { data: terms } = await admin.from("contract_terminations").select("*").in("contract_id", ids);
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

  const { form } = (await request.json()) as { form: OfferLetterForm };
  if (!form?.candidateName?.trim() || !form.candidateEmail?.trim()) {
    return NextResponse.json({ error: "Candidate name and email required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const email = form.candidateEmail.trim().toLowerCase();

  const { data: member } = await admin
    .from("team_members")
    .select("id, name, email")
    .eq("email", email)
    .maybeSingle();

  await admin
    .from("employment_contracts")
    .delete()
    .eq("candidate_email", email)
    .eq("status", "pending_signature");

  const { data: contract, error } = await admin
    .from("employment_contracts")
    .insert({
      reference_no: form.referenceNo,
      member_id: member?.id || null,
      candidate_name: form.candidateName.trim(),
      candidate_email: email,
      form_data: form,
      status: "pending_signature",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const signUrl = `${getSiteUrl()}/team/contract`;
  const html = emailLayout({
    eyebrow: "Employment offer",
    title: "Review & sign your offer",
    bodyHtml: `${p(`Hi ${form.candidateName.split(" ")[0]},`)}
      ${p(`Your offer for <strong style="color:#fafafa;">${form.roleTitle}</strong> is ready in your InMailly team dashboard. Please log in, read all terms carefully (including non-permanent engagement terms), and sign electronically.`)}
      ${p(`Monthly salary: <strong style="color:#22d3ee;">PKR ${Number(form.monthlySalaryPkr).toLocaleString("en-PK")}</strong>`)}`,
    cta: { href: signUrl, label: "Open dashboard to sign" },
    footerNote: `Contract ref: ${form.referenceNo}. Questions? Reply to this email.`,
  });

  const send = await sendEmail({
    to: email,
    subject: `Action required: Sign your InMailly offer — ${form.roleTitle}`,
    html,
    text: `Your offer is ready. Log in at ${signUrl} to review and sign. Ref: ${form.referenceNo}`,
  });

  return NextResponse.json({
    contract,
    emailSent: send.ok,
    emailSkipped: send.skipped,
    signUrl,
    linkedMember: Boolean(member),
  });
}
