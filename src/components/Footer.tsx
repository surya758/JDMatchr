import React from "react";
import { Linkedin, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-bg/50 backdrop-blur-sm border-t border-border-custom relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-bg-light/5 to-transparent pointer-events-none"></div>

      <div className="relative z-10 px-4 sm:px-6 py-4">
        {/* Desktop Layout - Thin Horizontal */}
        <div className="hidden sm:flex items-center justify-between">
          {/* Left: Brand */}
          <div className="flex items-center">
            <img
              src="/assets/images/logo.png"
              alt="JDMatchr"
              width={14}
              height={14}
            />
            <h3 className="ml-2 font-grotesk text-sm font-bold text-text">
              JDMatchr
            </h3>
          </div>

          {/* Right: Social + Legal + Copyright */}
          <div className="flex items-center space-x-4">
            {/* Social Media */}
            <div className="flex items-center space-x-2">
              <a
                href="https://linkedin.com/in/yourprofile"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-1.5 bg-bg-light/50 backdrop-blur-sm border border-border-custom rounded-lg hover:bg-bg-light hover:border-primary/30 transition-all duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-3 h-3 text-text-muted group-hover:text-primary transition-colors duration-200" />
              </a>
              <a
                href="https://x.com/yourhandle"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-1.5 bg-bg-light/50 backdrop-blur-sm border border-border-custom rounded-lg hover:bg-bg-light hover:border-primary/30 transition-all duration-200"
                aria-label="X (Twitter)"
              >
                <Twitter className="w-3 h-3 text-text-muted group-hover:text-primary transition-colors duration-200" />
              </a>
            </div>

            {/* Legal Links + Copyright */}
            <div className="flex items-center gap-2 text-xs">
              <a
                href="/privacy"
                className="font-grotesk text-text-subtle hover:text-text-muted transition-colors duration-200"
              >
                Privacy
              </a>
              <span className="text-text-subtle">•</span>
              <a
                href="/terms"
                className="font-grotesk text-text-subtle hover:text-text-muted transition-colors duration-200"
              >
                Terms
              </a>
              <span className="text-text-subtle">•</span>
              <a
                href="/contact"
                className="font-grotesk text-text-subtle hover:text-text-muted transition-colors duration-200"
              >
                Contact
              </a>
              <span className="text-text-subtle">•</span>
              <span className="font-grotesk text-text-subtle">
                © {new Date().getFullYear()}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Centered Stacked */}
        <div className="sm:hidden text-center space-y-4 py-2">
          {/* Brand */}
          <div>
            <h3 className="font-grotesk text-lg font-bold text-text mb-2">
              JDMatchr
            </h3>
            <p className="font-grotesk text-sm text-text-muted">
              AI-powered resume screening made simple
            </p>
          </div>

          {/* Social Media */}
          <div className="flex justify-center items-center space-x-3">
            <a
              href="https://linkedin.com/in/yourprofile"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-2 bg-bg-light/50 backdrop-blur-sm border border-border-custom rounded-lg hover:bg-bg-light hover:border-primary/30 transition-all duration-200"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors duration-200" />
            </a>
            <a
              href="https://x.com/yourhandle"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-2 bg-bg-light/50 backdrop-blur-sm border border-border-custom rounded-lg hover:bg-bg-light hover:border-primary/30 transition-all duration-200"
              aria-label="X (Twitter)"
            >
              <Twitter className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors duration-200" />
            </a>
          </div>

          {/* Legal Links + Copyright */}
          <div className="border-t border-border-custom/50 pt-4">
            <div className="flex flex-wrap justify-center items-center gap-2 text-xs mb-2">
              <a
                href="/privacy"
                className="font-grotesk text-text-subtle hover:text-text-muted transition-colors duration-200"
              >
                Privacy Policy
              </a>
              <span className="text-text-subtle">•</span>
              <a
                href="/terms"
                className="font-grotesk text-text-subtle hover:text-text-muted transition-colors duration-200"
              >
                Terms of Service
              </a>
              <span className="text-text-subtle">•</span>
              <a
                href="mailto:surya@jdmatchr.com"
                className="font-grotesk text-text-subtle hover:text-text-muted transition-colors duration-200"
              >
                Contact
              </a>
            </div>
            <p className="font-grotesk text-xs text-text-subtle">
              © {new Date().getFullYear()} JDMatchr. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
