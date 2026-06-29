import { createServerSupabase } from "@/lib/supabase/server";
import { isCampaignManager } from "@/lib/roles";
import type { TeamMember } from "@/lib/types";

export async function getCampaignMember(): Promise<TeamMember | null> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("team_members")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!data || !isCampaignManager(data.role)) return null;
  return data as TeamMember;
}

export async function assertProjectAccess(memberId: string, projectId: string): Promise<boolean> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("project_assignments")
    .select("id")
    .eq("member_id", memberId)
    .eq("project_id", projectId)
    .maybeSingle();
  return Boolean(data);
}
