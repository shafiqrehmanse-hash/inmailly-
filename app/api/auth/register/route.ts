import { NextResponse } from "next/server";
import { notifyAdminOnSignup } from "@/lib/post-verification";
import { sendTeamVerificationEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { findMemberIdByReferralCode } from "@/lib/utils";
import { generateVerificationLink } from "@/lib/verification-email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, inviteCode, refCode, phone } = body;

    if (!name || !email || !password || !inviteCode) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    const cleanedPhone = typeof phone === "string" ? phone.replace(/[^+0-9]/g, "") : "";
    if (!cleanedPhone || cleanedPhone.length < 8) {
      return NextResponse.json(
        { error: "WhatsApp / phone number with country code is required" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const admin = createAdminClient();
    const normalizedEmail = email.trim().toLowerCase();

    const { data: codeRow } = await admin
      .from("invite_codes")
      .select("*")
      .eq("code", inviteCode.trim())
      .gt("uses_left", 0)
      .single();

    if (!codeRow) {
      return NextResponse.json(
        { error: "Invalid or expired invite code" },
        { status: 400 }
      );
    }

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: false,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Failed to create user" },
        { status: 400 }
      );
    }

    const { data: member, error: memberError } = await admin
      .from("team_members")
      .insert({
        user_id: authData.user.id,
        name: name.trim(),
        email: normalizedEmail,
        phone: cleanedPhone,
        invite_code: inviteCode.trim(),
      })
      .select()
      .single();

    if (memberError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: memberError.message },
        { status: 400 }
      );
    }

    await admin
      .from("invite_codes")
      .update({
        uses_left: codeRow.uses_left - 1,
        used_count: (codeRow.used_count || 0) + 1,
      })
      .eq("id", codeRow.id);

    if (refCode && member) {
      const { data: allMembers } = await admin.from("team_members").select("id");
      const referrerId = findMemberIdByReferralCode(allMembers || [], refCode);
      if (referrerId) {
        await admin.from("referrals").insert({
          referrer_id: referrerId,
          referred_email: normalizedEmail,
          referred_name: name.trim(),
          status: "joined",
        });
      }
    }

    const adminNotify = await notifyAdminOnSignup("team", {
      name: name.trim(),
      email: normalizedEmail,
      phone: cleanedPhone,
      inviteCode: inviteCode.trim(),
    });

    const link = await generateVerificationLink(admin, normalizedEmail, "/team/hub", password);
    if ("error" in link) {
      return NextResponse.json({
        error: link.error,
        partial: true,
        adminNotified: adminNotify.ok,
      }, { status: 400 });
    }

    const verifySend = await sendTeamVerificationEmail({
      name: name.trim(),
      email: normalizedEmail,
      verifyUrl: link.verifyUrl,
    });

    if (!verifySend.ok && !verifySend.skipped) {
      return NextResponse.json({
        error: verifySend.error || "Could not send verification email",
        partial: true,
        adminNotified: adminNotify.ok,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      verifyEmail: true,
      adminNotified: adminNotify.ok,
      emailConfigured: !verifySend.skipped,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
