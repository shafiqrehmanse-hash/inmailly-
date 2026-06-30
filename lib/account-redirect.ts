import { getLoginRedirect } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";

/** Canonical landing path after email verification, based on account type in DB. */
export async function resolvePostVerifyRedirect(
  userId: string,
  nextParam?: string | null
): Promise<string> {
  const admin = createAdminClient();
  const [{ data: member }, { data: client }] = await Promise.all([
    admin.from("team_members").select("role").eq("user_id", userId).maybeSingle(),
    admin.from("clients").select("id").eq("user_id", userId).maybeSingle(),
  ]);

  let canonical: string;
  if (member) {
    canonical = getLoginRedirect(member.role);
  } else if (client) {
    canonical = "/client/dashboard";
  } else {
    return nextParam || "/team/login?verified=1";
  }

  if (!nextParam) return canonical;

  const wantsClient = nextParam.startsWith("/client");
  const wantsTeam =
    nextParam.startsWith("/team") || nextParam.startsWith("/campaign");

  if (member && wantsTeam) return nextParam;
  if (client && wantsClient) return nextParam;

  return canonical;
}

/** Middleware helper: where a verified user should land based on account type. */
export async function resolveVerifiedHome(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const [{ data: member }, { data: client }] = await Promise.all([
    admin.from("team_members").select("role").eq("user_id", userId).maybeSingle(),
    admin.from("clients").select("id").eq("user_id", userId).maybeSingle(),
  ]);

  if (member) return getLoginRedirect(member.role);
  if (client) return "/client/dashboard";
  return null;
}
