import CtaSection from "@/components/landing/CtaSection";
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
      <Nav />
      <main>
        <Hero />
        <VsComparison />
        <PricingGrid />
        <FeatureGrid />
        <HowItWorks />
        <Testimonials />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
