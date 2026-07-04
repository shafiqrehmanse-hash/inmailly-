import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";
import { notifyTeamDealClosed } from "@/lib/email";
import { dealClosedCelebrationMessage } from "@/lib/deal-celebration";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const memberId = request.nextUrl.searchParams.get("memberId");
  const status = request.nextUrl.searchParams.get("status");
  const scope = request.nextUrl.searchParams.get("scope") || "outreach";
  const closedOnly = request.nextUrl.searchParams.get("closedOnly") === "1";
  const projectId = request.nextUrl.searchParams.get("projectId");
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") || "10", 10) || 10));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const admin = createAdminClient();
  let query = admin
    .from("leads")
    .select("*, team_members(name, email), projects(id, name, client_id, clients(name, company_name))", {
      count: "exact",
    })
    .order("updated_at", { ascending: false });

  if (scope === "campaign") {
    query = query.not("project_id", "is", null);
    if (projectId) query = query.eq("project_id", projectId);
  } else {
    query = query.is("project_id", null);
  }

  if (memberId && memberId !== "all") query = query.eq("member_id", memberId);
  if (status && status !== "all") query = query.eq("status", status);
  if (closedOnly) query = query.eq("deal_closed", true);

  const { data, count, error } = await query.range(from, to);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = count || 0;
  return NextResponse.json({
    leads: data || [],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}

export async function PATCH(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { lead_id, status, deal_closed, notes } = body as {
    lead_id?: string;
    status?: string;
    deal_closed?: boolean;
    notes?: string;
  };
  if (!lead_id) return NextResponse.json({ error: "lead_id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("leads")
    .select("id, name, deal_closed, member_id, team_members(name, email)")
    .eq("id", lead_id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status !== undefined) updates.status = status;
  if (notes !== undefined) updates.notes = notes;
  if (deal_closed !== undefined) {
    updates.deal_closed = deal_closed;
    updates.closed_at = deal_closed ? new Date().toISOString() : null;
    if (deal_closed) updates.status = "closed";
  }

  const { data, error } = await admin.from("leads").update(updates).eq("id", lead_id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let celebration = null;
  const newlyClosed = deal_closed === true && !existing.deal_closed;
  if (newlyClosed && data) {
    const tm = existing.team_members as
      | { name?: string; email?: string }
      | { name?: string; email?: string }[]
      | null;
    const member = Array.isArray(tm) ? tm[0] : tm;
    const memberName = member?.name || "Champion";
    celebration = dealClosedCelebrationMessage(data.name, memberName);
    if (member?.email) {
      void notifyTeamDealClosed({
        email: member.email,
        memberName,
        leadName: data.name,
        message: celebration.message,
      });
    }
  }

  return NextResponse.json({ lead: data, celebration });
}
