import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { LoaderInline } from "../components/ui/loader";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";
import Footer from "../components/Footer";
import LottieBackground from "../components/LottieBackground";

// Import the Lottie animation data
import animationData from "../assets/animations/bg.json";

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { signUp, signInWithGoogle, user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  // Trigger fade-in animation on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100); // Small delay for smooth entrance
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await signUp(
        formData.email,
        formData.password,
        formData.fullName
      );

      if (error) {
        toast({
          title: "Signup failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account created successfully!",
          description: "Please check your email to verify your account.",
        });
        navigate("/login");
      }
    } catch (error) {
      toast({
        title: "Signup failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Google signup failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Google signup failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-text font-grotesk">
      {/* Lottie Background Animation */}
      {animationData && <LottieBackground animationData={animationData} />}

      {/* Fixed width container */}
      <div className="max-w-7xl mx-auto relative border-l border-r border-border-custom flex flex-col min-h-screen">
        {/* Vertical line decorations */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-text-subtle to-transparent opacity-50 z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-text-subtle to-transparent opacity-50 z-10"></div>

        {/* Content */}
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
              onClick={() => window.history.back()}
              className="group mb-8 flex items-center space-x-2 text-text-muted hover:text-text transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="font-grotesk text-sm">Back</span>
            </button>

            {/* Signup Form */}
            <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-bg-light/10 to-transparent pointer-events-none"></div>

              <div className="relative z-10">
                <div className="text-center mb-8">
                  <h1 className="font-grotesk text-2xl font-bold text-text mb-2">
                    Create Account
                  </h1>
                  <p className="font-grotesk text-text-muted">
                    Join JDMatchr and start screening resumes with AI
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label className="block font-grotesk text-sm font-medium text-text mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-subtle w-5 h-5" />
                      <Input
                        id="fullName"
                        name="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="pl-10 bg-bg/30 border-border-custom focus:border-primary/50 focus:ring-0 focus:outline-none transition-border-colors duration-300"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block font-grotesk text-sm font-medium text-text mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-subtle w-5 h-5" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email"
                        className="pl-10 bg-bg/30 border-border-custom focus:border-primary/50 focus:ring-0 focus:outline-none transition-border-colors duration-300"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block font-grotesk text-sm font-medium text-text mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-subtle w-5 h-5" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Create a password"
                        className="pl-10 pr-10 bg-bg/30 border-border-custom focus:border-primary/50 focus:ring-0 focus:outline-none transition-border-colors duration-300"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-subtle hover:text-text transition-colors duration-200"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block font-grotesk text-sm font-medium text-text mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-subtle w-5 h-5" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm your password"
                        className="pl-10 pr-10 bg-bg/30 border-border-custom focus:border-primary/50 focus:ring-0 focus:outline-none transition-border-colors duration-300"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-subtle hover:text-text transition-colors duration-200"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 transition-all duration-200 hover:scale-[1.01]"
                  >
                    {isLoading ? (
                      <LoaderInline isLoading={isLoading} />
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>

                {/* Divider */}
                <div className="my-6 flex items-center">
                  <div className="flex-1 border-t border-border-custom"></div>
                  <span className="px-4 font-grotesk text-xs text-text-subtle">
                    OR
                  </span>
                  <div className="flex-1 border-t border-border-custom"></div>
                </div>

                {/* Google Signup */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-bg/30 border-border-custom hover:bg-bg-light text-text font-grotesk font-medium py-3 transition-all duration-200 mb-6"
                  onClick={handleGoogleSignup}
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>

                {/* Login Link */}
                <div className="text-center">
                  <p className="font-grotesk text-sm text-text-muted">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="text-primary hover:text-primary/80 transition-colors duration-200 font-medium"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
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

export default Signup;
