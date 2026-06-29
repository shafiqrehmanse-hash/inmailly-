"use client";

import LuxBackground from "./LuxBackground";
import Spotlight from "./Spotlight";
import LuxNav from "./LuxNav";
import LuxHero from "./LuxHero";
import ProblemStory from "./ProblemStory";
import ProductShowcase from "./ProductShowcase";
import LuxTimeline from "./LuxTimeline";
import LuxFeatures from "./LuxFeatures";
import ResponseShowcase from "./ResponseShowcase";
import LuxStats from "./LuxStats";
import LuxPricing from "./LuxPricing";
import LuxTestimonials from "./LuxTestimonials";
import LuxFAQ from "./LuxFAQ";
import LuxFinalCTA from "./LuxFinalCTA";
import LuxFooter from "./LuxFooter";

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-lux-bg text-lux-text overflow-x-hidden">
      <LuxBackground />
      <Spotlight />
      <LuxNav />
      <main>
        <LuxHero />
        <ProblemStory />
        <ProductShowcase />
        <ResponseShowcase />
        <LuxTimeline />
        <LuxFeatures />
        <LuxStats />
        <LuxPricing />
        <LuxTestimonials />
        <LuxFAQ />
        <LuxFinalCTA />
      </main>
      <LuxFooter />
    </div>
  );
}
