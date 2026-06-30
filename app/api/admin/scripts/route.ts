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

  const admin = createAdminClient();
  const { data: keys } = await admin.from("settings").select("key, value").in("key", [
    "script_add_note",
    "script_inmail",
    "daily_script",
  ]);

  const map: Record<string, string> = {};
  for (const row of keys || []) map[row.key] = row.value || "";

  return NextResponse.json({
    add_note: map.script_add_note || map.daily_script || "",
    inmail: map.script_inmail || "",
  });
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { add_note, inmail } = await request.json();
  const admin = createAdminClient();
  const rows = [
    { key: "script_add_note", value: add_note || "" },
    { key: "script_inmail", value: inmail || "" },
    { key: "daily_script", value: add_note || "" },
  ];
  const { error } = await admin.from("settings").upsert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
