import { createAdminClient } from "@/lib/supabase/admin";
import { isCampaignManager } from "@/lib/roles";
import { createServerSupabase } from "@/lib/supabase/server";
import type { TeamMember } from "@/lib/types";

/** Outreach team member (not campaign manager) for /team/* marketing leads. */
export async function getOutreachTeamMember(): Promise<TeamMember | null> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  if (!user.email_confirmed_at) return null;

  const { data: viaRls } = await supabase
    .from("team_members")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  let member = (viaRls as TeamMember | null) ?? null;

  if (!member) {
    const { data: viaAdmin } = await createAdminClient()
      .from("team_members")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    member = (viaAdmin as TeamMember | null) ?? null;
  }

  if (!member || isCampaignManager(member.role)) return null;
  return member;
}
