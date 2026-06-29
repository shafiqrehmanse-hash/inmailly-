import { redirect } from "next/navigation";
import { getCurrentClient } from "@/lib/client-auth-server";

export default async function ClientRootPage() {
  const client = await getCurrentClient();
  if (client) redirect("/client/dashboard");
  redirect("/client/register");
}
