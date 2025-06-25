import React, { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PricingPlans from "@/components/PricingPlans";
import ComparisonSection from "@/components/ComparisonSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import LottieBackground from "@/components/LottieBackground";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

import animationData from "../assets/animations/bg.json";

const Index = () => {
  const navigate = useNavigate();
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

  const totalSections = 5;
  const progressPercentage = ((currentSection + 1) / totalSections) * 100;

  return (
    <div className="font-grotesk bg-bg-dark">
      {/* Lottie Background Animation */}
      {animationData && <LottieBackground animationData={animationData} />}

      {/* Fixed width container that contains everything */}
      <div className="max-w-7xl mx-auto relative md:border-l md:border-r border-border-custom">
        {/* Vertical line decorations - Desktop only */}
        <div className="hidden md:block absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-text-subtle to-transparent opacity-50 z-10"></div>
        <div className="hidden md:block absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-text-subtle to-transparent opacity-50 z-10"></div>

        {/* Fixed Navbar */}
        <Navbar />

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

        {/* Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="mobile-vh overflow-y-scroll md:snap-y md:snap-mandatory snap-container"
        >
          {/* Hero Section */}
          <section
            ref={setSectionRef(0)}
            data-section="hero"
            className={`mobile-vh md:snap-start md:snap-always snap-section flex items-center justify-center transition-opacity duration-500 ease-out ${
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
            data-section="pricing"
            className={`min-h-screen md:mobile-vh md:snap-start md:snap-always snap-section flex items-center justify-center transition-opacity duration-500 ease-out ${
              visibleSections.has(1) ? "opacity-100" : "opacity-30"
            }`}
          >
            <div className="w-full md:overflow-y-auto md:max-h-screen">
              <PricingPlans />
            </div>
          </section>

          {/* Comparison Section */}
          <section
            ref={setSectionRef(2)}
            data-section="comparison"
            className={`min-h-screen md:mobile-vh md:snap-start md:snap-always snap-section flex items-center justify-center transition-opacity duration-500 ease-out ${
              visibleSections.has(2) ? "opacity-100" : "opacity-30"
            }`}
          >
            <div className="w-full md:overflow-y-auto md:max-h-screen">
              <ComparisonSection />
            </div>
          </section>

          {/* FAQ Section */}
          <section
            ref={setSectionRef(3)}
            data-section="faq"
            className={`min-h-screen md:mobile-vh md:snap-start md:snap-always snap-section flex items-center justify-center transition-opacity duration-500 ease-out ${
              visibleSections.has(3) ? "opacity-100" : "opacity-30"
            }`}
          >
            <div className="w-full md:overflow-y-auto md:max-h-screen">
              <FAQSection />
            </div>
          </section>

          {/* Contact Section */}
          <section
            ref={setSectionRef(4)}
            data-section="contact"
            className={`min-h-screen md:mobile-vh md:snap-start md:snap-always snap-section flex flex-col transition-opacity duration-500 ease-out ${
              visibleSections.has(4) ? "opacity-100" : "opacity-30"
            }`}
          >
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="max-w-4xl mx-auto px-6 text-center">
                <p className="font-aoenik text-sm text-text-muted mb-6">
                  Still have questions?
                </p>
                <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 sm:p-8 relative overflow-hidden group transition-colors duration-200 inline-block">
                  <div className="absolute inset-0 bg-gradient-to-br from-bg-light/10 to-transparent pointer-events-none"></div>
                  <div className="relative z-10 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-6 h-6 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="font-aoenik text-lg font-semibold text-text mb-2">
                      Need More Help?
                    </h3>
                    <p className="font-aoenik text-sm text-text-muted mb-6 max-w-md">
                      Have specific questions about your use case? Want to see a
                      demo? We're here to help you make the most of JDMatchr.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => navigate("/contact")}
                      className="font-grotesk bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200 text-sm"
                    >
                      Get in Touch
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer at bottom of last section */}
            <div className="mt-auto">
              <Footer />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Index;
