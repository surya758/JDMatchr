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

const MobileIndex = () => {
  const navigate = useNavigate();
  const [visibleSections, setVisibleSections] = useState<Set<string>>(
    new Set()
  );
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const sectionKeys = ["hero", "pricing", "comparison", "faq", "contact"];

    sectionKeys.forEach((sectionKey) => {
      const section = sectionRefs.current[sectionKey];
      if (section) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setVisibleSections((prev) => new Set(prev).add(sectionKey));
              } else {
                setVisibleSections((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(sectionKey);
                  return newSet;
                });
              }
            });
          },
          {
            threshold: 0.2,
            rootMargin: "0px 0px -10% 0px",
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

  const setSectionRef = (sectionKey: string) => (el: HTMLElement | null) => {
    sectionRefs.current[sectionKey] = el;
  };

  return (
    <div className="font-grotesk bg-bg-dark">
      {/* Lottie Background Animation */}
      {animationData && <LottieBackground animationData={animationData} />}

      {/* Fixed Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="relative">
        {/* Hero Section */}
        <section
          ref={setSectionRef("hero")}
          data-section="hero"
          className={`mt-20 flex items-center justify-center transition-all duration-700 ease-out transform ${
            visibleSections.has("hero")
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="w-full max-w-6xl">
            <HeroSection />
          </div>
        </section>

        {/* Pricing Section */}
        <section
          ref={setSectionRef("pricing")}
          data-section="pricing"
          className={`min-h-screen flex items-center justify-center  py-4 transition-all duration-700 ease-out transform ${
            visibleSections.has("pricing")
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="w-full max-w-6xl">
            <PricingPlans />
          </div>
        </section>

        {/* Comparison Section */}
        <section
          ref={setSectionRef("comparison")}
          data-section="comparison"
          className={`min-h-screen flex items-center justify-center py-4 transition-all duration-700 ease-out transform ${
            visibleSections.has("comparison")
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="w-full max-w-6xl">
            <ComparisonSection />
          </div>
        </section>

        {/* FAQ Section */}
        <section
          ref={setSectionRef("faq")}
          data-section="faq"
          className={`min-h-screen flex items-center justify-center py-4 transition-all duration-700 ease-out transform ${
            visibleSections.has("faq")
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="w-full max-w-6xl">
            <FAQSection />
          </div>
        </section>

        {/* Contact Section */}
        <section
          ref={setSectionRef("contact")}
          data-section="contact"
          className={`flex flex-col py-4 transition-all duration-700 ease-out transform ${
            visibleSections.has("contact")
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="flex-1 px-4 flex items-center justify-center">
            <div className="w-full max-w-4xl text-center">
              <div className="mb-8">
                <p className="text-sm text-text-muted mb-6">
                  Still have questions?
                </p>

                <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 sm:p-8 relative overflow-hidden inline-block max-w-md mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-bg-light/10 to-transparent pointer-events-none"></div>
                  <div className="relative z-10">
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
                    <h3 className="text-lg font-semibold text-text mb-2">
                      Need More Help?
                    </h3>
                    <p className="text-sm text-text-muted mb-6">
                      Have specific questions about your use case? Want to see a
                      demo? We're here to help you make the most of jdmatchr.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => navigate("/contact")}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:scale-105"
                    >
                      Get in Touch
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-auto">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default MobileIndex;
