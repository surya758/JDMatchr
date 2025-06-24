import React from "react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-transparent backdrop-blur-sm">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">JD</span>
        </div>
        <span className="font-aoenik font-semibold text-xl text-text">
          JDmatcher
        </span>
      </div>

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

      <div className="flex items-center space-x-3">
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
    </nav>
  );
};

export default Navbar;
