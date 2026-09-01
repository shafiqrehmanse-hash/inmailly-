import { createAdminClient } from "@/lib/supabase/admin";

export async function getOrCreateClientOpenThread(clientId: string) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("client_live_chat_threads")
    .select("*")
    .eq("client_id", clientId)
    .eq("status", "open")
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await admin
    .from("client_live_chat_threads")
    .insert({ client_id: clientId, status: "open", subject: "Client support" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return created;
}
