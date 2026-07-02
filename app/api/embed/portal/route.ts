import { NextRequest, NextResponse } from "next/server";
import { fetchEmbedPortalByToken } from "@/lib/embed-portal-server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const data = await fetchEmbedPortalByToken(admin, token);
  if (!data) {
    return NextResponse.json({ error: "Embed not found or not enabled" }, { status: 404 });
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "private, max-age=30",
    },
  });
}
