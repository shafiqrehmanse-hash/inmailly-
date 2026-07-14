import EmbedCampaignPortal from "@/components/embed/EmbedCampaignPortal";
import { fetchEmbedPortalByToken } from "@/lib/embed-portal-server";
import { mapPortalToDashboard } from "@/lib/map-portal-to-dashboard";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EmbedCampaignPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { brand?: string };
}) {
  const brand = typeof searchParams.brand === "string" ? searchParams.brand.trim() : "";

  let initialLive = null;
  try {
    const admin = createAdminClient();
    const data = await fetchEmbedPortalByToken(admin, params.token);
    if (data) {
      const mapped = mapPortalToDashboard(data);
      initialLive = brand ? { ...mapped, clientLabel: brand } : mapped;
    }
  } catch {
    initialLive = null;
  }

  return (
    <EmbedCampaignPortal
      token={params.token}
      brandName={brand || null}
      initialLive={initialLive}
    />
  );
}
