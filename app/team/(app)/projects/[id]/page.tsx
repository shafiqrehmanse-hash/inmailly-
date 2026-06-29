import { redirect } from "next/navigation";

export default function LegacyTeamProjectRedirect({ params }: { params: { id: string } }) {
  redirect(`/campaign/projects/${params.id}`);
}
