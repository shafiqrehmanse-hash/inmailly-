import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export async function signedProofUrls(
  admin: AdminClient,
  rows: { id: string; display_path: string; created_at: string }[]
) {
  if (!rows.length) return [];

  const paths = rows.map((r) => r.display_path).filter(Boolean);
  const { data: signed } = await admin.storage.from("proof-screenshots").createSignedUrls(paths, 3600);
  const urlByPath = new Map(
    (signed || []).map((entry, index) => [paths[index], entry.signedUrl || null])
  );

  return rows.map((p) => ({
    id: p.id,
    image_url: urlByPath.get(p.display_path) || null,
    created_at: p.created_at,
  }));
}
