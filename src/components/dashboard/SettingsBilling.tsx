import React, { useState } from "react";
import {
  CreditCard,
  Download,
  Calendar,
  Crown,
  Zap,
  Star,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  PartyPopper,
  CheckCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import { useUserProfile } from "../../hooks/useUserProfile";
import { useSubscription } from "../../hooks/useSubscription";
import {
  useConfirmation,
  confirmationConfigs,
} from "../../hooks/useConfirmation";
import ConfirmationModal from "../ui/confirmation-modal";
import { generateBillingPDF, generateBillingReport } from "../../lib/billing";
import { useToast } from "../../hooks/use-toast";
import { dodoPayments } from "../../lib/dodo-payments";
import { useAuth } from "../../hooks/useAuth";
import { LoaderInline } from "../ui/loader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

const SettingsBilling = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { toast } = useToast();

  const {
    subscription,
    subscriptionStatus,
    upgradeSubscription,
    cancelSubscription,
    reactivateSubscription,
    isSubscriptionCancelled,
    subscriptionExpiresAt,
    isUpdating: isSubscriptionUpdating,
    billingHistory,
    isHistoryLoading,
    jobCreditsRemaining,
  } = useSubscription();

  const {
    isOpen: isConfirmationOpen,
    isLoading: isConfirmationLoading,
    config: confirmationConfig,
    showConfirmation,
    hideConfirmation,
    confirmAction,
  } = useConfirmation();

  const isUpdating = isSubscriptionUpdating || isConfirmationLoading;
  const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Handle payment success/cancellation from URL params
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const cancelled = urlParams.get("cancelled");

    if (success === "true") {
      // Show success modal instead of toast
      setShowSuccessModal(true);
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
      // Refresh page to fetch latest subscription data
      setTimeout(() => {
        window.location.reload();
      }, 3000); // Reload after 3 seconds to allow user to see success
    } else if (cancelled === "true") {
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled. You can try again anytime.",
        variant: "default",
      });
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [toast]);

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      credits: 1,
      features: [
        "1 job per month",
        "Up to 3 resumes per job",
        "Basic scoring only",
      ],
      current: subscriptionStatus === "free",
      icon: Star,
      color: "text-text-muted",
      bgColor: "bg-bg/30",
      tier: 1,
    },
    {
      name: "Pro",
      price: "$24.99",
      period: "/month",
      credits: 30,
      features: [
        "30 jobs per month",
        "Up to 50 resumes per job",
        "Full breakdowns",
        "PDF reports",
        "Priority support",
      ],
      current: subscriptionStatus === "pro",
      icon: Zap,
      color: "text-primary",
      bgColor: "bg-primary/10",
      tier: 2,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      credits: "Unlimited",
      features: [
        "Unlimited usage",
        "Team access",
        "Custom scoring models",
        "API access",
      ],
      current: subscriptionStatus === "enterprise",
      icon: Crown,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      comingSoon: true,
      tier: 3,
    },
  ];

  // Get current plan tier
  const currentPlanTier = plans.find((plan) => plan.current)?.tier || 1;

  const handleUpgrade = async (planName: string) => {
    if (planName === "Enterprise") {
      toast({
        title: "Enterprise Plan Coming Soon",
        description: "Contact support for early access to Enterprise features.",
        variant: "default",
      });
      return;
    }

    // Handle Free plan locally (no payment processor needed)
    if (planName === "Free") {
      showConfirmation(
        confirmationConfigs.upgradeSubscription(planName),
        async () => {
          await upgradeSubscription("free");
          toast({
            title: "Switched to Free plan",
            description: "You've been switched to the Free plan.",
          });
        }
      );
      return;
    }

    try {
      // Create or get Dodo customer
      if (!user?.email) {
        toast({
          title: "Error",
          description: "User email not found. Please try logging in again.",
          variant: "destructive",
        });
        return;
      }

      // Set loading state for button
      setIsUpgrading(true);

      // Create payment session via backend
      const paymentSession = await dodoPayments.createPaymentSession(
        planName,
        user.email,
        profile?.full_name
      );

      console.log("Payment session response:", paymentSession);

      // Redirect to Dodo checkout
      if (paymentSession.checkout_url) {
        console.log(
          "Redirecting to checkout URL:",
          paymentSession.checkout_url
        );
        window.location.href = paymentSession.checkout_url;
      } else {
        // No checkout URL available - this is an error
        console.error("No checkout URL in response:", paymentSession);
        toast({
          title: "Payment setup failed",
          description:
            "Unable to create checkout session. Please try again later or contact support.",
          variant: "destructive",
        });
        setIsUpgrading(false);
        return;
      }
    } catch (error) {
      console.error("Error creating Dodo checkout:", error);
      setIsUpgrading(false);

      toast({
        title: "Payment system unavailable",
        description:
          "Unable to process payment at this time. Please try again later or contact support.",
        variant: "destructive",
      });
    }
  };

  const handleCancelSubscription = () => {
    showConfirmation(confirmationConfigs.cancelSubscription(), async () => {
      await cancelSubscription();
      toast({
        title: "Subscription cancelled",
        description:
          "You'll keep access until your current billing period ends.",
        variant: "default",
      });
    });
  };

  const handleReactivateSubscription = () => {
    showConfirmation(confirmationConfigs.reactivateSubscription(), async () => {
      await reactivateSubscription();
      toast({
        title: "Subscription reactivated",
        description: "Your subscription has been successfully reactivated.",
      });
    });
  };

  // Function to determine if a plan is an upgrade
  const isUpgrade = (planTier: number) => planTier > currentPlanTier;
  const isDowngrade = (planTier: number) => planTier < currentPlanTier;

  // Handle PDF download
  const handleDownloadPDF = async (subscriptionId: string) => {
    setDownloadingPDF(subscriptionId);
    try {
      const result = await generateBillingPDF(subscriptionId);
      if (!result.success) {
        toast({
          title: "Failed to generate PDF",
          description: result.error || "Please try again later.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Invoice downloaded",
          description: "Your invoice has been downloaded successfully.",
        });
      }
    } catch (error) {
      console.error("PDF download error:", error);
      toast({
        title: "Download failed",
        description: "Failed to download invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingPDF(null);
    }
  };

  // Handle comprehensive billing report download
  const handleDownloadReport = async () => {
    setDownloadingReport(true);
    try {
      const result = await generateBillingReport();
      if (!result.success) {
        toast({
          title: "Failed to generate report",
          description: result.error || "Please try again later.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Billing report downloaded",
          description: "Your comprehensive billing report has been downloaded.",
        });
      }
    } catch (error) {
      console.error("Billing report download error:", error);
      toast({
        title: "Download failed",
        description: "Failed to download billing report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingReport(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text mb-2">
          Billing & Subscription
        </h1>
        <p className="text-text-muted">
          Manage your subscription plan and billing information.
        </p>
      </div>

      {/* Current Plan */}
      <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-grotesk font-semibold text-text">
                Current Plan
              </h2>
              <p className="text-text-muted text-sm">
                Your active subscription details
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="font-grotesk font-semibold text-text capitalize text-lg">
              {subscriptionStatus} Plan
            </p>
            <p className="text-text-muted text-sm">
              {jobCreditsRemaining} credit{jobCreditsRemaining !== 1 ? "s" : ""}{" "}
              remaining
            </p>
          </div>
        </div>

        {/* Cancellation Notice */}
        {isSubscriptionCancelled && subscriptionStatus !== "free" && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-grotesk font-semibold text-yellow-400 mb-1">
                  Subscription Cancelled
                </h3>
                <p className="text-text-muted text-sm mb-3">
                  Your subscription has been cancelled and will not renew.
                  You'll keep access to your current plan until{" "}
                  {subscriptionExpiresAt
                    ? new Date(subscriptionExpiresAt).toLocaleDateString()
                    : "the end of your billing period"}
                  , after which you'll be automatically downgraded to the Free
                  plan.
                </p>
                <Button
                  onClick={handleReactivateSubscription}
                  disabled={isUpdating}
                  size="sm"
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {isUpdating ? "Reactivating..." : "Reactivate Subscription"}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-bg/30 rounded-xl p-4">
            <h3 className="font-grotesk font-medium text-text mb-2">
              Monthly Credits
            </h3>
            <p className="text-2xl font-bold text-primary">
              {subscriptionStatus === "free"
                ? "1"
                : subscriptionStatus === "pro"
                ? "30"
                : "∞"}
            </p>
          </div>

          <div className="bg-bg/30 rounded-xl p-4">
            <h3 className="font-grotesk font-medium text-text mb-2">
              Next Billing
            </h3>
            <p className="text-text-muted">
              {subscription?.current_period_end
                ? new Date(subscription.current_period_end).toLocaleDateString()
                : "No billing"}
            </p>
          </div>

          <div className="bg-bg/30 rounded-xl p-4">
            <h3 className="font-grotesk font-medium text-text mb-2">Status</h3>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                isSubscriptionCancelled
                  ? "bg-yellow-500/10 text-yellow-400"
                  : "bg-green-500/10 text-green-400"
              }`}
            >
              {isSubscriptionCancelled ? "Cancelled" : "Active"}
            </span>
          </div>
        </div>

        {/* Cancel Subscription Button */}
        {subscriptionStatus !== "free" && !isSubscriptionCancelled && (
          <div className="mt-6 pt-6 border-t border-border-custom">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-grotesk font-medium text-text mb-1">
                  Cancel Subscription
                </h3>
                <p className="text-text-muted text-sm">
                  Stop automatic renewal. You'll keep access until your current
                  billing period ends.
                </p>
              </div>
              <Button
                onClick={handleCancelSubscription}
                disabled={isUpdating}
                variant="outline"
                className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
              >
                {isUpdating ? "Cancelling..." : "Cancel Plan"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-semibold text-text mb-6">
          Available Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const canUpgrade = isUpgrade(plan.tier);
            const isCurrentPlan = plan.current;
            const cannotDowngrade = isDowngrade(plan.tier);

            return (
              <div
                key={index}
                className={`
                  bg-bg/50 backdrop-blur-sm border rounded-2xl p-6 shadow-xl transition-all duration-200
                  ${
                    plan.current
                      ? "border-primary shadow-primary/20"
                      : "border-border-custom hover:bg-bg-light"
                  }
                  ${plan.comingSoon || cannotDowngrade ? "opacity-75" : ""}
                `}
              >
                {plan.current && (
                  <div className="mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="flex items-center space-x-3 mb-4">
                  <div
                    className={`w-10 h-10 ${plan.bgColor} rounded-xl flex items-center justify-center`}
                  >
                    <plan.icon className={`w-5 h-5 ${plan.color}`} />
                  </div>
                  <div>
                    <h3 className="font-grotesk font-semibold text-text">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-2xl font-bold text-text">
                        {plan.price}
                      </span>
                      <span className="text-text-muted text-sm">
                        {plan.period}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-text-muted text-sm mb-3">
                    {typeof plan.credits === "number"
                      ? `${plan.credits} credits`
                      : plan.credits}{" "}
                    per month
                  </p>
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center space-x-2 text-sm text-text-muted"
                      >
                        <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => handleUpgrade(plan.name)}
                  disabled={
                    isCurrentPlan ||
                    isUpdating ||
                    plan.comingSoon ||
                    cannotDowngrade ||
                    isUpgrading
                  }
                  className={`
                    w-full transition-all duration-200
                    ${
                      isCurrentPlan
                        ? "bg-bg-light text-text-muted cursor-not-allowed"
                        : plan.comingSoon
                        ? "bg-bg-light text-text-subtle cursor-not-allowed"
                        : cannotDowngrade
                        ? "bg-bg-light text-text-subtle cursor-not-allowed"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground"
                    }
                  `}
                >
                  {isCurrentPlan ? (
                    "Current Plan"
                  ) : plan.comingSoon ? (
                    "Coming Soon"
                  ) : cannotDowngrade ? (
                    "Downgrade Not Available"
                  ) : isUpdating ? (
                    "Updating..."
                  ) : isUpgrading ? (
                    <span className="flex items-center justify-center">
                      <LoaderInline
                        isLoading={true}
                        size="sm"
                        className="mr-2"
                      />
                      Setting up checkout...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      Upgrade to {plan.name}
                      <ExternalLink className="w-3 h-3 ml-1.5" />
                    </span>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-grotesk font-semibold text-text">
                Billing History
              </h2>
              <p className="text-text-muted text-sm">
                Download individual invoices or a comprehensive report
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="border-border-custom hover:bg-bg-light"
            onClick={handleDownloadReport}
            disabled={
              downloadingReport ||
              !billingHistory ||
              billingHistory.length === 0
            }
          >
            {downloadingReport ? (
              <>
                <div className="w-4 h-4 border-2 border-text-muted border-t-transparent rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download All
              </>
            )}
          </Button>
        </div>

        {isHistoryLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-muted">Loading billing history...</p>
          </div>
        ) : !billingHistory || billingHistory.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-text-subtle mx-auto mb-4" />
            <h3 className="font-grotesk font-semibold text-text mb-2">
              No billing history
            </h3>
            <p className="text-text-muted">
              {subscriptionStatus === "free"
                ? "You're on the free plan. Upgrade to see billing history."
                : "No previous subscriptions found."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {billingHistory.map((subscription) => {
              const planPrice =
                subscription.plan_name === "pro"
                  ? "$9.99"
                  : subscription.plan_name === "enterprise"
                  ? "Custom"
                  : "Free";
              const startDate = new Date(
                subscription.current_period_start || subscription.created_at
              );
              const endDate = subscription.current_period_end
                ? new Date(subscription.current_period_end)
                : null;
              const isActive = subscription.status === "active";
              const isCancelled = subscription.status === "cancelled";
              const isExpired = subscription.status === "expired";

              return (
                <div
                  key={subscription.id}
                  className="flex items-center justify-between p-4 bg-bg/30 rounded-xl"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <p className="font-grotesk font-medium text-text capitalize">
                        {subscription.plan_name} Plan
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          isActive
                            ? "bg-green-500/10 text-green-400"
                            : isCancelled
                            ? "bg-yellow-500/10 text-yellow-400"
                            : isExpired
                            ? "bg-red-500/10 text-red-400"
                            : "bg-gray-500/10 text-gray-400"
                        }`}
                      >
                        {subscription.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-text-muted">
                      <span>Started: {startDate.toLocaleDateString()}</span>
                      {endDate && (
                        <span>
                          {isActive ? "Renews" : "Ended"}:{" "}
                          {endDate.toLocaleDateString()}
                        </span>
                      )}
                      {subscription.cancel_at_period_end && (
                        <span className="text-yellow-400">• Cancelled</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {subscription.plan_name !== "free" && (
                      <span className="font-grotesk font-semibold text-text">
                        {planPrice}
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border-custom hover:bg-bg-light"
                      disabled={
                        subscription.plan_name === "free" ||
                        downloadingPDF === subscription.id
                      }
                      onClick={() => handleDownloadPDF(subscription.id)}
                    >
                      {downloadingPDF === subscription.id ? (
                        <div className="w-4 h-4 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmationConfig && (
        <ConfirmationModal
          isOpen={isConfirmationOpen}
          onClose={hideConfirmation}
          onConfirm={confirmAction}
          isLoading={isConfirmationLoading}
          {...confirmationConfig}
        />
      )}

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md bg-bg/95 backdrop-blur-sm border-border-custom">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <PartyPopper className="w-8 h-8 text-green-400" />
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-grotesk font-bold text-text">
              🎉 Welcome to Pro!
            </h3>
            <p className="text-text-muted">
              Your payment was successful! You now have access to all Pro
              features including:
            </p>
            <div className="space-y-2 text-sm text-text-muted">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>30 job analyses per month</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Up to 50 resumes per job</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Full breakdowns & PDF reports</span>
              </div>
            </div>
            <p className="text-xs text-text-subtle">
              Refreshing page to load your new subscription...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsBilling;
