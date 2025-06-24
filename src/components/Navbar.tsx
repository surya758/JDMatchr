import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const scrollToSection = (sectionIndex: number) => {
    const sections = document.querySelectorAll("section[data-section]");
    if (sections[sectionIndex]) {
      sections[sectionIndex].scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-dark/80 backdrop-blur-md border-b border-border-custom">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center px-4 sm:px-6 py-3 sm:py-4">
          {/* Logo - Left Side */}
          <div className="flex items-center space-x-2 flex-1">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs sm:text-sm">
                JD
              </span>
            </div>
            <span className="font-grotesk font-semibold text-base sm:text-lg lg:text-xl text-text">
              JDmatcher
            </span>
          </div>

          {/* Desktop Navigation - Centered */}
          <div className="hidden lg:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => scrollToSection(1)}
              className="font-grotesk text-text-muted hover:text-text transition-colors duration-200 text-sm"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection(2)}
              className="font-grotesk text-text-muted hover:text-text transition-colors duration-200 text-sm"
            >
              Why?
            </button>
          </div>

          {/* Desktop Buttons - Right Side */}
          <div className="hidden lg:flex items-center justify-end flex-1">
            <Button
              variant="ghost"
              size="sm"
              className="font-grotesk text-text-muted hover:text-text hover:bg-bg-light text-sm"
              onClick={() => (window.location.href = "/login")}
            >
              Login
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-text-muted hover:text-text transition-colors duration-200 hover:bg-bg-light rounded-md"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="border-t border-border-custom bg-bg/95 backdrop-blur-sm">
            <div className="px-4 py-4 space-y-1">
              <button
                onClick={() => scrollToSection(1)}
                className="block w-full text-left font-grotesk text-text-muted hover:text-text hover:bg-bg-light transition-colors duration-200 py-3 px-3 rounded-lg text-sm"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection(2)}
                className="block w-full text-left font-grotesk text-text-muted hover:text-text hover:bg-bg-light transition-colors duration-200 py-3 px-3 rounded-lg text-sm"
              >
                Why?
              </button>
              <div className="pt-2 border-t border-border-custom mt-3">
                <Button
                  variant="ghost"
                  className="w-full font-grotesk text-text-muted hover:text-text hover:bg-bg-light justify-start text-sm py-3"
                  onClick={() => (window.location.href = "/login")}
                >
                  Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal line below navbar */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-text-subtle to-transparent opacity-30"></div>
    </nav>
  );
};

export default Navbar;
