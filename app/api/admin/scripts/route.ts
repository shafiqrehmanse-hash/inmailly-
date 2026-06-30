import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";
import { parseScriptParts } from "@/lib/scripts";

const SCRIPT_KEYS = [
  "script_add_note",
  "script_inmail",
  "script_inmail_subject",
  "script_inmail_body",
  "daily_script",
] as const;

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: keys } = await admin.from("settings").select("key, value").in("key", [...SCRIPT_KEYS]);

  const map: Record<string, string> = {};
  for (const row of keys || []) map[row.key] = row.value || "";

  let inmailSubject = map.script_inmail_subject || "";
  let inmailBody = map.script_inmail_body || "";
  const legacyInmail = map.script_inmail || "";

  if (!inmailSubject && !inmailBody && legacyInmail) {
    const parts = parseScriptParts(legacyInmail);
    inmailSubject = parts.subject;
    inmailBody = parts.body;
  }

  return NextResponse.json({
    add_note: map.script_add_note || map.daily_script || "",
    inmail: legacyInmail,
    inmail_subject: inmailSubject,
    inmail_body: inmailBody,
  });
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { add_note, inmail_subject, inmail_body } = await request.json();
  const subject = (inmail_subject || "").trim();
  const body = (inmail_body || "").trim();
  const legacyInmail = subject ? `Subject: ${subject}\n\n${body}` : body;

  const admin = createAdminClient();
  const rows = [
    { key: "script_add_note", value: add_note || "" },
    { key: "script_inmail_subject", value: subject },
    { key: "script_inmail_body", value: body },
    { key: "script_inmail", value: legacyInmail },
    { key: "daily_script", value: add_note || "" },
  ];
  const { error } = await admin.from("settings").upsert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
