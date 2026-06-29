import CtaSection from "@/components/landing/CtaSection";
import DashPreview from "@/components/landing/DashPreview";
import FeatureGrid from "@/components/landing/FeatureGrid";
import Footer from "@/components/landing/Footer";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Nav from "@/components/landing/Nav";
import PricingGrid from "@/components/landing/PricingGrid";
import Testimonials from "@/components/landing/Testimonials";
import VsComparison from "@/components/landing/VsComparison";

export default function Home() {
  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none bg-[linear-gradient(rgba(79,70,229,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,black_40%,transparent_100%)]" />
      <div className="fixed top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-[radial-gradient(ellipse,rgba(79,70,229,0.22)_0%,rgba(6,182,212,0.08)_50%,transparent_70%)] pointer-events-none z-0" />
      <div className="fixed top-[60%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.1)_0%,transparent_70%)] pointer-events-none z-0" />
      <div className="fixed top-[40%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.08)_0%,transparent_70%)] pointer-events-none z-0" />

      <Nav />
      <main className="relative z-[1]">
        <Hero />
        <VsComparison />
        <PricingGrid />
        <FeatureGrid />
        <HowItWorks />
        <DashPreview />
        <Testimonials />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
