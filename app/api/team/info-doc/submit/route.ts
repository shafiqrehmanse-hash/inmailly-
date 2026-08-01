import { NextRequest, NextResponse } from "next/server";
import { validateInfoDocForm, type InfoDocForm } from "@/lib/info-doc";
import { getMemberInfoDocStats } from "@/lib/info-doc-stats";
import { sendEmail, getNotifyEmail } from "@/lib/email";
import { emailLayout, p } from "@/lib/email-templates";
import { getSiteUrl } from "@/lib/site-url";
import { getCurrentMember } from "@/lib/team";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const docId = String(body.docId || "").trim();
  const form = body.form as Partial<InfoDocForm>;

  if (!docId) return NextResponse.json({ error: "docId required" }, { status: 400 });

  const validationError = validateInfoDocForm(form);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const admin = createAdminClient();
  const email = member.email.toLowerCase();

  const { data: doc } = await admin
    .from("employee_info_docs")
    .select("*")
    .eq("id", docId)
    .eq("status", "pending_fill")
    .or(`member_id.eq.${member.id},employee_email.eq.${email}`)
    .maybeSingle();

  if (!doc) {
    return NextResponse.json({ error: "Info Doc not found or already submitted" }, { status: 404 });
  }

  const stats = await getMemberInfoDocStats(member.id);
  const now = new Date().toISOString();

  const { data: updated, error } = await admin
    .from("employee_info_docs")
    .update({
      member_id: member.id,
      form_data: form,
      stats_snapshot: stats,
      status: "submitted",
      submitted_at: now,
      updated_at: now,
    })
    .eq("id", docId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const html = emailLayout({
    eyebrow: "Employee Info Doc",
    title: `${member.name} submitted their Info Doc`,
    bodyHtml: [
      p(`<strong style="color:#fafafa;">${member.name}</strong> completed their employee information form.`),
      p(`Reference: <strong style="color:#22d3ee;">${doc.reference_no}</strong>`),
      p(
        `Last 30 days: <strong style="color:#fafafa;">${stats.usedLinks30d}</strong> links used · <strong style="color:#fafafa;">${stats.closedDeals30d}</strong> deals closed`
      ),
      p(`Review ID photos and details in Admin → Info Docs.`),
    ].join(""),
    cta: { href: `${getSiteUrl()}/admin/team/info-doc`, label: "Review in admin" },
    footerNote: "Government ID images are stored securely.",
  });

  void sendEmail({
    to: getNotifyEmail(),
    subject: `Info Doc submitted: ${member.name}`,
    html,
    text: `${member.name} submitted Info Doc ${doc.reference_no}. Used links 30d: ${stats.usedLinks30d}, deals: ${stats.closedDeals30d}`,
  });

  return NextResponse.json({ doc: updated, stats });
}
