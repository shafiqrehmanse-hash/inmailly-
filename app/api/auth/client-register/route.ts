import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomToken } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, company } = body;

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const admin = createAdminClient();
    const normalizedEmail = email.trim().toLowerCase();

    const { data: existingClient } = await admin
      .from("clients")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingClient) {
      return NextResponse.json({ error: "An account with this email already exists. Try logging in." }, { status: 400 });
    }

    const { data: existingMember } = await admin
      .from("team_members")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json({ error: "This email is registered as a team account. Use team login instead." }, { status: 400 });
    }

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: name.trim(), company: company?.trim() || null },
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || "Failed to create account" }, { status: 400 });
    }

    const companyName = company?.trim() || null;

    const { data: client, error: clientError } = await admin
      .from("clients")
      .insert({
        user_id: authData.user.id,
        name: name.trim(),
        email: normalizedEmail,
        company_name: companyName,
        signup_source: "self",
        is_active: true,
      })
      .select("id")
      .single();

    if (clientError || !client) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: clientError?.message || "Failed to create client profile" }, { status: 400 });
    }

    const projectName = companyName ? `${companyName} Campaign` : `${name.trim().split(" ")[0]}'s Campaign`;

    const { error: projectError } = await admin.from("projects").insert({
      client_id: client.id,
      name: projectName,
      status: "preview",
      audience_brief: "Your preview dashboard — book a call with InMailly to launch a live campaign with your audience and scripts.",
      portal_token: randomToken(),
    });

    if (projectError) {
      await admin.from("clients").delete().eq("id", client.id);
      await admin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: projectError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
