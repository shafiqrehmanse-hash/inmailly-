import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Client } from "@/lib/types";

export async function getCurrentClient(): Promise<Client | null> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: viaRls } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (viaRls) return viaRls as Client;

  // Fallback when RLS policy is missing or misconfigured (server-only, user is authenticated)
  const admin = createAdminClient();
  const { data: viaAdmin } = await admin
    .from("clients")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (viaAdmin as Client | null) ?? null;
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

export async function clientExistsForUser(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin.from("clients").select("id").eq("user_id", userId).maybeSingle();
  return Boolean(data);
}
