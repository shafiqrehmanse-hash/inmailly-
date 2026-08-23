import { NextRequest, NextResponse } from "next/server";
import { memberSalesNavActivationEmail } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";
import type { SalesNavLicenseRequest } from "@/lib/types";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const status = request.nextUrl.searchParams.get("status");

  let query = admin
    .from("sales_nav_license_requests")
    .select("*")
    .order("requested_at", { ascending: false })
    .limit(200);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ requests: (data || []) as SalesNavLicenseRequest[] });
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId, activationKey } = await request.json();
  const key = typeof activationKey === "string" ? activationKey.trim() : "";

  if (!requestId) {
    return NextResponse.json({ error: "requestId required" }, { status: 400 });
  }
  if (!key || key.length < 8) {
    return NextResponse.json({ error: "Paste the full activation key or link (at least 8 characters)" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("sales_nav_license_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  if (row.status !== "pending" && row.status !== "error") {
    return NextResponse.json(
      { error: "Can only send activation for pending or error requests" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await admin
    .from("sales_nav_license_requests")
    .update({
      status: "activation_sent",
      activation_key: key,
      activation_sent_at: now,
      member_error_note: null,
      resolved_at: null,
      updated_at: now,
    })
    .eq("id", requestId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const send = await sendEmail({
    to: row.member_email,
    subject: "Your Sales Navigator license — activate now",
    html: memberSalesNavActivationEmail({
      memberName: row.member_name,
      activationKey: key,
    }),
    text: `Hi ${row.member_name}, your Sales Navigator license is ready. Activation details:\n\n${key}\n\nOpen on Chrome desktop/laptop, then mark activated in InMailly: /team/sales-nav`,
  });

  if (!send.ok && !send.skipped) {
    return NextResponse.json({ error: send.error || "Failed to email member" }, { status: 500 });
  }

  return NextResponse.json({
    request: updated as SalesNavLicenseRequest,
    emailed: send.ok,
    skipped: send.skipped,
  });
}
