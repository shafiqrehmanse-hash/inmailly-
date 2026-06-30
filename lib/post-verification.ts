import { createAdminClient } from "@/lib/supabase/admin";
import {
  notifyAdminClientSignup,
  notifyAdminClientVerified,
  notifyAdminTeamSignupPending,
  notifyAdminTeamVerified,
  notifyClientWelcomeVerified,
  notifyTeamWelcomeVerified,
} from "@/lib/email";

type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

/** Send admin + welcome emails once after email verification (idempotent via user_metadata). */
export async function handlePostEmailVerification(user: AuthUser) {
  if (user.user_metadata?.verified_notify_sent) return;

  const admin = createAdminClient();
  const email = user.email?.trim().toLowerCase();
  if (!email) return;

  const { data: teamMember } = await admin
    .from("team_members")
    .select("id, name, email, role, invite_code")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: client } = await admin
    .from("clients")
    .select("id, name, email, company_name")
    .eq("user_id", user.id)
    .maybeSingle();

  let notified = false;

  if (teamMember && teamMember.role !== "campaign_manager") {
    await notifyAdminTeamVerified({
      name: teamMember.name,
      email: teamMember.email || email,
      inviteCode: teamMember.invite_code,
    });
    await notifyTeamWelcomeVerified({ name: teamMember.name, email: teamMember.email || email });
    notified = true;
  } else if (client) {
    await notifyAdminClientVerified({
      name: client.name,
      email: client.email || email,
      company: client.company_name,
    });
    await notifyClientWelcomeVerified({
      name: client.name,
      email: client.email || email,
      company: client.company_name,
    });
    notified = true;
  }

  if (notified) {
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, verified_notify_sent: true },
    });
  }
}

/** Notify admin when someone registers (before verify) — separate from verified notify. */
export async function notifyAdminOnSignup(type: "team" | "client", data: {
  name: string;
  email: string;
  company?: string | null;
  inviteCode?: string | null;
}) {
  if (type === "team") {
    return notifyAdminTeamSignupPending({
      name: data.name,
      email: data.email,
      inviteCode: data.inviteCode,
    });
  }
  return notifyAdminClientSignup({
    name: data.name,
    email: data.email,
    company: data.company,
  });
}
