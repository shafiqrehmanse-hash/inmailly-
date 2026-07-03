import { NextRequest, NextResponse } from "next/server";
import { getOutreachEligibleMember } from "@/lib/team-auth-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAdminLeadNote } from "@/lib/email";

const VALID_STATUSES = new Set([
  "new",
  "contacted",
  "replied",
  "interested",
  "not_interested",
  "follow_up",
  "closed",
  "dead",
]);

function buildName(first?: string, last?: string, full?: string) {
  const combined = full?.trim() || [first?.trim(), last?.trim()].filter(Boolean).join(" ").trim();
  return combined;
}

export async function GET() {
  const member = await getOutreachEligibleMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("leads")
    .select("*")
    .eq("member_id", member.id)
    .is("project_id", null)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ leads: data || [], member });
}

export async function POST(request: NextRequest) {
  const member = await getOutreachEligibleMember();
  if (!member) {
    return NextResponse.json(
      { error: "Not logged in or email not verified. Log in at /team/login after verifying your email." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const name = buildName(body.first_name, body.last_name, body.name);
  if (!name) {
    return NextResponse.json({ error: "Lead name is required." }, { status: 400 });
  }

  const status = body.status && VALID_STATUSES.has(body.status) ? body.status : "new";

  const admin = createAdminClient();
  const { data: lead, error } = await admin
    .from("leads")
    .insert({
      member_id: member.id,
      project_id: null,
      visible_to_client: false,
      name,
      profile_url: body.profile_url?.trim() || null,
      company: body.company?.trim() || null,
      position: body.position?.trim() || null,
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      status,
      notes: body.notes?.trim() || null,
      source_link_id: body.source_link_id || null,
    })
    .select("*")
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: error?.message || "Could not save lead" }, { status: 400 });
  }

  const note = typeof lead.notes === "string" ? lead.notes.trim() : "";
  if (note) {
    void notifyAdminLeadNote({
      leadName: lead.name,
      note,
      memberName: member.name,
      status: lead.status,
      profileUrl: lead.profile_url,
      company: lead.company,
    });
  }

  return NextResponse.json({ lead });
}

export async function PATCH(request: NextRequest) {
  const member = await getOutreachEligibleMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...updates } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("leads")
    .select("id, name, notes, status, profile_url, company")
    .eq("id", id)
    .eq("member_id", member.id)
    .is("project_id", null)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.status && VALID_STATUSES.has(updates.status)) patch.status = updates.status;
  if (updates.notes !== undefined) patch.notes = updates.notes;
  if (updates.name !== undefined) patch.name = updates.name?.trim() || existing.name;
  if (updates.profile_url !== undefined) patch.profile_url = updates.profile_url;
  if (updates.company !== undefined) patch.company = updates.company;
  if (updates.position !== undefined) patch.position = updates.position;
  if (updates.email !== undefined) patch.email = updates.email;
  if (updates.phone !== undefined) patch.phone = updates.phone;
  if (updates.deal_closed !== undefined) {
    patch.deal_closed = Boolean(updates.deal_closed);
    patch.closed_at = updates.deal_closed ? new Date().toISOString() : null;
  }

  const { data, error } = await admin.from("leads").update(patch).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (updates.notes !== undefined) {
    const nextNote = String(updates.notes ?? "").trim();
    const prevNote = (existing.notes || "").trim();
    if (nextNote && nextNote !== prevNote) {
      void notifyAdminLeadNote({
        leadName: (data?.name as string) || existing.name,
        note: nextNote,
        memberName: member.name,
        status: (data?.status as string) || existing.status,
        profileUrl: (data?.profile_url as string | null) ?? existing.profile_url,
        company: (data?.company as string | null) ?? existing.company,
      });
    }
  }

  return NextResponse.json({ lead: data });
}

export async function DELETE(request: NextRequest) {
  const member = await getOutreachEligibleMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("leads")
    .delete()
    .eq("id", id)
    .eq("member_id", member.id)
    .is("project_id", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
