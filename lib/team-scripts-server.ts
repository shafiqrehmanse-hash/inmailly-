import { buildScriptsPayload } from "@/lib/scripts";
import { createServerSupabase } from "@/lib/supabase/server";

export async function getTeamScriptsPayload() {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["script_add_note", "script_inmail", "daily_script"]);

  const map: Record<string, string> = {};
  for (const row of data || []) {
    map[row.key] = row.value || "";
  }

  return buildScriptsPayload({
    add_note: map.script_add_note || map.daily_script || "",
    inmail: map.script_inmail || "",
  });
}
