import { NextRequest, NextResponse } from "next/server";
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

  let query = admin
    .from("client_live_chat_threads")
    .select("*, clients(id, name, email, company_name)")
    .order("last_message_at", { ascending: false })
    .limit(100);
  if (status !== "all") query = query.eq("status", status);

  const { data: threads, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const list = threads || [];
  const ids = list.map((t) => t.id);
  const lastByThread: Record<string, string> = {};
  if (ids.length) {
    const { data: msgs } = await admin
      .from("client_live_chat_messages")
      .select("thread_id, body, created_at")
      .in("thread_id", ids)
      .order("created_at", { ascending: false });
    for (const m of msgs || []) {
      if (!lastByThread[m.thread_id]) lastByThread[m.thread_id] = m.body;
    }
  }

  return NextResponse.json({
    threads: list.map((t) => ({
      ...t,
      last_message: lastByThread[t.id] || null,
    })),
  });
}

export async function PATCH(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { threadId, status } = await request.json();
  if (!threadId || (status !== "open" && status !== "closed")) {
    return NextResponse.json({ error: "threadId and status required" }, { status: 400 });
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from("client_live_chat_threads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", threadId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
