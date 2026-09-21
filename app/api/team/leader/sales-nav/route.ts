import { NextResponse } from "next/server";
import { enrichSalesNavRequests, stripActivationKey } from "@/lib/sales-nav-requests";
import { isLeaderResponse, requireTeamLeader } from "@/lib/team-leader-auth";
import { getLeaderAssignedWorkerIds, leaderOwnsMember } from "@/lib/team-leader-scope";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SalesNavLeaderReview, SalesNavLicenseRequest } from "@/lib/types";

async function requireSalesNavLeader() {
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

  return leader;
}

export async function GET(request: Request) {
  const leader = await requireSalesNavLeader();
  if (isLeaderResponse(leader)) return leader;

  const workerIds = await getLeaderAssignedWorkerIds(leader.id);
  if (!workerIds.length) {
    return NextResponse.json({ requests: [], agentEnabled: true });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const admin = createAdminClient();

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

export async function PATCH(request: Request) {
  const leader = await requireSalesNavLeader();
  if (isLeaderResponse(leader)) return leader;

  const body = await request.json();
  const requestId = typeof body.requestId === "string" ? body.requestId : "";
  const review = body.review as SalesNavLeaderReview;
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";

  if (!requestId || !["pending", "approved", "not_eligible"].includes(review)) {
    return NextResponse.json({ error: "requestId and a valid review are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("sales_nav_license_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (!row) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  const owns = await leaderOwnsMember(leader.id, row.member_id);
  if (!owns) {
    return NextResponse.json({ error: "This member is not on your team" }, { status: 403 });
  }

  if (row.status !== "pending" && row.status !== "error") {
    return NextResponse.json(
      { error: "You can only approve or cross out pending or error requests" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await admin
    .from("sales_nav_license_requests")
    .update({
      leader_review: review,
      leader_reviewed_at: review === "pending" ? null : now,
      leader_reviewed_by: review === "pending" ? null : leader.id,
      leader_review_note: review === "not_eligible" ? note || "Not eligible" : null,
      updated_at: now,
    })
    .eq("id", requestId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      {
        error: error.message.includes("leader_review")
          ? "Run migration 040_sales_nav_leader_review.sql in Supabase first."
          : error.message,
      },
      { status: 500 }
    );
  }

  const [enriched] = await enrichSalesNavRequests([updated as SalesNavLicenseRequest]);
  return NextResponse.json({ request: stripActivationKey(enriched) });
}
