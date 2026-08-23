import { NextRequest, NextResponse } from "next/server";
import {
  adminSalesNavActivatedEmail,
  adminSalesNavErrorEmail,
  adminSalesNavRequestEmail,
} from "@/lib/email-templates";
import { sendEmail, getNotifyEmail } from "@/lib/email";
import { getCurrentMember } from "@/lib/team";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SalesNavLicenseRequest } from "@/lib/types";

function normalizeEmail(v: unknown) {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

export async function GET() {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("sales_nav_license_requests")
    .select("*")
    .eq("member_id", member.id)
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ request: (data as SalesNavLicenseRequest | null) ?? null });
}

export async function POST(request: NextRequest) {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const linkedinEmail = normalizeEmail((await request.json()).linkedinEmail);
  if (!linkedinEmail || !linkedinEmail.includes("@")) {
    return NextResponse.json({ error: "Enter the email registered on your LinkedIn account" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: open } = await admin
    .from("sales_nav_license_requests")
    .select("id, status")
    .eq("member_id", member.id)
    .in("status", ["pending", "activation_sent"])
    .maybeSingle();

  if (open) {
    return NextResponse.json(
      { error: "You already have an open Sales Navigator request. Check status below or wait for admin." },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const { data: row, error } = await admin
    .from("sales_nav_license_requests")
    .insert({
      member_id: member.id,
      member_name: member.name,
      member_email: member.email.toLowerCase(),
      linkedin_email: linkedinEmail,
      status: "pending",
      requested_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void sendEmail({
    to: getNotifyEmail(),
    subject: `Sales Navigator request: ${member.name}`,
    html: adminSalesNavRequestEmail({
      memberName: member.name,
      memberEmail: member.email,
      linkedinEmail,
    }),
    text: `${member.name} (${member.email}) requested Sales Navigator for LinkedIn email ${linkedinEmail}`,
  });

  return NextResponse.json({ request: row as SalesNavLicenseRequest });
}

export async function PATCH(request: NextRequest) {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const action = body.action as "activated" | "error";
  const errorNote = typeof body.errorNote === "string" ? body.errorNote.trim().slice(0, 2000) : "";

  if (action !== "activated" && action !== "error") {
    return NextResponse.json({ error: "action must be activated or error" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("sales_nav_license_requests")
    .select("*")
    .eq("member_id", member.id)
    .eq("status", "activation_sent")
    .order("activation_sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "No activation waiting for confirmation" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await admin
    .from("sales_nav_license_requests")
    .update({
      status: action === "activated" ? "activated" : "error",
      member_error_note: action === "error" ? errorNote || null : null,
      resolved_at: now,
      updated_at: now,
    })
    .eq("id", existing.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const payload = {
    memberName: existing.member_name,
    memberEmail: existing.member_email,
    linkedinEmail: existing.linkedin_email,
    errorNote: errorNote || null,
  };

  if (action === "activated") {
    void sendEmail({
      to: getNotifyEmail(),
      subject: `Sales Navigator activated: ${existing.member_name}`,
      html: adminSalesNavActivatedEmail(payload),
      text: `${existing.member_name} activated Sales Navigator.`,
    });
  } else {
    void sendEmail({
      to: getNotifyEmail(),
      subject: `Sales Navigator error: ${existing.member_name}`,
      html: adminSalesNavErrorEmail(payload),
      text: `${existing.member_name} reported Sales Navigator activation error.${errorNote ? ` Note: ${errorNote}` : ""}`,
    });
  }

  return NextResponse.json({ request: updated as SalesNavLicenseRequest });
}
