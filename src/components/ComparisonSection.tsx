import React from "react";
import {
  Check,
  X,
  Key,
  Puzzle,
  Image,
  Zap,
  FileText,
  Package,
  Shield,
  Brain,
  Briefcase,
  Coins,
  Users,
  Bot,
  LineChart,
} from "lucide-react";

const ComparisonSection = () => {
  const comparisons = [
    {
      feature: "Multi-format Uploads",
      icon: Image,
      llms: {
        description: "Text only, no bulk file processing",
        hasFeature: false,
      },
      ats: {
        description: "Limited formats, manual parsing needed",
        hasFeature: false,
      },
      jdmatchr: {
        description: "PDF, DOCX, JPG, PNG with bulk processing",
        hasFeature: true,
      },
    },
    {
      feature: "AI-Powered Analysis",
      icon: Brain,
      llms: {
        description: "Generic text analysis, no hiring context",
        hasFeature: false,
      },
      ats: {
        description: "Basic keyword matching",
        hasFeature: false,
      },
      jdmatchr: {
        description: "Deep learning with hiring expertise",
        hasFeature: true,
      },
    },
    {
      feature: "Speed & Efficiency",
      icon: Zap,
      llms: {
        description: "Manual prompting for each resume",
        hasFeature: false,
      },
      ats: {
        description: "Slow manual screening required",
        hasFeature: false,
      },
      jdmatchr: {
        description: "Instant batch processing & ranking",
        hasFeature: true,
      },
    },
    {
      feature: "Cost Effectiveness",
      icon: Coins,
      llms: {
        description: "Pay per token, unpredictable costs",
        hasFeature: false,
      },
      ats: {
        description: "High monthly fees, complex pricing",
        hasFeature: false,
      },
      jdmatchr: {
        description: "Simple per-job pricing, no surprises",
        hasFeature: true,
      },
    },
    {
      feature: "Structured Output",
      icon: Puzzle,
      llms: {
        description: "Unstructured text responses",
        hasFeature: false,
      },
      ats: {
        description: "Basic candidate profiles",
        hasFeature: false,
      },
      jdmatchr: {
        description: "Detailed scoring & insights",
        hasFeature: true,
      },
    },
    {
      feature: "Bias Mitigation",
      icon: Shield,
      llms: {
        description: "No built-in bias controls",
        hasFeature: false,
      },
      ats: {
        description: "Basic compliance tools",
        hasFeature: false,
      },
      jdmatchr: {
        description: "Advanced fairness algorithms",
        hasFeature: true,
      },
    },
  ];

  return (
    <section className="py-12 px-6 flex items-center justify-center min-h-[calc(100vh-6rem)]">
      <div className="max-w-6xl mx-auto w-full navbar-spacing">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Key className="w-4 h-4 text-text-muted" />
            <span className="font-grotesk text-xs text-text-muted uppercase tracking-wider">
              Why jdmatchr
            </span>
          </div>
          <h2 className="font-grotesk text-2xl md:text-3xl font-bold text-text mb-3">
            jdmatchr vs LLMs & Traditional ATS
          </h2>
          <p className="font-grotesk text-base text-text-muted max-w-2xl mx-auto">
            Purpose-built AI for modern hiring workflows
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {comparisons.map((comparison, index) => (
            <div
              key={index}
              className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-xl p-6 hover:bg-bg-light/50 transition-all duration-200"
            >
              {/* Feature Header */}
              <div className="flex items-center space-x-2 mb-6">
                <comparison.icon className="w-5 h-5 text-primary" />
                <span className="font-grotesk text-sm font-medium text-text">
                  {comparison.feature}
                </span>
              </div>

              {/* LLMs */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Bot className="w-4 h-4 text-text-muted" />
                  <span className="font-grotesk text-xs font-medium text-text-muted">
                    LLMs
                  </span>
                  {comparison.llms.hasFeature ? (
                    <Check className="w-3 h-3 text-green-400 ml-auto" />
                  ) : (
                    <X className="w-3 h-3 text-text-subtle ml-auto" />
                  )}
                </div>
                <p className="font-grotesk text-xs text-text-subtle">
                  {comparison.llms.description}
                </p>
              </div>

              {/* Traditional ATS */}
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Briefcase className="w-4 h-4 text-text-muted" />
                  <span className="font-grotesk text-xs font-medium text-text-muted">
                    Traditional ATS
                  </span>
                  {comparison.ats.hasFeature ? (
                    <Check className="w-3 h-3 text-green-400 ml-auto" />
                  ) : (
                    <X className="w-3 h-3 text-text-subtle ml-auto" />
                  )}
                </div>
                <p className="font-grotesk text-xs text-text-subtle">
                  {comparison.ats.description}
                </p>
              </div>

              {/* jdmatchr */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="w-4 h-4 text-primary" />
                  <span className="font-grotesk text-xs font-medium text-text">
                    jdmatchr
                  </span>
                  {comparison.jdmatchr.hasFeature && (
                    <Check className="w-3 h-3 text-green-400 ml-auto" />
                  )}
                </div>
                <p className="font-grotesk text-xs text-text">
                  {comparison.jdmatchr.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Note */}
        <div className="text-center mt-12">
          <div className="bg-bg-light/50 backdrop-blur-sm border border-border-custom rounded-xl px-6 py-4 inline-block">
            <span className="font-grotesk text-xs text-text-muted">
              <span className="font-medium">Reality Check:</span> The rest can
              try. jdmatchr was designed to deliver.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
