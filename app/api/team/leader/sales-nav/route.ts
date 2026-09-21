import { NextResponse } from "next/server";
import { enrichSalesNavRequests, stripActivationKey } from "@/lib/sales-nav-requests";
import { isLeaderResponse, requireTeamLeader } from "@/lib/team-leader-auth";
import { getLeaderAssignedWorkerIds } from "@/lib/team-leader-scope";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SalesNavLicenseRequest } from "@/lib/types";

export async function GET(request: Request) {
  const leader = await requireTeamLeader();
  if (isLeaderResponse(leader)) return leader;

  const admin = createAdminClient();
  const { data: flags, error: flagError } = await admin
    .from("team_members")
    .select("sales_nav_agent")
    .eq("id", leader.id)
    .maybeSingle();

  if (flagError) {
    return NextResponse.json(
      {
        error: flagError.message.includes("sales_nav_agent")
          ? "Run migration 039_sales_nav_agent.sql in Supabase first."
          : flagError.message,
      },
      { status: 500 }
    );
  }

  if (!flags?.sales_nav_agent) {
    return NextResponse.json({ error: "Sales Navigator access is not enabled for you yet." }, { status: 403 });
  }

  const workerIds = await getLeaderAssignedWorkerIds(leader.id);
  if (!workerIds.length) {
    return NextResponse.json({ requests: [], agentEnabled: true });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  let query = admin
    .from("sales_nav_license_requests")
    .select("*")
    .in("member_id", workerIds)
    .order("requested_at", { ascending: false })
    .limit(200);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = await enrichSalesNavRequests((data || []) as SalesNavLicenseRequest[]);
  return NextResponse.json({
    requests: enriched.map(stripActivationKey),
    agentEnabled: true,
  });
}
