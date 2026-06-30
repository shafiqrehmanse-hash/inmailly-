import { NextResponse } from "next/server";
import { handlePostEmailVerification } from "@/lib/post-verification";
import { createServerSupabase } from "@/lib/supabase/server";

/** Backup: send welcome + admin verified emails if user verified but callback was skipped. */
export async function POST() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  if (!user.email_confirmed_at) {
    return NextResponse.json({ error: "Email not verified yet" }, { status: 400 });
  }

  try {
    await handlePostEmailVerification(user);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[complete-verification]", e);
    return NextResponse.json({ error: "Could not send welcome emails" }, { status: 500 });
  }
}
