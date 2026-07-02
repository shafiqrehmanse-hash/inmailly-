import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export type BrandingRequestStatus = "pending" | "submitted";

export type ClientBrandingRequestRow = {
  id: string;
  client_id: string;
  project_id: string;
  status: BrandingRequestStatus;
  package_size: number | null;
  requested_at: string;
  submitted_at: string | null;
};

export type ProjectBrandingFields = {
  inmail_subject: string | null;
  inmail_script: string | null;
  sales_nav_direct_link: string | null;
  sales_nav_link_count: number | null;
  branding_submitted_at: string | null;
  inmail_package_size: number | null;
};

/** Create or refresh a pending branding request for a project. */
export async function createBrandingRequest(
  admin: AdminClient,
  clientId: string,
  projectId: string,
  packageSize: number | null
) {
  await admin
    .from("client_branding_requests")
    .delete()
    .eq("project_id", projectId)
    .eq("status", "pending");

  const { data, error } = await admin
    .from("client_branding_requests")
    .insert({
      client_id: clientId,
      project_id: projectId,
      status: "pending",
      package_size: packageSize,
      requested_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ClientBrandingRequestRow;
}

/** Apply client-submitted branding to project and mark request submitted. */
export async function submitClientBranding(
  admin: AdminClient,
  requestId: string,
  clientId: string,
  fields: {
    inmail_subject: string;
    inmail_script: string;
    sales_nav_direct_link: string;
    sales_nav_link_count: number;
  }
) {
  const { data: request } = await admin
    .from("client_branding_requests")
    .select("*")
    .eq("id", requestId)
    .eq("client_id", clientId)
    .eq("status", "pending")
    .maybeSingle();

  if (!request) throw new Error("Branding request not found or already submitted");

  const now = new Date().toISOString();

  const { error: projectError } = await admin
    .from("projects")
    .update({
      inmail_subject: fields.inmail_subject.trim(),
      inmail_script: fields.inmail_script.trim(),
      sales_nav_direct_link: fields.sales_nav_direct_link.trim(),
      sales_nav_link_count: fields.sales_nav_link_count,
      branding_submitted_at: now,
      updated_at: now,
    })
    .eq("id", request.project_id);

  if (projectError) throw new Error(projectError.message);

  const { error: requestError } = await admin
    .from("client_branding_requests")
    .update({ status: "submitted", submitted_at: now, updated_at: now })
    .eq("id", requestId);

  if (requestError) throw new Error(requestError.message);

  return { projectId: request.project_id as string };
}
