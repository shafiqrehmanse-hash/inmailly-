import type { SupabaseClient } from "@supabase/supabase-js";

export type FollowupStepKind = "lead_reply" | "client_send";

export type ClientFollowupStep = {
  id: string;
  lead_id: string;
  kind: FollowupStepKind;
  body: string;
  created_at: string;
};

export async function loadFollowupStepsForLeads(admin: SupabaseClient, leadIds: string[]) {
  if (!leadIds.length) return new Map<string, ClientFollowupStep[]>();
  const { data, error } = await admin
    .from("client_followup_steps")
    .select("id, lead_id, kind, body, created_at")
    .in("lead_id", leadIds)
    .order("created_at", { ascending: true });

  const map = new Map<string, ClientFollowupStep[]>();
  if (error) return map;
  for (const row of data || []) {
    const list = map.get(row.lead_id) || [];
    list.push({
      id: row.id,
      lead_id: row.lead_id,
      kind: row.kind as FollowupStepKind,
      body: row.body,
      created_at: row.created_at,
    });
    map.set(row.lead_id, list);
  }
  return map;
}

export async function attachFollowupSequences<T extends { id: string }>(
  admin: SupabaseClient,
  rows: T[]
): Promise<(T & { followup_sequence: ClientFollowupStep[] })[]> {
  const map = await loadFollowupStepsForLeads(
    admin,
    rows.map((r) => r.id)
  );
  return rows.map((r) => ({
    ...r,
    followup_sequence: map.get(r.id) || [],
  }));
}

export async function insertFollowupStep(
  admin: SupabaseClient,
  opts: { leadId: string; projectId: string; kind: FollowupStepKind; body: string }
) {
  const { error } = await admin.from("client_followup_steps").insert({
    lead_id: opts.leadId,
    project_id: opts.projectId,
    kind: opts.kind,
    body: opts.body,
  });
  if (error) throw new Error(error.message);
}

/** First follow-up: add a client_send step if this lead has none yet; otherwise update the latest send. */
export async function upsertInitialClientSend(
  admin: SupabaseClient,
  opts: { leadId: string; projectId: string; body: string }
) {
  const { data: existing } = await admin
    .from("client_followup_steps")
    .select("id, kind")
    .eq("lead_id", opts.leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!existing) {
    await insertFollowupStep(admin, {
      leadId: opts.leadId,
      projectId: opts.projectId,
      kind: "client_send",
      body: opts.body,
    });
    return;
  }

  if (existing.kind === "client_send") {
    await admin.from("client_followup_steps").update({ body: opts.body }).eq("id", existing.id);
    return;
  }

  await insertFollowupStep(admin, {
    leadId: opts.leadId,
    projectId: opts.projectId,
    kind: "client_send",
    body: opts.body,
  });
}

export async function appendLeadReplyAndNextSend(
  admin: SupabaseClient,
  opts: { leadId: string; projectId: string; leadReply: string; nextFollowup: string }
) {
  await insertFollowupStep(admin, {
    leadId: opts.leadId,
    projectId: opts.projectId,
    kind: "lead_reply",
    body: opts.leadReply,
  });
  await insertFollowupStep(admin, {
    leadId: opts.leadId,
    projectId: opts.projectId,
    kind: "client_send",
    body: opts.nextFollowup,
  });
}
