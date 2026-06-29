import { NextResponse } from "next/server";
import { sendClientVerificationEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const admin = createAdminClient();

    const { data: client } = await admin
      .from("clients")
      .select("name, user_id")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (!client?.user_id) {
      return NextResponse.json({ error: "No client account found for this email." }, { status: 404 });
    }

    const { data: userData } = await admin.auth.admin.getUserById(client.user_id);
    if (userData.user?.email_confirmed_at) {
      return NextResponse.json({ error: "Email is already verified. Try logging in." }, { status: 400 });
    }

    const redirectTo = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent("/client/dashboard")}`;
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: normalizedEmail,
      options: { redirectTo },
    });

    if (error || !data.properties?.action_link) {
      return NextResponse.json({ error: error?.message || "Could not send verification email" }, { status: 400 });
    }

    await sendClientVerificationEmail({
      name: client.name || "there",
      email: normalizedEmail,
      verifyUrl: data.properties.action_link,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
