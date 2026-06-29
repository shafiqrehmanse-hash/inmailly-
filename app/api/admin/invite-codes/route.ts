import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { label, uses } = await request.json();
  const code = "INV-" + Math.random().toString(36).slice(2, 10).toUpperCase();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invite_codes")
    .insert({ code, label: label || "Generated", uses_left: uses || 10 })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ code: data });
}
