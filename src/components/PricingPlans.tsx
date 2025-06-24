import { Button } from "@/components/ui/button";
import { Check, X, CreditCard } from "lucide-react";

const PricingPlans = () => {
  const plans = [
    {
      name: "Free Plan",
      price: null,
      period: "",
      description: "Perfect for trying out the tool.",
      features: [
        { text: "1 job per month", included: true, icon: Check },
        { text: "Upload up to 3 resumes per job", included: true, icon: Check },
        {
          text: "Basic scoring only (no breakdowns)",
          included: true,
          icon: Check,
        },
        { text: "No saved history", included: false, icon: X },
        { text: "No PDF reports", included: false, icon: X },
      ],
      cta: "Get Started Free",
      popular: false,
    },
    {
      name: "Pro Plan",
      price: "$9.99",
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
        { text: "Export PDF reports", included: true, icon: Check },
        { text: "Resume history for 30 days", included: true, icon: Check },
        { text: "Priority support", included: true, icon: Check },
      ],
      cta: "Start Pro Trial",
      popular: true,
    },
    {
      name: "Enterprise",
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
    },
  ];

  return (
    <section className="py-12 px-6 flex items-center justify-center min-h-[calc(100vh-6rem)]">
      <div className="max-w-6xl mx-auto w-full pt-20">
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
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-bg border rounded-2xl p-8 relative transition-all duration-200 ${
                plan.comingSoon
                  ? "opacity-75 hover:opacity-90"
                  : "hover:bg-bg-light"
              } ${
                plan.popular
                  ? "border-primary shadow-lg"
                  : "border-border-custom"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-medium">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
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
                disabled={plan.comingSoon}
                onClick={
                  plan.comingSoon
                    ? undefined
                    : () =>
                        (window.location.href =
                          plan.name === "Free Plan" ? "/signup" : "/login")
                }
                className={`w-full font-grotesk transition-all duration-200 ${
                  plan.comingSoon
                    ? "bg-bg-light text-text-subtle border border-border-custom cursor-not-allowed"
                    : plan.popular
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-bg-light hover:bg-border-custom text-text border border-border-custom"
                }`}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* Bottom Note */}
        <div className="text-center mt-12">
          <p className="font-grotesk text-sm text-text-subtle">
            All plans include SSL security and data encryption. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingPlans;
