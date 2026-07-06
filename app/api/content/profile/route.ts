import { NextRequest, NextResponse } from "next/server";
import { getContentManagerMember } from "@/lib/content-auth-server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: NextRequest) {
  const member = await getContentManagerMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const authorTitle = typeof body.author_title === "string" ? body.author_title.trim() : null;
  const authorBio = typeof body.author_bio === "string" ? body.author_bio.trim() : null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("team_members")
    .update({
      author_title: authorTitle || null,
      author_bio: authorBio || null,
    })
    .eq("id", member.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member: data });
}
