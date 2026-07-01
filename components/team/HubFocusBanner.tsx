import { createAdminClient } from "@/lib/supabase/admin";

export default async function HubFocusBanner() {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data } = await admin
    .from("team_focus_announcements")
    .select("message, expires_at, created_by_member_id")
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const { data: author } = await admin
    .from("team_members")
    .select("name")
    .eq("id", data.created_by_member_id)
    .maybeSingle();

  return (
    <div className="lux-card-elite p-4 sm:p-5 border-amber-500/30 bg-gradient-to-r from-amber-500/[0.08] via-transparent to-lux-violet/[0.06]">
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-amber-400 mb-2">
        ★ Focus this week — {author?.name || "Team leader"}
      </p>
      <p className="text-[0.95rem] text-lux-text leading-relaxed">{data.message}</p>
    </div>
  );
}
