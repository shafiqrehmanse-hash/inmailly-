import { NextRequest, NextResponse } from "next/server";
import { assertProjectAccess } from "@/lib/campaign-auth-server";
import { getClientEmailForProject, notifyClientNewResponse } from "@/lib/email";
import { createServerSupabase } from "@/lib/supabase/server";

async function canAccessProject(userId: string, projectId: string) {
  const supabase = createServerSupabase();
  const { data: member } = await supabase
    .from("team_members")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!member) return false;
  return assertProjectAccess(member.id, projectId);
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { project_id, lead_name, preview } = body;
  if (!project_id || !lead_name?.trim()) {
    return NextResponse.json({ error: "project_id and lead_name required" }, { status: 400 });
  }

  if (!(await canAccessProject(user.id, project_id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = await getClientEmailForProject(project_id);
  if (client.email) {
    await notifyClientNewResponse({
      email: client.email,
      clientName: client.clientName,
      projectName: client.projectName,
      leadName: lead_name.trim(),
      preview: preview?.trim() || null,
    });
  }

  return NextResponse.json({ ok: true, notified: Boolean(client.email) });
}
