import { createServerSupabase } from "@/lib/supabase/server";
import type { TeamMember } from "@/lib/types";

export async function getCurrentMember(): Promise<TeamMember | null> {
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

  return data as TeamMember | null;
}
