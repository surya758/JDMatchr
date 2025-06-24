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
} from "lucide-react";

const ComparisonSection = () => {
  const comparisons = [
    {
      feature: "Multi-format Uploads",
      icon: Image,
      chatgpt: {
        description: "Text only, no bulk file processing",
      },
      jdmatchr: {
        description: "PDF, JPG, PNG - drag & drop multiple files",
      },
    },
    {
      feature: "Speed & Workflow",
      icon: Zap,
      chatgpt: {
        description: "Manual prompting for each resume",
      },
      jdmatchr: {
        description: "Upload → Paste JD → Get results",
      },
    },
    {
      feature: "Structured Output",
      icon: Puzzle,
      chatgpt: {
        description: "Unstructured text responses",
      },
      jdmatchr: {
        description: "Consistent scoring & ranking format",
      },
    },
    {
      feature: "Team Collaboration",
      icon: FileText,
      chatgpt: {
        description: "Individual chat sessions only",
      },
      jdmatchr: {
        description: "Shareable reports for hiring teams",
      },
    },
    {
      feature: "Domain Expertise",
      icon: Brain,
      chatgpt: {
        description: "Generic text analysis, no hiring context",
      },
      jdmatchr: {
        description: "Trained on hiring patterns and job requirements",
      },
    },
    {
      feature: "Consistency",
      icon: Shield,
      chatgpt: {
        description: "Results vary with prompt quality",
      },
      jdmatchr: {
        description: "Same criteria applied every time",
      },
    },
  ];

  return (
    <section className="py-12 px-6 flex items-center justify-center min-h-[calc(100vh-6rem)]">
      <div className="max-w-5xl mx-auto w-full pt-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Key className="w-4 h-4 text-text-muted" />
            <span className="font-aoenik text-xs text-text-muted uppercase tracking-wider">
              Why JDMatchr
            </span>
          </div>
          <h2 className="font-aoenik text-2xl md:text-3xl font-bold text-text mb-3">
            JDMatchr vs Popular LLMs
          </h2>
          <p className="font-aoenik text-base text-text-muted max-w-2xl mx-auto">
            Purpose-built beats general-purpose for hiring workflows
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {comparisons.map((comparison, index) => (
            <div
              key={index}
              className="bg-bg border border-border-custom rounded-xl p-4 hover:bg-bg-light transition-colors duration-200"
            >
              {/* Feature Header */}
              <div className="flex items-center space-x-2 mb-4">
                <comparison.icon className="w-4 h-4 text-text-muted" />
                <span className="font-aoenik text-sm font-medium text-text">
                  {comparison.feature}
                </span>
              </div>

              {/* LLMs */}
              <div className="mb-3">
                <div className="flex items-center space-x-2 mb-1">
                  <X className="w-3 h-3 text-text-subtle" />
                  <span className="font-aoenik text-xs font-medium text-text-subtle">
                    LLMs
                  </span>
                </div>
                <p className="font-aoenik text-xs text-text-subtle pl-5">
                  {comparison.chatgpt.description}
                </p>
              </div>

              {/* JDMatchr */}
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Check className="w-3 h-3 text-text-muted" />
                  <span className="font-aoenik text-xs font-medium text-text">
                    JDMatchr
                  </span>
                </div>
                <p className="font-aoenik text-xs text-text pl-5">
                  {comparison.jdmatchr.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Note */}
        <div className="text-center mt-8">
          <div className="bg-bg-light border border-border-custom rounded-lg px-4 py-3 inline-block">
            <span className="font-aoenik text-xs text-text-muted">
              <span className="font-medium">Reality check:</span> LLMs works,
              but JDMatchr is built specifically for this
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
