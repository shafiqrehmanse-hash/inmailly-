import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifyAdminOnSignup } from "@/lib/post-verification";
import { isEmailConfigured, sendClientVerificationEmail } from "@/lib/email";
import { ensureClientHasProject } from "@/lib/ensure-client-project";
import { getSiteContent } from "@/lib/site-content-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateVerificationLink } from "@/lib/verification-email";

async function createClientProfile(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  name: string,
  normalizedEmail: string,
  companyName: string | null,
  trialPackageSize?: number
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

  const project = await ensureClientHasProject(
    admin,
    {
      id: clientId!,
      name: name.trim(),
      email: normalizedEmail,
      company_name: companyName,
    },
    { inmailPackageSize: trialPackageSize }
  );
  if (!project) {
    if (!orphan) await admin.from("clients").delete().eq("id", clientId!);
    return { error: "Failed to create preview project" };
  }

  return { ok: true as const };
}

async function sendVerificationEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
  password: string,
  name: string
) {
  const link = await generateVerificationLink(admin, email, "/client/dashboard", password);
  if ("error" in link) {
    return { error: link.error };
  }

  const result = await sendClientVerificationEmail({
    name,
    email,
    verifyUrl: link.verifyUrl,
  });

  if (!result.ok && !result.skipped) {
    return { error: result.error || "Could not send verification email" };
  }

  return { ok: true as const, emailConfigured: !result.skipped };
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

    const site = await getSiteContent();
    const trialPackageSize = site.trial.enabled ? site.trial.inmailCount : undefined;

    const profile = await createClientProfile(admin, userId, name.trim(), normalizedEmail, companyName, trialPackageSize);
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

    const signupNotify = await notifyAdminOnSignup("client", {
      name: name.trim(),
      email: normalizedEmail,
      company: companyName,
    });

    const verify = await sendVerificationEmail(admin, normalizedEmail, password, name.trim());
    if ("error" in verify) {
      return NextResponse.json({
        error: verify.error,
        partial: true,
        adminNotified: signupNotify.ok,
        emailConfigured: isEmailConfigured(),
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      verifyEmail: true,
      adminNotified: signupNotify.ok,
      emailConfigured: verify.emailConfigured,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
