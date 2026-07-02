import { NextResponse } from "next/server";
import { getCurrentClient } from "@/lib/client-auth-server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const client = await getCurrentClient();
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: pendingRequest } = await admin
    .from("client_branding_requests")
    .select("*")
    .eq("client_id", client.id)
    .eq("status", "pending")
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let project = null;
  if (pendingRequest?.project_id) {
    const { data } = await admin
      .from("projects")
      .select(
        "id, name, inmail_package_size, inmail_subject, inmail_script, sales_nav_direct_link, sales_nav_link_count, branding_submitted_at"
      )
      .eq("id", pendingRequest.project_id)
      .maybeSingle();
    project = data;
  }

  const { data: latestSubmitted } = await admin
    .from("client_branding_requests")
    .select("*")
    .eq("client_id", client.id)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    pendingRequest,
    project,
    latestSubmitted,
    client: { id: client.id, name: client.name, email: client.email },
  });
}
