import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAdminContact } from "@/lib/email";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, company, volume, message } = body;

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("contact_requests").insert({
    name: name.trim(),
    email: email.trim(),
    company: company?.trim() || null,
    volume: volume || null,
    message: message?.trim() || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  void notifyAdminContact({
    name: name.trim(),
    email: email.trim(),
    company: company?.trim() || null,
    volume: volume || null,
    message: message?.trim() || null,
  });

  return NextResponse.json({ ok: true });
}
