import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs sm:text-sm">
              JD
            </span>
          </div>
          <span className="font-aoenik font-semibold text-lg sm:text-xl text-text">
            JDmatcher
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <a
            href="#pricing"
            className="font-aoenik text-text-muted hover:text-text transition-colors duration-200"
          >
            Pricing
          </a>
          <a
            href="#how-it-works"
            className="font-aoenik text-text-muted hover:text-text transition-colors duration-200"
          >
            How it works
          </a>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center space-x-3">
          <Button
            variant="ghost"
            className="font-aoenik text-text-muted hover:text-text hover:bg-bg-light"
          >
            Login
          </Button>
          <Button className="font-aoenik bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200">
            Get Started
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 text-text-muted hover:text-text transition-colors duration-200"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-bg border-t border-border-custom backdrop-blur-sm">
          <div className="px-4 py-4 space-y-4">
            <a
              href="#pricing"
              className="block font-aoenik text-text-muted hover:text-text transition-colors duration-200 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pricing
            </a>
            <a
              href="#how-it-works"
              className="block font-aoenik text-text-muted hover:text-text transition-colors duration-200 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              How it works
            </a>
            <div className="pt-2 space-y-3">
              <Button
                variant="ghost"
                className="w-full font-aoenik text-text-muted hover:text-text hover:bg-bg-light justify-start"
              >
                Login
              </Button>
              <Button className="w-full font-aoenik bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Horizontal line below navbar */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-text-subtle to-transparent opacity-50 animate-pulse"></div>
    </nav>
  );
};

export default Navbar;
