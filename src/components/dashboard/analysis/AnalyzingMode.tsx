import React from "react";
import { Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnalysisProgress from "./AnalysisProgress";

interface AnalyzingModeProps {
  processingStatus: string;
  onCancel: () => void;
}

const AnalyzingMode: React.FC<AnalyzingModeProps> = ({
  processingStatus,
  onCancel,
}) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Coffee Animation */}
        <div className="relative">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center animate-pulse">
              <Coffee className="w-12 h-12 text-primary" />
            </div>
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary/20 rounded-full animate-ping"></div>
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-primary/20 rounded-full animate-ping delay-300"></div>
        </div>

        {/* Main Message */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-text font-grotesk">
            Analysis in Progress
          </h1>
          <p className="text-xl text-text-muted">
            Grab a coffee ☕ while we analyze your candidates
          </p>
          <p className="text-text-subtle">
            This may take a few minutes depending on the number of resumes
          </p>
        </div>

        {/* Progress */}
        <AnalysisProgress processingStatus={processingStatus} />

        {/* Cancel Button */}
        <div className="pt-4">
          <Button
            onClick={onCancel}
            variant="outline"
            className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30"
          >
            Cancel Analysis
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnalyzingMode;
