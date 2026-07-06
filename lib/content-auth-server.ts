import { createAdminClient } from "@/lib/supabase/admin";
import { isContentManager } from "@/lib/roles";
import { createServerSupabase } from "@/lib/supabase/server";
import type { TeamMember } from "@/lib/types";

export async function getContentManagerMember(): Promise<TeamMember | null> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email_confirmed_at) return null;

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

  if (!member?.is_active || !isContentManager(member.role)) return null;
  return member;
}
