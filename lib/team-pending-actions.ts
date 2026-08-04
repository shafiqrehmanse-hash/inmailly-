import { createAdminClient } from "@/lib/supabase/admin";

function memberEmail(email: string) {
  return email.trim().toLowerCase();
}

function memberOrEmailFilter(memberId: string, email: string) {
  return `member_id.eq.${memberId},candidate_email.eq.${memberEmail(email)}`;
}

/** Latest pending employment offer for this member (by id or login email). */
export async function getPendingContractForMember(member: { id: string; email: string }) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("employment_contracts")
    .select("id, reference_no, status, form_data")
    .eq("status", "pending_signature")
    .or(memberOrEmailFilter(member.id, member.email))
    .order("created_at", { ascending: false })
    .limit(1);

  return data?.[0] ?? null;
}

/** Latest pending employee info doc for this member. */
export async function getPendingInfoDocForMember(member: { id: string; email: string }) {
  const admin = createAdminClient();
  const email = memberEmail(member.email);
  const { data } = await admin
    .from("employee_info_docs")
    .select("id, status")
    .eq("status", "pending_fill")
    .or(`member_id.eq.${member.id},employee_email.eq.${email}`)
    .order("created_at", { ascending: false })
    .limit(1);

  return data?.[0] ?? null;
}
