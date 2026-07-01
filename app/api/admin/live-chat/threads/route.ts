import { NextRequest, NextResponse } from "next/server";
import { enrichThreads } from "@/lib/live-chat-server";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("status") || "open";
  const admin = createAdminClient();

  let query = admin.from("live_chat_threads").select("*").order("last_message_at", { ascending: false }).limit(100);
  if (status !== "all") query = query.eq("status", status);

  const { data: threads, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = await enrichThreads(threads || []);
  return NextResponse.json({ threads: enriched });
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId, body } = await request.json();
  if (!threadId || !body?.trim()) {
    return NextResponse.json({ error: "threadId and body required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: thread } = await admin
    .from("live_chat_threads")
    .select("id, status")
    .eq("id", threadId)
    .maybeSingle();

  if (!thread || thread.status !== "open") {
    return NextResponse.json({ error: "Thread not found or closed" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { data: message, error } = await admin
    .from("live_chat_messages")
    .insert({
      thread_id: threadId,
      sender_type: "admin",
      sender_member_id: null,
      sender_name: "Admin",
      body: body.trim(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin
    .from("live_chat_threads")
    .update({ last_message_at: now, updated_at: now })
    .eq("id", threadId);

  return NextResponse.json({ message });
}
