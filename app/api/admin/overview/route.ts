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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { count: members },
    { count: clients },
    { count: projectsTotal },
    { count: projectsActive },
    { count: projectsPreview },
    { count: available },
    { count: claimed },
    { count: used },
    { count: leads },
    { count: outreachLeads },
    { count: campaignLeads },
    { count: deals },
    { count: todayLinks },
    { count: todayLeads },
    { data: selfSignupClients },
  ] = await Promise.all([
    admin.from("team_members").select("*", { count: "exact", head: true }),
    admin.from("clients").select("*", { count: "exact", head: true }).eq("is_active", true),
    admin.from("projects").select("*", { count: "exact", head: true }),
    admin.from("projects").select("*", { count: "exact", head: true }).eq("status", "active"),
    admin.from("projects").select("*", { count: "exact", head: true }).in("status", ["preview", "draft"]),
    admin.from("outreach_links").select("*", { count: "exact", head: true }).eq("status", "available"),
    admin.from("outreach_links").select("*", { count: "exact", head: true }).eq("status", "claimed"),
    admin.from("outreach_links").select("*", { count: "exact", head: true }).eq("status", "used"),
    admin.from("leads").select("*", { count: "exact", head: true }),
    admin.from("leads").select("*", { count: "exact", head: true }).is("project_id", null),
    admin.from("leads").select("*", { count: "exact", head: true }).not("project_id", "is", null),
    admin.from("leads").select("*", { count: "exact", head: true }).eq("deal_closed", true),
    admin.from("outreach_links").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
    admin.from("leads").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
    admin
      .from("clients")
      .select("id, projects(id, status, inmail_package_size, project_assignments(id))")
      .eq("signup_source", "self")
      .eq("is_active", true),
  ]);

  let needsSetup = 0;
  for (const client of selfSignupClients || []) {
    const projectRows = Array.isArray(client.projects) ? client.projects : [];
    const latest = projectRows[0];
    if (!latest) {
      needsSetup += 1;
      continue;
    }
    const assignees = Array.isArray(latest.project_assignments) ? latest.project_assignments.length : 0;
    const ready =
      latest.status === "active" && assignees > 0 && Boolean(latest.inmail_package_size);
    if (!ready) needsSetup += 1;
  }

  return NextResponse.json({
    members: members || 0,
    clients: clients || 0,
    projects: {
      total: projectsTotal || 0,
      active: projectsActive || 0,
      preview: projectsPreview || 0,
      needs_setup: needsSetup,
    },
    links: { available: available || 0, claimed: claimed || 0, used: used || 0 },
    leads: leads || 0,
    outreachLeads: outreachLeads || 0,
    campaignLeads: campaignLeads || 0,
    deals: deals || 0,
    today: { links: todayLinks || 0, leads: todayLeads || 0 },
  });
}
