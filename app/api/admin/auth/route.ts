import { NextRequest, NextResponse } from "next/server";
import { verifyAdminKey } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const { key } = await request.json();
  if (!verifyAdminKey(key)) {
    return NextResponse.json({ error: "Invalid secret key" }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_authed", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_authed", "", { httpOnly: true, maxAge: 0, path: "/" });
  return response;
}
