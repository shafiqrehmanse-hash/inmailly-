import { NextResponse } from "next/server";
import { sendClientVerificationEmail, sendTeamVerificationEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateVerificationLink } from "@/lib/verification-email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const admin = createAdminClient();

    const [{ data: client }, { data: teamMember }] = await Promise.all([
      admin.from("clients").select("name, user_id").ilike("email", normalizedEmail).maybeSingle(),
      admin.from("team_members").select("name, user_id, role").eq("email", normalizedEmail).maybeSingle(),
    ]);

    const account = client?.user_id
      ? { type: "client" as const, name: client.name || "there", userId: client.user_id, redirect: "/client/dashboard" }
      : teamMember?.user_id
        ? {
            type: "team" as const,
            name: teamMember.name || "there",
            userId: teamMember.user_id,
            redirect:
              teamMember.role === "campaign_manager"
                ? "/campaign/hub"
                : teamMember.role === "content_manager"
                  ? "/content/hub"
                  : "/team/hub",
          }
        : null;

    if (!account) {
      return NextResponse.json({ error: "No account found for this email." }, { status: 404 });
    }

    const { data: userData } = await admin.auth.admin.getUserById(account.userId);
    if (userData.user?.email_confirmed_at) {
      return NextResponse.json({ error: "Email is already verified. Try logging in." }, { status: 400 });
    }

    const link = await generateVerificationLink(admin, normalizedEmail, account.redirect);
    if ("error" in link) {
      return NextResponse.json({ error: link.error }, { status: 400 });
    }

    if (account.type === "client") {
      await sendClientVerificationEmail({
        name: account.name,
        email: normalizedEmail,
        verifyUrl: link.verifyUrl,
      });
    } else {
      await sendTeamVerificationEmail({
        name: account.name,
        email: normalizedEmail,
        verifyUrl: link.verifyUrl,
      });
    }

    return NextResponse.json({ ok: true, accountType: account.type });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
