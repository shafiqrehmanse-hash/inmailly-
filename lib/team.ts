import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import type { TeamMember } from "@/lib/types";

export const getCurrentMember = cache(async (): Promise<TeamMember | null> => {
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

  if (viaRls) return viaRls as TeamMember;

  const admin = createAdminClient();
  const { data: viaAdmin } = await admin
    .from("team_members")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (viaAdmin as TeamMember | null) ?? null;
});
