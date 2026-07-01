import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getOutreachTeamMember } from "@/lib/team-auth-server";

export async function GET() {
  const member = await getOutreachTeamMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("team_tasks")
    .select("*")
    .eq("assigned_to", member.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data || [] });
}

export async function PATCH(request: NextRequest) {
  const member = await getOutreachTeamMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId, status } = await request.json();
  if (!taskId || !status) {
    return NextResponse.json({ error: "taskId and status required" }, { status: 400 });
  }
  if (!["pending", "in_progress", "done"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("team_tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("assigned_to", member.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}
