import { createAdminClient } from "@/lib/supabase/admin";
import { isCampaignManager } from "@/lib/roles";
import { createServerSupabase } from "@/lib/supabase/server";
import type { TeamMember } from "@/lib/types";

export async function getCampaignMember(): Promise<TeamMember | null> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: viaRls } = await supabase
    .from("team_members")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const member = viaRls
    ? (viaRls as TeamMember)
    : ((
        await createAdminClient().from("team_members").select("*").eq("user_id", user.id).maybeSingle()
      ).data as TeamMember | null);

  if (!member || !isCampaignManager(member.role)) return null;
  return member;
}

export async function assertProjectAccess(memberId: string, projectId: string): Promise<boolean> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("team_members")
    .select("id")
    .eq("id", memberId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member) return false;

  const { data } = await admin
    .from("project_assignments")
    .select("id")
    .eq("member_id", memberId)
    .eq("project_id", projectId)
    .maybeSingle();
  return Boolean(data);
}
