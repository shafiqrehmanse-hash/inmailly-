import EmbedCampaignPortal from "@/components/embed/EmbedCampaignPortal";

export default function EmbedCampaignPage({ params }: { params: { token: string } }) {
  return <EmbedCampaignPortal token={params.token} />;
}
