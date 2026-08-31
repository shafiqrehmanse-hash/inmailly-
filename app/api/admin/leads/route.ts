import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";
import { processLeadVictories } from "@/lib/lead-victory";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

function searchPattern(raw: string | null) {
  if (!raw) return null;
  const cleaned = raw
    .trim()
    .replace(/[%*,()]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 120);
  if (cleaned.length < 2) return null;
  return `%${cleaned}%`;
}

async function enrichLeadsWithSource(
  admin: ReturnType<typeof createAdminClient>,
  rows: Record<string, unknown>[]
) {
  const sourceIds = Array.from(
    new Set(
      rows
        .map((r) => r.source_link_id as string | null)
        .filter((id): id is string => Boolean(id))
    )
  );
  if (!sourceIds.length) {
    return rows.map((r) => ({ ...r, source: null }));
  }

  const { data: links } = await admin
    .from("outreach_links")
    .select("id, url, smart_label, batch_name, member_id, used_by_member_id, added_by, first_name, last_name")
    .in("id", sourceIds);

  const linkById = new Map((links || []).map((l) => [l.id, l]));
  const extraIds = new Set<string>();
  for (const l of links || []) {
    if (l.member_id) extraIds.add(l.member_id);
    if (l.used_by_member_id) extraIds.add(l.used_by_member_id);
  }

  const nameById = new Map<string, string>();
  if (extraIds.size) {
    const { data: extra } = await admin
      .from("team_members")
      .select("id, name")
      .in("id", Array.from(extraIds));
    for (const m of extra || []) nameById.set(m.id, m.name);
  }

  return rows.map((r) => {
    const link = r.source_link_id ? linkById.get(r.source_link_id as string) : null;
    if (!link) return { ...r, source: null };
    const profileName = [link.first_name, link.last_name].filter(Boolean).join(" ").trim();
    return {
      ...r,
      source: {
        url: link.url || null,
        label: link.smart_label || null,
        batch: link.batch_name || null,
        assignedTo: link.member_id ? nameById.get(link.member_id) || null : null,
        usedBy: link.used_by_member_id ? nameById.get(link.used_by_member_id) || null : null,
        addedBy: link.added_by || null,
        profileName: profileName || null,
      },
    };
  });
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
  const q = searchPattern(request.nextUrl.searchParams.get("q"));
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

  if (q) {
    const [{ data: matchingLinks }, { data: matchingMembers }] = await Promise.all([
      admin
        .from("outreach_links")
        .select("id")
        .or(
          `url.ilike."${q}",smart_label.ilike."${q}",first_name.ilike."${q}",last_name.ilike."${q}",batch_name.ilike."${q}"`
        )
        .limit(200),
      admin.from("team_members").select("id").or(`name.ilike."${q}",email.ilike."${q}"`).limit(100),
    ]);
    const linkIds = (matchingLinks || []).map((l) => l.id);
    const memberIds = (matchingMembers || []).map((m) => m.id);
    const parts = [
      `name.ilike."${q}"`,
      `email.ilike."${q}"`,
      `company.ilike."${q}"`,
      `profile_url.ilike."${q}"`,
      `notes.ilike."${q}"`,
    ];
    if (linkIds.length) parts.push(`source_link_id.in.(${linkIds.join(",")})`);
    if (memberIds.length) parts.push(`member_id.in.(${memberIds.join(",")})`);
    query = query.or(parts.join(","));
  }

  const { data, count, error } = await query.range(from, to);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = count || 0;
  const leads = await enrichLeadsWithSource(admin, (data || []) as Record<string, unknown>[]);
  return NextResponse.json({
    leads,
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
    .select("id, name, status, deal_closed, member_id, team_members(name, email)")
    .eq("id", lead_id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status !== undefined) {
    const allowed = new Set([
      "new",
      "contacted",
      "replied",
      "interested",
      "meeting_booked",
      "not_interested",
      "follow_up",
      "closed",
      "dead",
    ]);
    if (allowed.has(status)) updates.status = status;
  }
  if (notes !== undefined) updates.notes = notes;
  if (deal_closed !== undefined) {
    updates.deal_closed = deal_closed;
    updates.closed_at = deal_closed ? new Date().toISOString() : null;
    if (deal_closed) updates.status = "closed";
  }

  const { data, error } = await admin.from("leads").update(updates).eq("id", lead_id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let celebration = null;
  if (data && existing.member_id) {
    const tm = existing.team_members as
      | { name?: string; email?: string }
      | { name?: string; email?: string }[]
      | null;
    const memberRow = Array.isArray(tm) ? tm[0] : tm;
    celebration = await processLeadVictories({
      existing: {
        deal_closed: existing.deal_closed,
        status: existing.status,
        name: existing.name,
      },
      data: data as { name: string; status: string; deal_closed?: boolean },
      member: {
        id: existing.member_id,
        name: memberRow?.name || "Champion",
        email: memberRow?.email || "",
      },
      updates: { deal_closed, status },
    });
  }

  return NextResponse.json({ lead: data, celebration });
}
