import { NextResponse } from "next/server";
import { defaultInfoDocForm, type InfoDocForm } from "@/lib/info-doc";
import { getMemberInfoDocStats } from "@/lib/info-doc-stats";
import { getCurrentMember } from "@/lib/team";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const email = member.email.toLowerCase();
  const memberFilter = `member_id.eq.${member.id},employee_email.eq.${email}`;

  const [{ data: pending }, { data: latestSubmitted }] = await Promise.all([
    admin
      .from("employee_info_docs")
      .select("*")
      .or(memberFilter)
      .eq("status", "pending_fill")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("employee_info_docs")
      .select("*")
      .or(memberFilter)
      .in("status", ["submitted", "reviewed"])
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const stats = await getMemberInfoDocStats(member.id);

  const draftForm: InfoDocForm = pending
    ? { ...defaultInfoDocForm(), ...(pending.form_data as Partial<InfoDocForm>) }
    : defaultInfoDocForm();

  return NextResponse.json({
    pendingDoc: pending,
    latestSubmitted,
    stats,
    draftForm,
    member: { id: member.id, name: member.name, email: member.email },
  });
}
