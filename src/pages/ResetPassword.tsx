import React, { useEffect, useState } from "react";
import { Eye, EyeOff, ArrowLeft, Lock, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { LoaderInline } from "../components/ui/loader";
import { useToast } from "../hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Footer from "../components/Footer";
import LottieBackground from "../components/LottieBackground";
import animationData from "../assets/animations/bg.json";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Check if we have valid reset session on mount
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      } else {
        toast({
          title: "Invalid or expired reset link",
          description: "Please request a new password reset link.",
          variant: "destructive",
        });
        navigate("/login");
      }
    };

    checkSession();

    // Trigger fade-in animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [navigate, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) {
        toast({
          title: "Failed to reset password",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setIsSuccess(true);
        toast({
          title: "Password reset successful!",
          description:
            "Your password has been updated. You can now sign in with your new password.",
        });

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (err) {
      toast({
        title: "Failed to reset password",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.password && formData.confirmPassword;

  if (!isValidSession) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-bg-dark text-text font-grotesk">
      {/* Lottie Background Animation */}
      {animationData && <LottieBackground animationData={animationData} />}

      {/* Fixed width container that contains everything */}
      <div className="max-w-7xl mx-auto relative border-l border-r border-border-custom flex flex-col min-h-screen">
        {/* Vertical line decorations */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-text-subtle to-transparent opacity-50 z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-text-subtle to-transparent opacity-50 z-10"></div>

        <div className="relative z-10 px-4 sm:px-6 navbar-spacing pb-12 sm:pb-20 flex-1 flex items-center justify-center">
          <div
            className={`w-full max-w-md transition-all duration-1000 ease-out ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            {/* Back Button */}
            <button
              onClick={() => navigate("/login")}
              className="group mb-8 flex items-center space-x-2 text-text-muted hover:text-text transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="font-grotesk text-sm">Back to Login</span>
            </button>

            {/* Reset Password Form */}
            <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-bg-light/10 to-transparent pointer-events-none"></div>

              <div className="relative z-10">
                {isSuccess ? (
                  // Success State
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h1 className="font-grotesk text-xl font-bold text-text mb-2">
                      Password Reset Successful!
                    </h1>
                    <p className="font-grotesk text-text-muted mb-6">
                      Your password has been updated. Redirecting to login...
                    </p>
                    <Button
                      onClick={() => navigate("/login")}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-grotesk"
                    >
                      Go to Login
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="text-center mb-8">
                      <h1 className="font-grotesk text-2xl font-bold text-text mb-2">
                        Set New Password
                      </h1>
                      <p className="font-grotesk text-text-muted">
                        Enter your new password below
                      </p>
                    </div>

                    {/* Reset Password Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label className="block font-grotesk text-sm font-medium text-text mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Enter new password"
                            className="bg-bg/30 border-border-custom focus:border-primary/50 focus:ring-0 focus:outline-none transition-border-colors duration-300 font-grotesk pl-10 pr-10"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text transition-colors duration-200"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block font-grotesk text-sm font-medium text-text mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Confirm new password"
                            className="bg-bg/30 border-border-custom focus:border-primary/50 focus:ring-0 focus:outline-none transition-border-colors duration-300 font-grotesk pl-10 pr-10"
                            required
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text transition-colors duration-200"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Password Requirements */}
                      <div className="text-xs text-text-subtle space-y-1">
                        <p>Password must be:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>At least 6 characters long</li>
                          <li>Match the confirmation password</li>
                        </ul>
                      </div>

                      {/* Reset Button */}
                      <Button
                        type="submit"
                        disabled={!isFormValid || isLoading}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-grotesk font-medium py-3 transition-all duration-200 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <LoaderInline isLoading={isLoading} />
                        ) : (
                          "Update Password"
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default ResetPassword;
