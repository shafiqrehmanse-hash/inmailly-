import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { growAccountsAssignedEmail } from "@/lib/email-templates";
import { countGrowUsedToday, GROW_DAILY_USED_CAP, isGrowEligibleRole, remainingGrowToday } from "@/lib/grow-profiles";
import { parseNamedLinksFromPaste, urlKey } from "@/lib/links";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

function displayName(first: string, last: string) {
  return `${first} ${last}`.trim();
}

export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const [{ data: profiles, error: pErr }, { data: assignments, error: aErr }, { data: people }] =
    await Promise.all([
      admin.from("grow_profiles").select("*").order("created_at", { ascending: false }),
      admin.from("grow_assignments").select("id, profile_id, member_id, status, used_at, assigned_at"),
      admin.from("team_members").select("id, name, email"),
    ]);

  if (pErr) {
    return NextResponse.json(
      {
        error: pErr.message.includes("grow_profiles")
          ? "Run migration 037_grow_profiles.sql in Supabase first."
          : pErr.message,
      },
      { status: 500 }
    );
  }
  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

  const peopleById = new Map((people || []).map((m) => [m.id, m]));

  const byProfile = new Map<
    string,
    { assigned: number; used: number; members: { name: string; email: string; status: string; used_at: string | null }[] }
  >();

  for (const row of assignments || []) {
    const cur = byProfile.get(row.profile_id) || { assigned: 0, used: 0, members: [] };
    cur.assigned += 1;
    if (row.status === "used") cur.used += 1;
    const member = peopleById.get(row.member_id);
    cur.members.push({
      name: member?.name || "Member",
      email: member?.email || "",
      status: row.status,
      used_at: row.used_at,
    });
    byProfile.set(row.profile_id, cur);
  }

  return NextResponse.json({
    cap: GROW_DAILY_USED_CAP,
    profiles: (profiles || []).map((p) => {
      const stats = byProfile.get(p.id) || { assigned: 0, used: 0, members: [] };
      return {
        ...p,
        assigned_count: stats.assigned,
        used_count: stats.used,
        members: stats.members,
      };
    }),
  });
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const paste = String(body.paste || "");
  const memberIds: string[] = Array.isArray(body.member_ids) ? body.member_ids.map(String) : [];
  const sendToAllActive = Boolean(body.send_to_all_active);
  const batchName = String(body.batch_name || "").trim() || null;

  const parsed = parseNamedLinksFromPaste(paste);
  if (!parsed.length) {
    return NextResponse.json(
      { error: "Add first name, last name, and LinkedIn URL (one profile per line)." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  let membersQuery = admin
    .from("team_members")
    .select("id, name, email, role, is_active")
    .eq("is_active", true);
  if (!sendToAllActive) {
    if (!memberIds.length) {
      return NextResponse.json({ error: "Select at least one active team member." }, { status: 400 });
    }
    membersQuery = membersQuery.in("id", memberIds);
  }

  const { data: members, error: mErr } = await membersQuery;
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

  const eligible = (members || []).filter((m) => isGrowEligibleRole(m.role));
  if (!eligible.length) {
    return NextResponse.json({ error: "No active outreach members selected." }, { status: 400 });
  }

  const skippedCap: string[] = [];
  const recipients: typeof eligible = [];
  for (const m of eligible) {
    const used = await countGrowUsedToday(m.id);
    if (remainingGrowToday(used) <= 0) skippedCap.push(m.name);
    else recipients.push(m);
  }

  if (!recipients.length) {
    return NextResponse.json(
      {
        error: `Everyone selected already used ${GROW_DAILY_USED_CAP} grow links today. Try again tomorrow.`,
        skippedCap,
      },
      { status: 400 }
    );
  }

  const upsertRows = parsed.map((r) => ({
    first_name: r.first_name,
    last_name: r.last_name || "",
    profile_url: r.url,
    url_key: r.key || urlKey(r.url),
    batch_name: batchName,
    is_active: true,
  }));

  const { data: savedProfiles, error: upErr } = await admin
    .from("grow_profiles")
    .upsert(upsertRows, { onConflict: "url_key" })
    .select("id, first_name, last_name, url_key");

  if (upErr) {
    return NextResponse.json(
      {
        error: upErr.message.includes("grow_profiles")
          ? "Run migration 037_grow_profiles.sql in Supabase first."
          : upErr.message,
      },
      { status: 500 }
    );
  }

  const profiles = savedProfiles || [];
  if (!profiles.length) {
    return NextResponse.json({ error: "Could not save profiles." }, { status: 500 });
  }

  const { data: sendRow, error: sErr } = await admin
    .from("grow_sends")
    .insert({
      batch_name: batchName,
      profile_count: profiles.length,
      member_count: recipients.length,
    })
    .select("id")
    .single();
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

  const assignmentRows = recipients.flatMap((m) =>
    profiles.map((p) => ({
      send_id: sendRow.id,
      profile_id: p.id,
      member_id: m.id,
      status: "pending" as const,
    }))
  );

  const { data: inserted, error: aErr } = await admin
    .from("grow_assignments")
    .upsert(assignmentRows, {
      onConflict: "profile_id,member_id",
      ignoreDuplicates: true,
    })
    .select("id, member_id");
  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

  const previewNames = profiles.map((p) => displayName(p.first_name, p.last_name));
  let emailed = 0;
  const emailFails: string[] = [];

  for (const m of recipients) {
    if (!m.email) continue;
    const result = await sendEmail({
      to: m.email,
      subject: `Grow our accounts — ${profiles.length} connection request${profiles.length === 1 ? "" : "s"} waiting`,
      html: growAccountsAssignedEmail({
        memberName: m.name,
        profileCount: profiles.length,
        previewNames,
      }),
      text: `Hi ${m.name.split(" ")[0] || "there"},\n\nOpen Grow accounts in your InMailly dashboard and send connection requests to ${profiles.length} of our LinkedIn profiles. Mark used after you send. Max ${GROW_DAILY_USED_CAP} per day.\n\nhttps://www.inmailly.com/team/grow`,
    });
    if (result.ok) emailed += 1;
    else emailFails.push(m.name);
  }

  return NextResponse.json({
    success: true,
    profiles: profiles.length,
    members: recipients.length,
    emailed,
    assignedNew: inserted?.length || 0,
    skippedCap,
    emailFails,
    cap: GROW_DAILY_USED_CAP,
  });
}

export async function DELETE(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const profileId = String(body.profileId || "");
  if (!profileId) return NextResponse.json({ error: "profileId required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("grow_profiles").delete().eq("id", profileId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
