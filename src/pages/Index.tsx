import React, { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PricingPlans from "@/components/PricingPlans";
import ComparisonSection from "@/components/ComparisonSection";
import FAQSection from "@/components/FAQSection";

const Index = () => {
  const [visibleSections, setVisibleSections] = useState<Set<number>>(
    new Set([0])
  );
  const [currentSection, setCurrentSection] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sectionRefs.current.forEach((section, index) => {
      if (section) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setVisibleSections((prev) => new Set(prev).add(index));
                // Update current section when more than 50% is visible
                if (entry.intersectionRatio > 0.5) {
                  setCurrentSection(index);
                }
              } else {
                setVisibleSections((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(index);
                  return newSet;
                });
              }
            });
          },
          {
            threshold: [0.3, 0.5, 0.7], // Multiple thresholds for better detection
            rootMargin: "-10% 0px -10% 0px",
          }
        );

        observer.observe(section);
        observers.push(observer);
      }
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  const setSectionRef = (index: number) => (el: HTMLElement | null) => {
    sectionRefs.current[index] = el;
  };

  const totalSections = 4;
  const progressPercentage = ((currentSection + 1) / totalSections) * 100;

  return (
    <div className="font-aoenik bg-bg-dark">
      {/* Fixed width container that contains everything */}
      <div className="max-w-7xl mx-auto relative border-l border-r border-border-custom">
        {/* Vertical line decorations */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-text-subtle to-transparent opacity-50 z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-text-subtle to-transparent opacity-50 z-10"></div>

        {/* Fixed Navbar */}
        <div className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full max-w-7xl z-20">
          <Navbar />
        </div>

        {/* Section Indicators */}
        <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-30 hidden md:flex flex-col space-y-3">
          {Array.from({ length: totalSections }, (_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                currentSection === index
                  ? "bg-text-muted scale-125"
                  : visibleSections.has(index)
                  ? "bg-text-subtle"
                  : "bg-border-custom"
              }`}
            />
          ))}
        </div>

        {/* Snap Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="h-screen overflow-y-scroll snap-y snap-mandatory snap-container"
        >
          {/* Hero Section */}
          <section
            ref={setSectionRef(0)}
            className={`h-screen snap-start snap-always flex items-center justify-center transition-opacity duration-500 ease-out ${
              visibleSections.has(0) ? "opacity-100" : "opacity-30"
            }`}
          >
            <div className="w-full">
              <HeroSection />
            </div>
          </section>

          {/* Pricing Section */}
          <section
            ref={setSectionRef(1)}
            className={`h-screen snap-start snap-always flex items-center justify-center transition-opacity duration-500 ease-out ${
              visibleSections.has(1) ? "opacity-100" : "opacity-30"
            }`}
          >
            <div className="w-full overflow-y-auto max-h-screen">
              <PricingPlans />
            </div>
          </section>

          {/* Comparison Section */}
          <section
            ref={setSectionRef(2)}
            className={`h-screen snap-start snap-always flex items-center justify-center transition-opacity duration-500 ease-out ${
              visibleSections.has(2) ? "opacity-100" : "opacity-30"
            }`}
          >
            <div className="w-full overflow-y-auto max-h-screen">
              <ComparisonSection />
            </div>
          </section>

          {/* FAQ Section */}
          <section
            ref={setSectionRef(3)}
            className={`h-screen snap-start snap-always flex items-center justify-center transition-opacity duration-500 ease-out ${
              visibleSections.has(3) ? "opacity-100" : "opacity-30"
            }`}
          >
            <div className="w-full overflow-y-auto max-h-screen">
              <FAQSection />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Index;
