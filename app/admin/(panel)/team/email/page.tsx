import AdminBroadcastSection from "@/components/admin/sections/AdminBroadcastSection";
import AdminVictoryAnnounceSection from "@/components/admin/sections/AdminVictoryAnnounceSection";

export default function TeamEmailPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <AdminVictoryAnnounceSection />
      <AdminBroadcastSection />
    </div>
  );
}
