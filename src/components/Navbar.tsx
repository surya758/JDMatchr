
import React from 'react';
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
          <span className="text-white font-bold text-sm">RR</span>
        </div>
        <span className="font-aoenik font-semibold text-xl text-gray-900">ResumeRank</span>
      </div>
      
      <div className="hidden md:flex items-center space-x-8">
        <a href="#pricing" className="font-aoenik text-gray-600 hover:text-gray-900 transition-colors duration-200">
          Pricing
        </a>
        <a href="#how-it-works" className="font-aoenik text-gray-600 hover:text-gray-900 transition-colors duration-200">
          How it works
        </a>
      </div>
      
      <div className="flex items-center space-x-3">
        <Button variant="ghost" className="font-aoenik text-gray-600 hover:text-gray-900">
          Login
        </Button>
        <Button className="font-aoenik bg-primary hover:bg-blue-600 transition-colors duration-200">
          Get Started
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
