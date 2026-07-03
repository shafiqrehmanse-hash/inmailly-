import { NextRequest, NextResponse } from "next/server";
import { importClientProfileLinks } from "@/lib/client-branding";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: project } = await admin
    .from("projects")
    .select("name, clients(name, company_name)")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 400 });
  }

  const rawClient = project.clients as { name: string; company_name: string | null } | { name: string; company_name: string | null }[] | null;
  const clientRow = Array.isArray(rawClient) ? rawClient[0] : rawClient;
  const label = clientRow?.company_name || clientRow?.name || "Client";
  const batchLabel = `${label} — ${project.name}`.slice(0, 120);

  try {
    const result = await importClientProfileLinks(admin, projectId, batchLabel);
    return NextResponse.json({
      success: true,
      inserted: result.inserted,
      parsed: result.parsed,
      totalImported: result.totalImported,
      batchLabel,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
