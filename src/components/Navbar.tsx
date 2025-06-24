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
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          {/* Logo */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs sm:text-sm">
                JD
              </span>
            </div>
            <span className="font-aoenik font-semibold text-base sm:text-lg lg:text-xl text-text">
              JDmatcher
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection(1)}
              className="font-aoenik text-text-muted hover:text-text transition-colors duration-200 text-sm"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection(2)}
              className="font-aoenik text-text-muted hover:text-text transition-colors duration-200 text-sm"
            >
              Why?
            </button>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="font-aoenik text-text-muted hover:text-text hover:bg-bg-light text-sm"
            >
              Login
            </Button>
            <Button
              size="sm"
              className="font-aoenik bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200 text-sm"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile CTA Button + Menu */}
          <div className="flex items-center space-x-2 lg:hidden">
            <Button
              size="sm"
              className="font-aoenik bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200 text-xs px-3 py-1.5"
            >
              Get Started
            </Button>
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
                className="block w-full text-left font-aoenik text-text-muted hover:text-text hover:bg-bg-light transition-colors duration-200 py-3 px-3 rounded-lg text-sm"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection(2)}
                className="block w-full text-left font-aoenik text-text-muted hover:text-text hover:bg-bg-light transition-colors duration-200 py-3 px-3 rounded-lg text-sm"
              >
                Why?
              </button>
              <div className="pt-2 border-t border-border-custom mt-3">
                <Button
                  variant="ghost"
                  className="w-full font-aoenik text-text-muted hover:text-text hover:bg-bg-light justify-start text-sm py-3"
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
