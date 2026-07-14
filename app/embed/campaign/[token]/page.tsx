import EmbedCampaignPortal from "@/components/embed/EmbedCampaignPortal";

export default function EmbedCampaignPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { brand?: string };
}) {
  const brand = typeof searchParams.brand === "string" ? searchParams.brand.trim() : "";
  return <EmbedCampaignPortal token={params.token} brandName={brand || null} />;
}
