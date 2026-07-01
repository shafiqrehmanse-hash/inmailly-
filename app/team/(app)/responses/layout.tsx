import { requireOutreachWorker } from "@/lib/team-guards";

export default async function OutreachWorkerLayout({ children }: { children: React.ReactNode }) {
  await requireOutreachWorker();
  return <>{children}</>;
}
