import ClientProjectPortal from "@/components/client/ClientProjectPortal";

export default function ClientPortalByTokenPage({ params }: { params: { token: string } }) {
  return <ClientProjectPortal token={params.token} />;
}
