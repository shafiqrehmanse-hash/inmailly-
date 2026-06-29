import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findMemberIdByReferralCode } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, inviteCode, refCode } = body;

    if (!name || !email || !password || !inviteCode) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const admin = createAdminClient();

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
      email: email.trim(),
      password,
      email_confirm: true,
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
        email: email.trim().toLowerCase(),
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
          referred_email: email.trim().toLowerCase(),
          referred_name: name.trim(),
          status: "joined",
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
