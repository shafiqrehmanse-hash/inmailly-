import { createServerSupabase } from "@/lib/supabase/server";
import type { Client } from "@/lib/types";

export async function getCurrentClient(): Promise<Client | null> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return data as Client | null;
}

export async function isTeamMemberUser(userId: string): Promise<boolean> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("team_members")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}
