import React, { useEffect, useState } from "react";
import { CheckCircle, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LottieBackground from "../components/LottieBackground";
import animationData from "../assets/animations/bg.json";
import Footer from "../components/Footer";

const EmailConfirmed = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // If user is not authenticated, redirect to login (but only once)
    if (!loading && !user && !hasRedirected) {
      setHasRedirected(true);
      navigate("/login");
    }
  }, [user, loading, navigate, hasRedirected]);

  const handleCloseTab = () => {
    window.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark text-text font-grotesk scrollbar-hide">
      {/* Lottie Background Animation */}
      {animationData && <LottieBackground animationData={animationData} />}

      {/* Fixed width container */}
      <div className="max-w-7xl mx-auto relative md:border-l md:border-r border-border-custom flex flex-col min-h-screen">
        {/* Vertical line decorations */}
        <div className="hidden md:block absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-text-subtle to-transparent opacity-50 z-10"></div>
        <div className="hidden md:block absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-text-subtle to-transparent opacity-50 z-10"></div>

        {/* Content */}
        <div className="relative z-10 px-4 sm:px-6 navbar-spacing pb-12 sm:pb-20 flex-1 flex items-center justify-center">
          <div className="w-full max-w-md text-center">
            {/* Success Card */}
            <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-bg-light/10 to-transparent pointer-events-none"></div>

              <div className="relative z-10">
                {/* Success Icon */}
                <div className="w-20 h-20 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>

                {/* Success Message */}
                <h1 className="font-grotesk text-2xl font-bold text-text mb-3">
                  Email Confirmed!
                </h1>
                <p className="font-grotesk text-text-muted mb-8 leading-relaxed">
                  Your email address has been successfully verified. Your
                  jdmatchr account is now active and ready to use.
                </p>

                {/* Action Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={handleCloseTab}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-8 rounded-xl transition-all duration-200 hover:scale-[1.02] group"
                  >
                    Close This Tab
                    <X className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform duration-200" />
                  </Button>
                </div>

                {/* Additional Info */}
                <div className="mt-8 pt-6 border-t border-border-custom">
                  <p className="text-text-subtle text-sm">
                    You can now access all jdmatchr features including
                    AI-powered resume screening and analysis.
                  </p>
                </div>
              </div>
            </div>

            {/* Logo Attribution */}
            <div className="mt-8 text-center">
              <p className="text-text-subtle text-sm">
                Welcome to{" "}
                <span className="font-medium text-primary">jdmatchr</span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default EmailConfirmed;
