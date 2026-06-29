import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifyAdminClientSignup, sendClientVerificationEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomToken } from "@/lib/utils";

async function createClientProfile(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  name: string,
  normalizedEmail: string,
  companyName: string | null
) {
  const { data: orphan } = await admin
    .from("clients")
    .select("id, user_id")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (orphan?.user_id && orphan.user_id !== userId) {
    return { error: "An account with this email already exists. Try logging in." };
  }

  let clientId = orphan?.id;

  if (orphan && !orphan.user_id) {
    const { error: updateError } = await admin
      .from("clients")
      .update({
        user_id: userId,
        name: name.trim(),
        company_name: companyName,
        signup_source: "self",
        is_active: true,
      })
      .eq("id", orphan.id);
    if (updateError) return { error: updateError.message };
  } else if (!orphan) {
    const { data: client, error: clientError } = await admin
      .from("clients")
      .insert({
        user_id: userId,
        name: name.trim(),
        email: normalizedEmail,
        company_name: companyName,
        signup_source: "self",
        is_active: true,
      })
      .select("id")
      .single();

    if (clientError || !client) {
      return { error: clientError?.message || "Failed to create client profile" };
    }
    clientId = client.id;
  }

  const { data: existingProject } = await admin
    .from("projects")
    .select("id")
    .eq("client_id", clientId!)
    .maybeSingle();

  if (!existingProject) {
    const projectName = companyName ? `${companyName} Campaign` : `${name.trim().split(" ")[0]}'s Campaign`;
    const { error: projectError } = await admin.from("projects").insert({
      client_id: clientId!,
      name: projectName,
      status: "preview",
      audience_brief:
        "Your preview dashboard — book a call with InMailly to launch a live campaign with your audience and scripts.",
      portal_token: randomToken(),
    });
    if (projectError) {
      if (!orphan) await admin.from("clients").delete().eq("id", clientId!);
      return { error: projectError.message };
    }
  }

  return { ok: true as const };
}

async function sendVerificationEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
  password: string,
  name: string
) {
  const redirectTo = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent("/client/dashboard")}`;
  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: { redirectTo },
  });

  if (error || !data.properties?.action_link) {
    const fallback = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });
    if (fallback.error || !fallback.data.properties?.action_link) {
      return { error: error?.message || fallback.error?.message || "Could not generate verify link" };
    }
    await sendClientVerificationEmail({
      name,
      email,
      verifyUrl: fallback.data.properties.action_link,
    });
    return { ok: true as const };
  }

  await sendClientVerificationEmail({
    name,
    email,
    verifyUrl: data.properties.action_link,
  });
  return { ok: true as const };
}

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
    const companyName = company?.trim() || null;

    const { data: existingClient } = await admin
      .from("clients")
      .select("id, user_id")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (existingClient?.user_id) {
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

    let userId: string | undefined;
    let isNewAuthUser = false;

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: false,
      user_metadata: { full_name: name.trim(), company: companyName },
    });

    if (authData.user) {
      userId = authData.user.id;
      isNewAuthUser = true;
    } else if (authError?.message?.toLowerCase().includes("already")) {
      const anon = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: signInData, error: signInError } = await anon.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      await anon.auth.signOut();

      if (signInError || !signInData.user) {
        return NextResponse.json({ error: "An account with this email already exists. Try logging in." }, { status: 400 });
      }

      userId = signInData.user.id;

      const { data: linkedClient } = await admin
        .from("clients")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (linkedClient) {
        return NextResponse.json({ error: "An account with this email already exists. Try logging in." }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: authError?.message || "Failed to create account" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "Failed to create account" }, { status: 400 });
    }

    const profile = await createClientProfile(admin, userId, name.trim(), normalizedEmail, companyName);
    if ("error" in profile) {
      if (isNewAuthUser && authData.user) {
        await admin.auth.admin.deleteUser(authData.user.id);
      }
      const msg = profile.error || "Failed to create client profile";
      return NextResponse.json(
        {
          error:
            msg.includes("user_id") || msg.includes("signup_source")
              ? "Database not ready — run migration 008_client_signup.sql in Supabase, then try again."
              : msg,
        },
        { status: 400 }
      );
    }

    const verify = await sendVerificationEmail(admin, normalizedEmail, password, name.trim());
    if ("error" in verify) {
      return NextResponse.json({ error: verify.error }, { status: 400 });
    }

    void notifyAdminClientSignup({
      name: name.trim(),
      email: normalizedEmail,
      company: companyName,
    });

    return NextResponse.json({ success: true, verifyEmail: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
