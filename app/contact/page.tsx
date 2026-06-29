import Link from "next/link";
import ContactForm from "@/components/home/ContactForm";
import LuxBackground from "@/components/home/LuxBackground";
import LuxFooter from "@/components/home/LuxFooter";
import LuxNav from "@/components/home/LuxNav";
import { getSiteContent } from "@/lib/site-content-server";

export default async function ContactPage() {
  const content = await getSiteContent();

  return (
    <div className="relative min-h-screen bg-lux-bg text-lux-text">
      <LuxBackground />
      <LuxNav />
      <main className="pt-32 pb-24 px-6 lg:px-10">
        <div className="max-w-lg mx-auto">
          <Link href="/" className="text-sm text-lux-muted hover:text-lux-cyan mb-8 inline-block transition-colors">
            ← Back
          </Link>
          <h1 className="font-bricolage font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight text-lux-text mb-3">
            {content.contact.headline}
          </h1>
          <p className="text-lux-muted mb-10 leading-relaxed">{content.contact.subline}</p>
          <div className="border border-white/[0.08] bg-lux-card/80 backdrop-blur-xl p-8">
            <ContactForm />
          </div>
        </div>
      </main>
      <LuxFooter />
    </div>
  );
}
