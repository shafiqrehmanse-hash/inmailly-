import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { emailLayout, p } from "@/lib/email-templates";
import { defaultInfoDocForm, newInfoDocReferenceNo } from "@/lib/info-doc";
import { getInfoDocDashboardPath } from "@/lib/roles";
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
  const { data, error } = await admin
    .from("employee_info_docs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ docs: data || [] });
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const employeeEmail = String(body.employeeEmail || "").trim().toLowerCase();
  const employeeName = String(body.employeeName || "").trim();
  const adminNote = String(body.adminNote || "").trim() || null;

  if (!employeeEmail || !employeeName) {
    return NextResponse.json({ error: "Employee name and email required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("team_members")
    .select("id, name, email, role")
    .eq("email", employeeEmail)
    .maybeSingle();

  await admin
    .from("employee_info_docs")
    .delete()
    .eq("employee_email", employeeEmail)
    .eq("status", "pending_fill");

  const referenceNo = newInfoDocReferenceNo();
  const { data: doc, error } = await admin
    .from("employee_info_docs")
    .insert({
      reference_no: referenceNo,
      member_id: member?.id || null,
      employee_name: employeeName,
      employee_email: employeeEmail,
      admin_note: adminNote,
      form_data: defaultInfoDocForm(),
      status: "pending_fill",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const fillPath = member ? getInfoDocDashboardPath(member.role) : "/team/info-doc";
  const fillUrl = `${getSiteUrl()}${fillPath}`;
  const html = emailLayout({
    eyebrow: "Employee information",
    title: "Complete your Info Doc",
    bodyHtml: `${p(`Hi ${employeeName.split(" ")[0]},`)}
      ${p(`Please log in to your InMailly dashboard and complete your <strong style="color:#fafafa;">Employee Info Doc</strong>. We need your ID details, emergency contact, references, and employment background.`)}
      ${adminNote ? p(`<strong style="color:#22d3ee;">Note from admin:</strong> ${adminNote}`) : ""}
      ${p(`This includes uploading your government ID (front & back). Your last 30 days of outreach stats will be attached automatically.`)}`,
    cta: { href: fillUrl, label: "Open dashboard to fill Info Doc" },
    footerNote: `Reference: ${referenceNo}. Questions? Reply to this email.`,
  });

  const send = await sendEmail({
    to: employeeEmail,
    subject: `Action required: Complete your InMailly Info Doc`,
    html,
    text: `Please complete your employee Info Doc at ${fillUrl}. Ref: ${referenceNo}`,
  });

  return NextResponse.json({
    doc,
    emailSent: send.ok,
    emailSkipped: "skipped" in send && send.skipped,
    fillUrl,
    linkedMember: Boolean(member),
  });
}
