import { createAdminClient } from "@/lib/supabase/admin";

const STALE_MS = 8 * 60 * 1000;

function utcDateKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function sessionMinutes(startedAt: string, lastHeartbeatAt: string, endedAt?: string | null) {
  const end = endedAt ? new Date(endedAt).getTime() : new Date(lastHeartbeatAt).getTime();
  return Math.max(0, (end - new Date(startedAt).getTime()) / 60000);
}

export async function heartbeatWorkSession(memberId: string) {
  const admin = createAdminClient();
  const now = new Date();
  const nowIso = now.toISOString();

  const { data: open } = await admin
    .from("member_work_sessions")
    .select("id, started_at, last_heartbeat_at")
    .eq("member_id", memberId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (open) {
    const gap = now.getTime() - new Date(open.last_heartbeat_at).getTime();
    if (gap <= STALE_MS) {
      await admin
        .from("member_work_sessions")
        .update({ last_heartbeat_at: nowIso })
        .eq("id", open.id);
      return { sessionId: open.id, continued: true };
    }
    await admin
      .from("member_work_sessions")
      .update({ ended_at: open.last_heartbeat_at })
      .eq("id", open.id);
  }

  const { data: created, error } = await admin
    .from("member_work_sessions")
    .insert({
      member_id: memberId,
      started_at: nowIso,
      last_heartbeat_at: nowIso,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { sessionId: created.id, continued: false };
}

export async function sumSessionMinutes(
  memberId: string,
  fromIso: string,
  toIso?: string
) {
  const admin = createAdminClient();
  let query = admin
    .from("member_work_sessions")
    .select("started_at, last_heartbeat_at, ended_at")
    .eq("member_id", memberId)
    .gte("started_at", fromIso);
  if (toIso) query = query.lt("started_at", toIso);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data || []).reduce(
    (sum, row) => sum + sessionMinutes(row.started_at, row.last_heartbeat_at, row.ended_at),
    0
  );
}

export async function todaySessionMinutes(memberId: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return sumSessionMinutes(memberId, start.toISOString());
}

export type MemberTimeRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  minutesToday: number;
  minutesWeek: number;
  live: boolean;
};

export async function listMemberTimeRows(): Promise<MemberTimeRow[]> {
  const admin = createAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const week = new Date(today);
  week.setDate(week.getDate() - 6);

  const [{ data: members }, { data: sessions }] = await Promise.all([
    admin
      .from("team_members")
      .select("id, name, email, role")
      .eq("is_active", true)
      .order("name"),
    admin
      .from("member_work_sessions")
      .select("member_id, started_at, last_heartbeat_at, ended_at")
      .gte("started_at", week.toISOString()),
  ]);

  const todayIso = today.toISOString();
  const liveCutoff = Date.now() - STALE_MS;
  const map = new Map<string, MemberTimeRow>();

  for (const m of members || []) {
    map.set(m.id, {
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      minutesToday: 0,
      minutesWeek: 0,
      live: false,
    });
  }

  for (const s of sessions || []) {
    const row = map.get(s.member_id);
    if (!row) continue;
    const mins = sessionMinutes(s.started_at, s.last_heartbeat_at, s.ended_at);
    row.minutesWeek += mins;
    if (s.started_at >= todayIso) row.minutesToday += mins;
    if (!s.ended_at && new Date(s.last_heartbeat_at).getTime() >= liveCutoff) {
      row.live = true;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.minutesToday - a.minutesToday);
}

export function todayDateKey() {
  return utcDateKey();
}
