import { NextRequest, NextResponse } from "next/server";
import { assertProjectAccess, getCampaignMember } from "@/lib/campaign-auth-server";
import { getClientEmailForProject, notifyClientSendProof } from "@/lib/email";
import { processProofScreenshot } from "@/lib/proof-crop";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

const BUCKET = "proof-screenshots";
const SIGNED_TTL = 3600;

async function signedUrl(path: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

async function attachUrls<T extends { original_path: string; display_path: string }>(
  rows: T[],
  includeOriginal = true
) {
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      display_url: await signedUrl(row.display_path),
      original_url: includeOriginal ? await signedUrl(row.original_path) : null,
    }))
  );
}

export async function GET(request: NextRequest) {
  const member = await getCampaignMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  if (!(await assertProjectAccess(member.id, projectId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("send_proofs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const proofs = await attachUrls(data || []);
  return NextResponse.json({ proofs });
}

export async function POST(request: NextRequest) {
  const member = await getCampaignMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const projectId = form.get("projectId") as string;
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  if (!(await assertProjectAccess(member.id, projectId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: "No images provided" }, { status: 400 });

  const admin = createAdminClient();
  const uploaded: unknown[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      errors.push(`${file.name}: not an image`);
      continue;
    }
    if (file.size > 15 * 1024 * 1024) {
      errors.push(`${file.name}: too large (max 15MB)`);
      continue;
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const { original, display } = await processProofScreenshot(buffer);
      const proofId = crypto.randomUUID();
      const originalPath = `${projectId}/${proofId}/original.jpg`;
      const displayPath = `${projectId}/${proofId}/display.jpg`;

      const up1 = await admin.storage.from(BUCKET).upload(originalPath, original, {
        contentType: "image/jpeg",
        upsert: false,
      });
      if (up1.error) throw new Error(up1.error.message);

      const up2 = await admin.storage.from(BUCKET).upload(displayPath, display, {
        contentType: "image/jpeg",
        upsert: false,
      });
      if (up2.error) {
        await admin.storage.from(BUCKET).remove([originalPath]);
        throw new Error(up2.error.message);
      }

      const { data: row, error: dbError } = await admin
        .from("send_proofs")
        .insert({
          id: proofId,
          project_id: projectId,
          uploaded_by: member.id,
          original_path: originalPath,
          display_path: displayPath,
          visible_to_client: true,
        })
        .select("*")
        .single();

      if (dbError) {
        await admin.storage.from(BUCKET).remove([originalPath, displayPath]);
        throw new Error(dbError.message);
      }

      const [withUrls] = await attachUrls([row]);
      uploaded.push(withUrls);
    } catch (e) {
      errors.push(`${file.name}: ${e instanceof Error ? e.message : "upload failed"}`);
    }
  }

  if (uploaded.length > 0) {
    const client = await getClientEmailForProject(projectId);
    if (client.email) {
      void notifyClientSendProof({
        email: client.email,
        clientName: client.clientName,
        projectName: client.projectName,
        count: uploaded.length,
      });
    }
  }

  return NextResponse.json({
    uploaded,
    errors,
    count: uploaded.length,
  });
}

export async function PATCH(request: NextRequest) {
  const member = await getCampaignMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, visible_to_client } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = createServerSupabase();
  const { data: proof } = await supabase.from("send_proofs").select("project_id").eq("id", id).single();
  if (!proof || !(await assertProjectAccess(member.id, proof.project_id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("send_proofs")
    .update({ visible_to_client: Boolean(visible_to_client) })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const member = await getCampaignMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: proof } = await admin
    .from("send_proofs")
    .select("*")
    .eq("id", id)
    .single();

  if (!proof || proof.uploaded_by !== member.id) {
    if (!proof || !(await assertProjectAccess(member.id, proof.project_id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await admin.storage.from(BUCKET).remove([proof.original_path, proof.display_path]);
  await admin.from("send_proofs").delete().eq("id", id);

  return NextResponse.json({ success: true });
}
