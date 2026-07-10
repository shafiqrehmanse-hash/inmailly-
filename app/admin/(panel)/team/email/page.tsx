import AdminBroadcastSection from "@/components/admin/sections/AdminBroadcastSection";
import AdminVictoryAnnounceSection from "@/components/admin/sections/AdminVictoryAnnounceSection";

export default function TeamEmailPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-8">
      <section id="birthday-banners" className="scroll-mt-6">
        <AdminVictoryAnnounceSection />
      </section>
      <section id="email-team" className="scroll-mt-6">
        <AdminBroadcastSection />
      </section>
    </div>
  );
}
