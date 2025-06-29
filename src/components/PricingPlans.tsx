import { Button } from "@/components/ui/button";
import { Check, X, CreditCard, Crown, Star, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useConfirmation, confirmationConfigs } from "@/hooks/useConfirmation";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import { useState } from "react";

const PricingPlans = () => {
  const { user } = useAuth();
  const {
    subscriptionStatus,
    upgradeSubscription,
    isUpdating,
    jobCreditsRemaining,
    isSubscriptionCancelled,
  } = useSubscription();

  const {
    isOpen: isConfirmationOpen,
    isLoading: isConfirmationLoading,
    config: confirmationConfig,
    showConfirmation,
    hideConfirmation,
    confirmAction,
  } = useConfirmation();

  const [upgrading, setUpgrading] = useState<string | null>(null);

  const plans = [
    {
      name: "Free Plan",
      planKey: "free",
      price: null,
      period: "",
      description: "Perfect for trying out the tool.",
      features: [
        { text: "1 job per month", included: true, icon: Check },
        { text: "Upload up to 3 resumes per job", included: true, icon: Check },
        {
          text: "Full breakdowns (only basic)",
          included: false,
          icon: X,
        },
      ],
      cta: "Get Started Free",
      popular: false,
      icon: Star,
      tier: 1,
    },
    {
      name: "Pro Plan",
      planKey: "pro",
      price: "$14.99",
      period: "/mo",
      description: "Ideal for HRs hiring regularly.",
      features: [
        { text: "30 jobs per month", included: true, icon: Check },
        { text: "Up to 50 resumes per job", included: true, icon: Check },
        {
          text: "Full breakdowns (skills matched/missing)",
          included: true,
          icon: Check,
        },
        { text: "Priority support", included: true, icon: Check },
      ],
      cta: "Start Pro Trial",
      popular: true,
      icon: Zap,
      tier: 2,
    },
    {
      name: "Enterprise",
      planKey: "enterprise",
      price: "Coming Soon",
      period: "",
      description: "For teams and organizations.",
      features: [
        { text: "Unlimited usage", included: true, icon: Check },
        { text: "Team access", included: true, icon: Check },
        { text: "Custom scoring models", included: true, icon: Check },
        { text: "API Access", included: true, icon: Check },
      ],
      cta: "Notify Me",
      popular: false,
      comingSoon: true,
      icon: Crown,
      tier: 3,
    },
  ];

  // Get current plan info
  const currentPlan = plans.find((plan) => plan.planKey === subscriptionStatus);
  const currentPlanTier = currentPlan?.tier || 1;

  // Handle plan selection
  const handlePlanAction = async (plan: (typeof plans)[0]) => {
    // If user is not logged in, redirect to signup/login
    if (!user) {
      if (plan.planKey === "free") {
        window.location.href = "/signup";
      } else {
        window.location.href = "/login";
      }
      return;
    }

    // If it's coming soon, show alert
    if (plan.comingSoon) {
      alert("Enterprise plan coming soon! Contact support for early access.");
      return;
    }

    // If it's current plan, do nothing
    if (plan.planKey === subscriptionStatus) {
      return;
    }

    // If it's a downgrade, prevent it
    if (plan.tier < currentPlanTier) {
      alert(
        "Downgrades are not available. You can cancel your subscription to be downgraded at the end of your billing period."
      );
      return;
    }

    // Handle upgrade
    setUpgrading(plan.planKey);

    showConfirmation(
      confirmationConfigs.upgradeSubscription(plan.name),
      async () => {
        try {
          await upgradeSubscription(
            plan.planKey as "free" | "pro" | "enterprise"
          );
          alert(`Successfully upgraded to ${plan.name}!`);
        } catch (error) {
          console.error("Upgrade error:", error);
          alert("Failed to upgrade. Please try again.");
        } finally {
          setUpgrading(null);
        }
      }
    );
  };

  // Get button text and state for each plan
  const getButtonConfig = (plan: (typeof plans)[0]) => {
    const isCurrentPlan = user && plan.planKey === subscriptionStatus;
    const isUpgrade = user && plan.tier > currentPlanTier;
    const isDowngrade = user && plan.tier < currentPlanTier;
    const isProcessing =
      isUpdating || isConfirmationLoading || upgrading === plan.planKey;

    if (!user) {
      // Not logged in
      return {
        text: plan.planKey === "free" ? "Get Started Free" : "Start Pro Trial",
        disabled: false,
        variant: plan.popular ? "primary" : "outline",
      };
    }

    if (plan.comingSoon) {
      return {
        text: "Coming Soon",
        disabled: true,
        variant: "disabled",
      };
    }

    if (isCurrentPlan) {
      return {
        text: "Current Plan",
        disabled: true,
        variant: "current",
      };
    }

    if (isDowngrade) {
      return {
        text: "Downgrade Not Available",
        disabled: true,
        variant: "disabled",
      };
    }

    if (isUpgrade) {
      return {
        text: isProcessing ? "Upgrading..." : `Upgrade to ${plan.name}`,
        disabled: isProcessing,
        variant: "primary",
      };
    }

    return {
      text: plan.cta,
      disabled: false,
      variant: plan.popular ? "primary" : "outline",
    };
  };

  return (
    <section className="py-12 px-6 flex items-center justify-center min-h-[calc(100vh-6rem)]">
      <div className="max-w-6xl mx-auto w-full navbar-spacing">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <CreditCard className="w-5 h-5 text-text-muted" />
            <span className="font-grotesk text-sm text-text-muted uppercase tracking-wider">
              Pricing Plans
            </span>
          </div>
          <h2 className="font-grotesk text-3xl md:text-4xl font-bold text-text mb-4">
            Simple, Honest
          </h2>
          <p className="font-grotesk text-lg text-text-muted max-w-2xl mx-auto">
            Choose the plan that fits your hiring needs. No hidden fees, no
            surprises.
          </p>

          {/* Current plan status for logged in users */}
          {user && (
            <div className="mt-6 inline-flex items-center space-x-2 px-4 py-2 bg-bg/50 backdrop-blur-sm border border-border-custom rounded-full">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="font-grotesk text-sm text-text">
                Currently on{" "}
                <span className="font-semibold capitalize">
                  {subscriptionStatus}
                </span>{" "}
                Plan
              </span>
              {subscriptionStatus !== "free" && (
                <span className="text-text-muted">•</span>
              )}
              {subscriptionStatus !== "free" && (
                <span className="font-grotesk text-sm text-text-muted">
                  {jobCreditsRemaining} credit
                  {jobCreditsRemaining !== 1 ? "s" : ""} remaining
                </span>
              )}
              {isSubscriptionCancelled && (
                <>
                  <span className="text-yellow-400">•</span>
                  <span className="font-grotesk text-sm text-yellow-400">
                    Cancelled
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const isCurrentPlan = user && plan.planKey === subscriptionStatus;
            const buttonConfig = getButtonConfig(plan);
            const PlanIcon = plan.icon;

            return (
              <div
                key={index}
                className={`bg-bg border rounded-2xl p-8 relative transition-all duration-200 ${
                  plan.comingSoon
                    ? "opacity-75 hover:opacity-90"
                    : "hover:bg-bg-light"
                } ${
                  plan.popular || isCurrentPlan
                    ? "border-primary shadow-lg"
                    : "border-border-custom"
                }`}
              >
                {(plan.popular || isCurrentPlan) && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-medium">
                      {isCurrentPlan ? "Current Plan" : "Most Popular"}
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        isCurrentPlan
                          ? "bg-primary/10"
                          : plan.popular
                          ? "bg-primary/10"
                          : "bg-bg-light"
                      }`}
                    >
                      <PlanIcon
                        className={`w-6 h-6 ${
                          isCurrentPlan
                            ? "text-primary"
                            : plan.popular
                            ? "text-primary"
                            : "text-text-muted"
                        }`}
                      />
                    </div>
                  </div>

                  <h3 className="font-grotesk text-xl font-semibold text-text mb-2">
                    {plan.name}
                  </h3>

                  <div className="mb-4">
                    {plan.price === "Coming Soon" ? (
                      <div className="text-2xl font-bold text-text-subtle">
                        Coming Soon
                      </div>
                    ) : plan.price ? (
                      <div>
                        <span className="text-3xl font-bold text-text">
                          {plan.price}
                        </span>
                        <span className="text-text-muted">{plan.period}</span>
                      </div>
                    ) : (
                      <div className="text-3xl font-bold text-text">Free</div>
                    )}
                  </div>

                  <p className="font-grotesk text-sm text-text-subtle">
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div
                      key={featureIndex}
                      className="flex items-start space-x-3"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-text-muted" />
                        ) : (
                          <X className="w-4 h-4 text-text-subtle" />
                        )}
                      </div>
                      <span
                        className={`font-grotesk text-sm ${
                          feature.included
                            ? "text-text"
                            : "text-text-subtle line-through"
                        }`}
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  disabled={buttonConfig.disabled}
                  onClick={() => handlePlanAction(plan)}
                  className={`w-full font-grotesk transition-all duration-200 ${
                    buttonConfig.variant === "primary"
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : buttonConfig.variant === "current"
                      ? "bg-primary/10 text-primary border border-primary/20 cursor-default"
                      : buttonConfig.variant === "disabled"
                      ? "bg-bg-light text-text-subtle border border-border-custom cursor-not-allowed"
                      : "bg-bg-light hover:bg-border-custom text-text border border-border-custom"
                  }`}
                >
                  {buttonConfig.text}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <div className="text-center mt-12">
          <p className="font-grotesk text-sm text-text-subtle">
            All plans include SSL security and data encryption. Cancel anytime.
          </p>
          {user && subscriptionStatus !== "free" && (
            <p className="font-grotesk text-xs text-text-subtle mt-2">
              Need to downgrade? You can cancel your subscription in your
              dashboard settings.
            </p>
          )}
        </div>
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
    </section>
  );
};

export default PricingPlans;
