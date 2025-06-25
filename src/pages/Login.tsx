import React, { useEffect, useState } from "react";
import { Eye, EyeOff, ArrowLeft, Mail, Lock, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Loader, LoaderInline } from "../components/ui/loader";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import Footer from "../components/Footer";
import LottieBackground from "../components/LottieBackground";

// Import the Lottie animation data
import animationData from "../assets/animations/bg.json";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, resetPassword, user, loading } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Redirect if already logged in
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await signIn(formData.email, formData.password);

      if (error) setError(error.message);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    }

    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError("Failed to sign in with Google. Please try again.");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingReset(true);

    try {
      const { error } = await resetPassword(forgotPasswordEmail);

      if (error) {
        toast({
          title: "Failed to send reset email",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password reset email sent!",
          description:
            "Check your email for instructions to reset your password.",
        });
        setShowForgotPassword(false);
        setForgotPasswordEmail("");
      }
    } catch (err) {
      toast({
        title: "Failed to send reset email",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleForgotPasswordClick = () => {
    setForgotPasswordEmail(formData.email); // Pre-fill with current email
    setShowForgotPassword(true);
  };

  const isFormValid = formData.email && formData.password;

  return (
    <div className="min-h-screen bg-bg-dark text-text font-grotesk scrollbar-hide">
      {/* Lottie Background Animation */}
      {animationData && <LottieBackground animationData={animationData} />}

      {/* Fixed width container that contains everything */}
      <div className="max-w-7xl mx-auto relative md:border-l md:border-r border-border-custom flex flex-col min-h-screen">
        {/* Vertical line decorations */}
        <div className="hidden md:block absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-text-subtle to-transparent opacity-50 z-10"></div>
        <div className="hidden md:block absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-text-subtle to-transparent opacity-50 z-10"></div>

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

            {/* Login Form */}
            <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-bg-light/10 to-transparent pointer-events-none"></div>

              <div className="relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                  <h1 className="font-grotesk text-2xl font-bold text-text mb-2">
                    Welcome Back
                  </h1>
                  <p className="font-grotesk text-text-muted">
                    Sign in to your jdmatchr account
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-red-400 text-sm font-grotesk text-center">
                      {error}
                    </p>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block font-grotesk text-sm font-medium text-text mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        className="bg-bg/30 border-border-custom focus:border-primary/50 focus:ring-0 focus:outline-none transition-border-colors duration-300 font-grotesk pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-grotesk text-sm font-medium text-text mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter your password"
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

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-border-custom bg-bg/30 text-primary focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="font-grotesk text-sm text-text-muted">
                        Remember me
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPasswordClick}
                      className="font-grotesk text-sm text-primary hover:text-primary/80 transition-colors duration-200"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Login Button */}
                  <Button
                    type="submit"
                    disabled={!isFormValid || isLoading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-grotesk font-medium py-3 transition-all duration-200 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <LoaderInline isLoading={isLoading} />
                    ) : (
                      "Sign In"
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

                {/* Google Login */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-bg/30 border-border-custom hover:bg-bg-light text-text font-grotesk font-medium py-3 transition-all duration-200 mb-6"
                  onClick={handleGoogleLogin}
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

                {/* Sign Up Link */}
                <div className="text-center">
                  <p className="font-grotesk text-sm text-text-muted">
                    Don't have an account?{" "}
                    <Link
                      to="/signup"
                      className="text-primary hover:text-primary/80 transition-colors duration-200 font-medium"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-bg/90 backdrop-blur-sm border border-border-custom rounded-2xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-bg-light/10 to-transparent pointer-events-none"></div>

                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-grotesk text-xl font-bold text-text">
                        Reset Password
                      </h2>
                      <button
                        onClick={() => setShowForgotPassword(false)}
                        className="text-text-muted hover:text-text transition-colors duration-200"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="font-grotesk text-sm text-text-muted mb-6">
                      Enter your email address and we'll send you a link to
                      reset your password.
                    </p>

                    {/* Reset Form */}
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div>
                        <label className="block font-grotesk text-sm font-medium text-text mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                          <Input
                            type="email"
                            value={forgotPasswordEmail}
                            onChange={(e) =>
                              setForgotPasswordEmail(e.target.value)
                            }
                            placeholder="your@email.com"
                            className="bg-bg/30 border-border-custom focus:border-primary/50 focus:ring-0 focus:outline-none transition-border-colors duration-300 font-grotesk pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowForgotPassword(false)}
                          className="flex-1 bg-bg/30 border-border-custom hover:bg-bg-light text-text font-grotesk"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={!forgotPasswordEmail || isSendingReset}
                          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-grotesk"
                        >
                          {isSendingReset ? (
                            <LoaderInline isLoading={isSendingReset} />
                          ) : (
                            "Send Reset Link"
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Login;
