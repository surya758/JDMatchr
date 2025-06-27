import React from "react";
import { CheckCircle, Clock } from "lucide-react";

interface AnalysisProgressProps {
  processingStatus: string;
}

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  processingStatus,
}) => {
  // Determine current step based on processing status
  const getCurrentStep = () => {
    const status = processingStatus.toLowerCase();

    if (
      status.includes("job description") ||
      status.includes("starting analysis")
    ) {
      return "job-description";
    } else if (
      status.includes("resume") ||
      status.includes("candidates") ||
      status.includes("creating job")
    ) {
      return "resume-processing";
    } else if (
      status.includes("ai") ||
      status.includes("matching") ||
      status.includes("finalizing")
    ) {
      return "ai-matching";
    }

    return "completed";
  };

  const currentStep = getCurrentStep();

  const getStepIcon = (step: string) => {
    if (currentStep === "completed") {
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    }

    if (currentStep === step) {
      return (
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      );
    }

    // Check if step is completed
    const stepOrder = ["job-description", "resume-processing", "ai-matching"];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);

    if (stepIndex < currentIndex) {
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    }

    return <Clock className="w-4 h-4 text-text-subtle" />;
  };

  return (
    <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-center space-x-3 mb-4">
        <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
        <span className="font-medium text-text">
          {processingStatus || "Processing..."}
        </span>
      </div>

      {/* Dynamic progress indicators */}
      <div className="flex items-center justify-center space-x-8 text-sm text-text-muted">
        <div className="flex items-center space-x-2">
          {getStepIcon("job-description")}
          <span
            className={
              currentStep === "job-description"
                ? "text-primary font-medium"
                : ""
            }
          >
            Job Description
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {getStepIcon("resume-processing")}
          <span
            className={
              currentStep === "resume-processing"
                ? "text-primary font-medium"
                : ""
            }
          >
            Resume Processing
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {getStepIcon("ai-matching")}
          <span
            className={
              currentStep === "ai-matching" ? "text-primary font-medium" : ""
            }
          >
            AI Matching
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnalysisProgress;
