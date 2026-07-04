import { createAdminClient } from "@/lib/supabase/admin";

export type VictoryKind = "deal_closed" | "meeting_booked" | "custom" | "birthday";

export type TeamVictoryAnnouncement = {
  id: string;
  kind: VictoryKind;
  member_id: string | null;
  member_name: string;
  lead_name: string | null;
  message: string | null;
  expires_at: string;
  created_at: string;
};

const DEFAULT_HOURS = 24;

export async function publishVictoryAnnouncement(opts: {
  kind: VictoryKind;
  memberId?: string | null;
  memberName: string;
  leadName?: string | null;
  message?: string | null;
  hours?: number;
}) {
  const admin = createAdminClient();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + (opts.hours ?? DEFAULT_HOURS));

  const { error } = await admin.from("team_victory_announcements").insert({
    kind: opts.kind,
    member_id: opts.memberId || null,
    member_name: opts.memberName.trim() || "Team member",
    lead_name: opts.leadName?.trim() || null,
    message: opts.message?.trim() || null,
    expires_at: expiresAt.toISOString(),
  });

  if (error) console.error("publishVictoryAnnouncement:", error.message);
}

export async function getActiveVictoryAnnouncements(limit = 5): Promise<TeamVictoryAnnouncement[]> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from("team_victory_announcements")
    .select("*")
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getActiveVictoryAnnouncements:", error.message);
    return [];
  }

  return (data || []) as TeamVictoryAnnouncement[];
}

export function victoryBannerText(row: TeamVictoryAnnouncement): string {
  const name = row.member_name;
  const lead = row.lead_name;

  if (row.message?.trim()) return row.message.trim();

  switch (row.kind) {
    case "deal_closed":
      return lead
        ? `${name} closed the deal — ${lead}`
        : `${name} closed a deal`;
    case "meeting_booked":
      return lead
        ? `${name} booked a meeting — ${lead}`
        : `${name} booked a meeting`;
    case "birthday":
      return `Happy birthday, ${name}! 🎂`;
    default:
      return row.message || `${name} — team announcement`;
  }
}
