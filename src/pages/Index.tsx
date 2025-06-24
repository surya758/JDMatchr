import React from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";

const Index = () => {
  return (
    <div className="min-h-screen font-aoenik bg-bg-dark">
      {/* Fixed width container that contains everything */}
      <div className="max-w-7xl mx-auto relative border-l border-r border-border-custom">
        {/* Vertical line decorations */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-text-subtle to-transparent opacity-50"></div>
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-text-subtle to-transparent opacity-50"></div>

        {/* Horizontal line below navbar with pulse animation */}
        <div className="absolute top-20 left-0 right-0 h-px bg-gradient-to-r from-transparent via-text-subtle to-transparent opacity-50 animate-pulse"></div>

        <Navbar />
        <HeroSection />
      </div>
    </div>
  );
};

export default Index;
