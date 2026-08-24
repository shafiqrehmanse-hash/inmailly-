import { NextRequest, NextResponse } from "next/server";
import { formatResendDomainError } from "@/lib/resend-health";
import { sendClientVerificationEmail } from "@/lib/email";
import { handlePostEmailVerification } from "@/lib/post-verification";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";
import { generateVerificationLink } from "@/lib/verification-email";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

function emailSendError(result: { ok: false; skipped?: boolean; error?: string }) {
  if (result.skipped) {
    return "Email not configured — add RESEND_API_KEY and EMAIL_FROM in Vercel, then redeploy.";
  }
  return formatResendDomainError(result.error || "Could not send email");
}

/** Resend verification email or manually confirm a stuck client (paid signup). */
export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const clientId = typeof body.client_id === "string" ? body.client_id : "";
  const action = body.action as "resend" | "confirm";

  if (!clientId) {
    return NextResponse.json({ error: "client_id is required" }, { status: 400 });
  }
  if (action !== "resend" && action !== "confirm") {
    return NextResponse.json({ error: "action must be resend or confirm" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: client } = await admin
    .from("clients")
    .select("id, name, email, user_id")
    .eq("id", clientId)
    .maybeSingle();

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const email = client.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Client has no email on file — edit client first." }, { status: 400 });
  }

  if (!client.user_id) {
    return NextResponse.json(
      { error: "Client has no login account yet — they must complete registration first." },
      { status: 400 }
    );
  }

  const { data: userData } = await admin.auth.admin.getUserById(client.user_id);
  const authUser = userData.user;
  if (!authUser) {
    return NextResponse.json({ error: "Auth user not found for this client." }, { status: 404 });
  }

  if (action === "confirm") {
    if (authUser.email_confirmed_at) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        message: "Email was already verified — client can log in at /client/login",
      });
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(client.user_id, {
      email_confirm: true,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    try {
      await handlePostEmailVerification({
        id: client.user_id,
        email,
        user_metadata: authUser.user_metadata || {},
      });
    } catch (e) {
      console.error("[admin verify-email] post-verification notify failed:", e);
    }

    return NextResponse.json({
      success: true,
      confirmed: true,
      email,
      message: "Email marked verified — client can log in now at /client/login",
    });
  }

  if (authUser.email_confirmed_at) {
    return NextResponse.json({ error: "Email is already verified. Client can log in." }, { status: 400 });
  }

  const link = await generateVerificationLink(admin, email, "/client/dashboard");
  if ("error" in link) {
    return NextResponse.json({ error: link.error }, { status: 400 });
  }

  const send = await sendClientVerificationEmail({
    name: client.name,
    email,
    verifyUrl: link.verifyUrl,
  });

  if (!send.ok) {
    return NextResponse.json({ error: emailSendError(send) }, { status: 502 });
  }

  return NextResponse.json({
    success: true,
    resent: true,
    sentTo: email,
    messageId: send.id,
  });
}
