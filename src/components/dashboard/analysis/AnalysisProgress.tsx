import React from "react";
import { CheckCircle, Clock, Loader2 } from "lucide-react";

interface AnalysisProgressProps {
  processingStatus: string;
}

interface StepProgress {
  step: string;
  status: "pending" | "processing" | "completed";
  progress?: number;
  total?: number;
}

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  processingStatus,
}) => {
  // Determine current steps and progress based on processing status
  const getStepsProgress = (): StepProgress[] => {
    const status = processingStatus.toLowerCase();
    const steps: StepProgress[] = [
      { step: "initialization", status: "pending" },
      { step: "resume-processing", status: "pending" },
      { step: "ai-matching", status: "pending" },
    ];

    console.log(status, "status");

    // Check initialization (Job Description + Setup)
    if (status.includes("starting") || status.includes("initializing")) {
      steps[0].status = "processing";
    } else if (
      status.includes("processing batch") ||
      status.includes("resume")
    ) {
      steps[0].status = "completed";
      steps[1].status = "processing";

      // Extract batch progress if available
      const batchMatch = status.match(/batch (\d+) of (\d+)/i);
      if (batchMatch) {
        steps[1].progress = parseInt(batchMatch[1]);
        steps[1].total = parseInt(batchMatch[2]);
      }
    } else if (status.includes("ai") || status.includes("matching")) {
      steps[0].status = "completed";
      steps[1].status = "completed";
      steps[2].status = "processing";
    } else if (status.includes("completed")) {
      steps.forEach((step) => (step.status = "completed"));
    }

    return steps;
  };

  const steps = getStepsProgress();

  const getStepIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-text-subtle opacity-40" />;
    }
  };

  const getStepLabel = (step: StepProgress) => {
    switch (step.step) {
      case "initialization":
        return "Setup";
      case "resume-processing":
        return "Processing";
      case "ai-matching":
        return "Matching";
      default:
        return step.step;
    }
  };

  // Calculate progress line width based on current step
  const getProgressWidth = () => {
    const completedSteps = steps.filter((s) => s.status === "completed").length;
    const hasProcessing = steps.some((s) => s.status === "processing");
    const totalSteps = steps.length - 1; // Subtract 1 as we measure between steps

    if (hasProcessing) {
      const processingIndex = steps.findIndex((s) => s.status === "processing");
      return `${(processingIndex / totalSteps) * 100}%`;
    }

    return `${(completedSteps / totalSteps) * 100}%`;
  };

  return (
    <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-xl p-4 shadow-xl">
      {/* Status message */}
      <div className="flex items-center justify-center mb-4">
        <span className="text-base font-medium text-text">
          {processingStatus || "Processing..."}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-12 flex items-center justify-between mb-4 mx-2">
        {/* Background line */}
        <div className="absolute left-0 right-0 h-[2px] bg-border-custom top-1/2 -translate-y-1/2" />

        {/* Progress line */}
        <div
          className="absolute left-0 h-[2px] bg-primary top-1/2 -translate-y-1/2 transition-all duration-300"
          style={{ width: getProgressWidth() }}
        />

        {/* Step indicators */}
        {steps.map((step, index) => (
          <div
            key={step.step}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Icon */}
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center
                transition-all duration-200 bg-bg border-2
                ${
                  step.status === "processing"
                    ? "border-primary scale-110"
                    : step.status === "completed"
                    ? "border-green-400"
                    : "border-border-custom"
                }
              `}
            >
              {getStepIcon(step.status)}
            </div>

            {/* Label */}
            <span
              className={`
                absolute -bottom-6 text-xs font-medium whitespace-nowrap
                transition-colors duration-200
                ${
                  step.status === "processing"
                    ? "text-primary"
                    : step.status === "completed"
                    ? "text-text"
                    : "text-text-subtle"
                }
              `}
            >
              {getStepLabel(step)}
            </span>
          </div>
        ))}
      </div>

      {/* Batch progress for resume processing */}
      {steps[1].status === "processing" &&
        steps[1].progress &&
        steps[1].total && (
          <div className="mt-6 px-1">
            <div className="h-1 bg-border-custom/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary/50 transition-all duration-300"
                style={{
                  width: `${(steps[1].progress / steps[1].total) * 100}%`,
                }}
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-text-subtle">
                Processing batch {steps[1].progress} of {steps[1].total}
              </span>
              <span className="text-xs font-medium text-text">
                {Math.round((steps[1].progress / steps[1].total) * 100)}%
              </span>
            </div>
          </div>
        )}
    </div>
  );
};

export default AnalysisProgress;
