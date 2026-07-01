import { NextRequest, NextResponse } from "next/server";
import { canOpenLiveChat } from "@/lib/roles";
import { enrichThreads, getOrCreateOpenThread, autoAssignThreadIfNeeded } from "@/lib/live-chat-server";
import { getCurrentMember } from "@/lib/team";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const member = await getCurrentMember();
  if (!member || !member.is_active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canOpenLiveChat(member.role)) {
    return NextResponse.json({ error: "Live chat is for outreach members only" }, { status: 403 });
  }

  const admin = createAdminClient();
  const thread = await getOrCreateOpenThread(member.id);

  const { data: messages } = await admin
    .from("live_chat_messages")
    .select("*")
    .eq("thread_id", thread.id)
    .order("created_at", { ascending: true })
    .limit(200);

  if ((messages || []).some((m) => m.sender_type === "member")) {
    await autoAssignThreadIfNeeded(thread.id);
  }

  const [enriched] = await enrichThreads([thread]);

  return NextResponse.json({
    thread: enriched,
    messages: messages || [],
    canChat: true,
  });
}

export async function POST(request: NextRequest) {
  const member = await getCurrentMember();
  if (!member || !member.is_active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canOpenLiveChat(member.role)) {
    return NextResponse.json({ error: "Live chat is for outreach members only" }, { status: 403 });
  }

  const { body } = await request.json();
  if (!body?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const thread = await getOrCreateOpenThread(member.id);

  const now = new Date().toISOString();
  const { data: message, error } = await admin
    .from("live_chat_messages")
    .insert({
      thread_id: thread.id,
      sender_type: "member",
      sender_member_id: member.id,
      sender_name: member.name,
      body: body.trim(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin
    .from("live_chat_threads")
    .update({ last_message_at: now, updated_at: now })
    .eq("id", thread.id);

  const assigned = await autoAssignThreadIfNeeded(thread.id);

  return NextResponse.json({ message, assigned });
}
