import { createAdminClient } from "@/lib/supabase/admin";
import {
  notifyAdminTeamVerified,
  notifyContentManagerWelcomeVerified,
  notifyTeamWelcomeVerified,
} from "@/lib/email";
import { isCampaignManager, isContentManager } from "@/lib/roles";

type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

function metaFlag(user: AuthUser, key: string) {
  return Boolean(user.user_metadata?.[key]);
}

async function patchMeta(user: AuthUser, patch: Record<string, unknown>) {
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...(user.user_metadata || {}), ...patch },
  });
}

/** Send admin + welcome emails once after email verification (idempotent). */
export async function handlePostEmailVerification(user: AuthUser) {
  const admin = createAdminClient();
  const email = user.email?.trim().toLowerCase();
  if (!email) return;

  const { data: fresh } = await admin.auth.admin.getUserById(user.id);
  const live = fresh.user;
  if (!live?.email_confirmed_at) return;

  const meta = (live.user_metadata || {}) as Record<string, unknown>;
  const withMeta: AuthUser = { ...live, user_metadata: meta };

  const { data: teamMember } = await admin
    .from("team_members")
    .select("id, name, email, phone, role, invite_code")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: client } = await admin
    .from("clients")
    .select("id, name, email, company_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (teamMember && isCampaignManager(teamMember.role)) {
    return;
  }

  if (teamMember && isContentManager(teamMember.role)) {
    if (!metaFlag(withMeta, "admin_verified_notify_sent")) {
      const adminResult = await notifyAdminTeamVerified({
        name: teamMember.name,
        email: teamMember.email || email,
        phone: teamMember.phone,
        inviteCode: teamMember.invite_code,
      });
      if (adminResult.ok || adminResult.skipped) {
        await patchMeta(withMeta, { admin_verified_notify_sent: true });
      }
    }

    if (!metaFlag(withMeta, "welcome_email_sent")) {
      const welcomeResult = await notifyContentManagerWelcomeVerified({
        name: teamMember.name,
        email: teamMember.email || email,
      });
      if (welcomeResult.ok || welcomeResult.skipped) {
        await patchMeta(withMeta, { welcome_email_sent: true, verified_notify_sent: true });
      }
    }
    return;
  }

  if (teamMember) {
    if (!metaFlag(withMeta, "admin_verified_notify_sent")) {
      const adminResult = await notifyAdminTeamVerified({
        name: teamMember.name,
        email: teamMember.email || email,
        phone: teamMember.phone,
        inviteCode: teamMember.invite_code,
      });
      if (adminResult.ok || adminResult.skipped) {
        await patchMeta(withMeta, { admin_verified_notify_sent: true });
      }
    }

    if (!metaFlag(withMeta, "welcome_email_sent")) {
      const welcomeResult = await notifyTeamWelcomeVerified({
        name: teamMember.name,
        email: teamMember.email || email,
      });
      if (welcomeResult.ok || welcomeResult.skipped) {
        await patchMeta(withMeta, { welcome_email_sent: true, verified_notify_sent: true });
      }
    }
    return;
  }

  if (client) {
    const { notifyAdminClientVerified, notifyClientWelcomeVerified } = await import("@/lib/email");
    if (!metaFlag(withMeta, "admin_verified_notify_sent")) {
      const adminResult = await notifyAdminClientVerified({
        name: client.name,
        email: client.email || email,
        company: client.company_name,
      });
      if (adminResult.ok || adminResult.skipped) {
        await patchMeta(withMeta, { admin_verified_notify_sent: true });
      }
    }

    if (!metaFlag(withMeta, "welcome_email_sent")) {
      const welcomeResult = await notifyClientWelcomeVerified({
        name: client.name,
        email: client.email || email,
        company: client.company_name,
      });
      if (welcomeResult.ok || welcomeResult.skipped) {
        await patchMeta(withMeta, { welcome_email_sent: true, verified_notify_sent: true });
      }
    }
  }
}

/** Notify admin when someone registers (before verify). */
export async function notifyAdminOnSignup(
  type: "team" | "client",
  data: {
    name: string;
    email: string;
    phone?: string | null;
    company?: string | null;
    inviteCode?: string | null;
  }
) {
  if (type === "team") {
    const { notifyAdminTeamSignupPending } = await import("@/lib/email");
    return notifyAdminTeamSignupPending({
      name: data.name,
      email: data.email,
      phone: data.phone,
      inviteCode: data.inviteCode,
    });
  }
  const { notifyAdminClientSignup } = await import("@/lib/email");
  return notifyAdminClientSignup({
    name: data.name,
    email: data.email,
    company: data.company,
  });
}
