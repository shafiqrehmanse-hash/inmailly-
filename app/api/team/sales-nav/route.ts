import { NextRequest, NextResponse } from "next/server";
import {
  notifyAdminSalesNavActivated,
  notifyAdminSalesNavError,
  notifyAdminSalesNavRequest,
} from "@/lib/email";
import { getCurrentMember } from "@/lib/team";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SalesNavLicenseRequest, SalesNavRerequestKind } from "@/lib/types";

const SCREENSHOT_BUCKET = "sales-nav-screenshots";
const SCREENSHOT_MAX_BYTES = 8 * 1024 * 1024;

function normalizeEmail(v: unknown) {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

async function parseRequestBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const screenshot = form.get("screenshot");
    return {
      linkedinEmail: normalizeEmail(form.get("linkedinEmail")),
      rerequestKind: String(form.get("rerequestKind") || "").trim() as SalesNavRerequestKind | "",
      reason: String(form.get("reason") || "").trim().slice(0, 2000),
      screenshot: screenshot instanceof File && screenshot.size > 0 ? screenshot : null,
    };
  }
  const json = await request.json();
  return {
    linkedinEmail: normalizeEmail(json.linkedinEmail),
    rerequestKind: (typeof json.rerequestKind === "string" ? json.rerequestKind.trim() : "") as
      | SalesNavRerequestKind
      | "",
    reason: typeof json.reason === "string" ? json.reason.trim().slice(0, 2000) : "",
    screenshot: null as File | null,
  };
}

async function uploadScreenshot(admin: ReturnType<typeof createAdminClient>, memberId: string, file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Screenshot must be a PNG, JPG, or WebP image");
  }
  if (file.size > SCREENSHOT_MAX_BYTES) {
    throw new Error("Screenshot must be under 8MB");
  }
  await admin.storage
    .createBucket(SCREENSHOT_BUCKET, {
      public: true,
      fileSizeLimit: SCREENSHOT_MAX_BYTES,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    })
    .catch(() => null);

  const ext = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg";
  const path = `${memberId}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from(SCREENSHOT_BUCKET).upload(path, buffer, {
    contentType: file.type || "image/jpeg",
    upsert: true,
  });
  if (error) throw new Error(error.message);
  const { data: pub } = admin.storage.from(SCREENSHOT_BUCKET).getPublicUrl(path);
  return pub.publicUrl;
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

  const { linkedinEmail, rerequestKind, reason, screenshot } = await parseRequestBody(request);
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

  const { data: latest } = await admin
    .from("sales_nav_license_requests")
    .select("id, status")
    .eq("member_id", member.id)
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isRerequest = Boolean(latest && (latest.status === "activated" || latest.status === "error"));
  let screenshotUrl: string | null = null;
  let kind: SalesNavRerequestKind | null = null;

  if (isRerequest) {
    if (rerequestKind !== "credits_completed" && rerequestKind !== "error") {
      return NextResponse.json(
        { error: "Select why you need Sales Navigator again: credits completed, or an error." },
        { status: 400 }
      );
    }
    kind = rerequestKind;
    if (!reason || reason.length < 8) {
      return NextResponse.json({ error: "Describe the reason (at least a short sentence)." }, { status: 400 });
    }
    if (kind === "error") {
      if (!screenshot) {
        return NextResponse.json({ error: "Upload a screenshot of the error." }, { status: 400 });
      }
      try {
        screenshotUrl = await uploadScreenshot(admin, member.id, screenshot);
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Could not upload screenshot" },
          { status: 400 }
        );
      }
    }
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
      rerequest_kind: kind,
      rerequest_reason: isRerequest ? reason : null,
      screenshot_url: screenshotUrl,
    })
    .select("*")
    .single();

  if (error) {
    const hint =
      error.message.includes("rerequest") || error.message.includes("screenshot")
        ? " Run migration 035_sales_nav_rerequest.sql in Supabase first."
        : "";
    return NextResponse.json({ error: error.message + hint }, { status: 500 });
  }

  const adminNotify = await notifyAdminSalesNavRequest({
    memberName: member.name,
    memberEmail: member.email,
    linkedinEmail,
    rerequestKind: kind,
    reason: isRerequest ? reason : null,
    screenshotUrl,
  });

  if (!adminNotify.ok && !adminNotify.skipped) {
    console.error("[sales-nav] admin notify failed:", adminNotify.error);
  }

  return NextResponse.json({
    request: row as SalesNavLicenseRequest,
    adminNotified: adminNotify.ok,
  });
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
    void notifyAdminSalesNavActivated(payload);
  } else {
    void notifyAdminSalesNavError(payload);
  }

  return NextResponse.json({ request: updated as SalesNavLicenseRequest });
}
