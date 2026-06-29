"use client";

import dynamic from "next/dynamic";
import LuxBackground from "./LuxBackground";
import LuxNav from "./LuxNav";
import LuxHero from "./LuxHero";

const ProblemStory = dynamic(() => import("./ProblemStory"));
const ProductShowcase = dynamic(() => import("./ProductShowcase"));
const ResponseShowcase = dynamic(() => import("./ResponseShowcase"));
const LuxTimeline = dynamic(() => import("./LuxTimeline"));
const LuxFeatures = dynamic(() => import("./LuxFeatures"));
const LuxStats = dynamic(() => import("./LuxStats"));
const LuxPricing = dynamic(() => import("./LuxPricing"));
const LuxTestimonials = dynamic(() => import("./LuxTestimonials"));
const LuxFAQ = dynamic(() => import("./LuxFAQ"));
const LuxFinalCTA = dynamic(() => import("./LuxFinalCTA"));
const LuxFooter = dynamic(() => import("./LuxFooter"));

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-lux-bg text-lux-text overflow-x-hidden">
      <LuxBackground />
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
