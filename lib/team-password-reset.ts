import { sendTeamPasswordResetEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateRecoveryLink } from "@/lib/verification-email";

function emailSendError(result: { ok: false; skipped?: boolean; error?: string }) {
  return result.skipped
    ? "Email not configured — contact support or try again later."
    : result.error || "Could not send reset email";
}

/** Send a branded password-reset email if this address belongs to a team member. */
export async function sendTeamMemberPasswordReset(email: string): Promise<
  { ok: true; sent: boolean } | { ok: false; error: string }
> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    return { ok: false, error: "Enter a valid email" };
  }

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("team_members")
    .select("name, email, user_id, is_active")
    .eq("email", normalized)
    .maybeSingle();

  if (!member?.user_id) {
    return { ok: true, sent: false };
  }

  const { data: authUser } = await admin.auth.admin.getUserById(member.user_id);
  const authEmail = authUser.user?.email;
  if (!authEmail) {
    return { ok: true, sent: false };
  }

  const link = await generateRecoveryLink(admin, authEmail, "/team/reset-password");
  if ("error" in link) {
    return { ok: false, error: link.error || "Could not generate reset link" };
  }

  const send = await sendTeamPasswordResetEmail({
    name: member.name || "there",
    email: member.email || normalized,
    resetUrl: link.resetUrl,
  });

  if (!send.ok) {
    return { ok: false, error: emailSendError(send) };
  }

  return { ok: true, sent: true };
}
