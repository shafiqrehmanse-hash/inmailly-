import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { leaderIds } = await request.json();
  if (!Array.isArray(leaderIds)) {
    return NextResponse.json({ error: "leaderIds array required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const threadId = params.id;

  const { data: thread } = await admin
    .from("live_chat_threads")
    .select("id")
    .eq("id", threadId)
    .maybeSingle();

  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  if (leaderIds.length > 0) {
    const { data: leaders } = await admin
      .from("team_members")
      .select("id, role, live_chat_agent, is_active")
      .in("id", leaderIds);

    const valid = (leaders || []).filter(
      (l) => l.role === "team_leader" && l.is_active && l.live_chat_agent
    );
    if (valid.length !== leaderIds.length) {
      return NextResponse.json(
        { error: "All assigned leaders must be active team leaders with live chat access granted" },
        { status: 400 }
      );
    }
  }

  await admin.from("live_chat_thread_leaders").delete().eq("thread_id", threadId);

  if (leaderIds.length > 0) {
    const { error } = await admin.from("live_chat_thread_leaders").insert(
      leaderIds.map((leaderId: string) => ({
        thread_id: threadId,
        leader_id: leaderId,
      }))
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: assigned } = await admin
    .from("live_chat_thread_leaders")
    .select("leader_id")
    .eq("thread_id", threadId);

  const ids = (assigned || []).map((a) => a.leader_id);
  let leaders: { id: string; name: string }[] = [];
  if (ids.length) {
    const { data: rows } = await admin.from("team_members").select("id, name").in("id", ids);
    leaders = rows || [];
  }

  return NextResponse.json({ assigned: leaders });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status } = await request.json();
  if (status !== "open" && status !== "closed") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("live_chat_threads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
