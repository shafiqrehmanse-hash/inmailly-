import ScriptsWorkspace from "@/components/team/ScriptsWorkspace";
import { listTeamScripts } from "@/lib/scripts";
import { getTeamScriptsPayload } from "@/lib/team-scripts-server";

export default async function ScriptsPage() {
  const payload = await getTeamScriptsPayload();
  const scripts = listTeamScripts(payload);

  return <ScriptsWorkspace scripts={scripts} />;
}
