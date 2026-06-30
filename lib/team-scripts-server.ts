import { buildScriptsPayload } from "@/lib/scripts";
import { createServerSupabase } from "@/lib/supabase/server";

const TEAM_SCRIPT_KEYS = [
  "script_add_note",
  "script_inmail",
  "script_inmail_subject",
  "script_inmail_body",
  "daily_script",
] as const;

export async function getTeamScriptsPayload() {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", [...TEAM_SCRIPT_KEYS]);

  const map: Record<string, string> = {};
  for (const row of data || []) {
    map[row.key] = row.value || "";
  }

  return buildScriptsPayload({
    add_note: map.script_add_note || map.daily_script || "",
    inmail: map.script_inmail || "",
    inmail_subject: map.script_inmail_subject || "",
    inmail_body: map.script_inmail_body || "",
  });
}
