import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, CreditCard } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useSubscription } from "../hooks/useSubscription";
import { useNavigate, useLocation, Link } from "react-router-dom";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const {
    jobCreditsRemaining,
    subscriptionStatus,
    isLoading: subscriptionLoading,
  } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();
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
          {/* Logo - Left Side */}
          <Link to="/" className="cursor-pointer">
            <div className="flex items-center space-x-2">
              <img
                src="/assets/images/logo.png"
                alt="jdmatchr"
                width={18}
                height={18}
                className="cursor-pointer"
              />
              <span className="font-grotesk font-semibold text-base sm:text-lg lg:text-xl text-text">
                jdmatchr
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - Centered */}
          {!user && (
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
          )}

          {/* Desktop Buttons - Right Side */}
          <div className="hidden lg:flex items-center space-x-4">
            {!loading && user && !subscriptionLoading && (
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-bg/50 border border-border-custom rounded-lg">
                <CreditCard className="w-4 h-4 text-text-muted" />
                <span className="font-grotesk text-sm text-text-muted">
                  {jobCreditsRemaining}{" "}
                  {jobCreditsRemaining === 1 ? "credit" : "credits"}
                </span>
                <span className="text-text-subtle text-xs capitalize">
                  ({subscriptionStatus})
                </span>
              </div>
            )}
            {!loading && !location.pathname.includes("/dashboard") && (
              <Button
                variant="ghost"
                size="sm"
                className="font-grotesk text-text-muted hover:text-text hover:bg-bg-light text-sm"
                onClick={() => {
                  navigate(user ? "/dashboard" : "/login");
                }}
              >
                {user ? "Dashboard" : "Login"}
              </Button>
            )}
          </div>

          {/* Mobile Menu Button - Right Side */}
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
              {!user && (
                <>
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
                </>
              )}
              {!loading && user && !subscriptionLoading && (
                <div className="mb-3 p-3 bg-bg/50 border border-border-custom rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-text-muted" />
                      <span className="font-grotesk text-sm text-text-muted">
                        {jobCreditsRemaining}{" "}
                        {jobCreditsRemaining === 1 ? "credit" : "credits"}
                      </span>
                    </div>
                    <span className="text-text-subtle text-xs">
                      {subscriptionStatus}
                    </span>
                  </div>
                </div>
              )}
              <div
                className={`${
                  !user ? "pt-2 border-t border-border-custom mt-3" : ""
                }`}
              >
                {!loading && (
                  <Button
                    variant="ghost"
                    className="w-full font-grotesk text-text-muted hover:text-text hover:bg-bg-light justify-start text-sm py-3"
                    onClick={() => {
                      navigate(user ? "/dashboard" : "/login");
                    }}
                  >
                    {user ? "Dashboard" : "Login"}
                  </Button>
                )}
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
