import React, { useState } from "react";
import { Upload, FileText, Users, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useSubscription } from "../../hooks/useSubscription";
import {
  useConfirmation,
  confirmationConfigs,
} from "../../hooks/useConfirmation";
import ConfirmationModal from "../ui/confirmation-modal";

const NewAnalysis = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [uploadedResumes, setUploadedResumes] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { jobCreditsRemaining, canUseService, useJobCredit } =
    useSubscription();

  const {
    isOpen: isConfirmationOpen,
    isLoading: isConfirmationLoading,
    config: confirmationConfig,
    showConfirmation,
    hideConfirmation,
    confirmAction,
  } = useConfirmation();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedResumes((prev) => [...prev, ...files]);
  };

  const removeResume = (index: number) => {
    setUploadedResumes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = () => {
    if (!canUseService) {
      alert("You need credits to perform analysis. Please upgrade your plan.");
      return;
    }

    showConfirmation(
      confirmationConfigs.startAnalysis(uploadedResumes.length),
      async () => {
        setIsAnalyzing(true);
        try {
          // Use a credit first
          await useJobCredit();

          // TODO: Implement analysis logic
          setTimeout(() => {
            setIsAnalyzing(false);
            alert("Analysis complete! (This is a demo)");
          }, 3000);
        } catch (error) {
          setIsAnalyzing(false);
          alert("Failed to start analysis. Please try again.");
        }
      }
    );
  };

  const isFormValid =
    jobDescription.trim().length > 50 && uploadedResumes.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text mb-2">New Analysis</h1>
        <p className="text-text-muted">
          Upload resumes and provide a job description to start matching
          candidates.
        </p>
      </div>

      {/* Credits Warning */}
      {!canUseService && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <div>
              <h3 className="font-grotesk font-semibold text-red-400 mb-1">
                Insufficient Credits
              </h3>
              <p className="text-red-300 text-sm">
                You need at least 1 credit to perform analysis. Please upgrade
                your plan.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Job Description Section */}
        <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-grotesk font-semibold text-text">
                Job Description
              </h2>
              <p className="text-text-muted text-sm">
                Paste the job requirements and description
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here. Include required skills, experience, qualifications, and responsibilities..."
              className="min-h-[300px] bg-bg/30 border-border-custom focus:border-primary/50 focus:ring-0 focus:outline-none transition-border-colors duration-300 resize-none"
            />

            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">
                {jobDescription.length} characters
              </span>
              <span
                className={`${
                  jobDescription.length >= 50
                    ? "text-green-400"
                    : "text-text-subtle"
                }`}
              >
                Minimum 50 characters required
              </span>
            </div>
          </div>
        </div>

        {/* Resume Upload Section */}
        <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="font-grotesk font-semibold text-text">
                Resume Upload
              </h2>
              <p className="text-text-muted text-sm">
                Upload candidate resumes to analyze
              </p>
            </div>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-border-custom rounded-xl p-8 text-center hover:border-primary/50 transition-colors duration-200">
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
              id="resume-upload"
            />
            <label htmlFor="resume-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="font-grotesk font-semibold text-text mb-2">
                Upload Resume Files
              </h3>
              <p className="text-text-muted text-sm mb-4">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-text-subtle text-xs">
                Supports PDF, DOC, DOCX, TXT files
              </p>
            </label>
          </div>

          {/* Uploaded Files */}
          {uploadedResumes.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-grotesk font-semibold text-text">
                Uploaded Resumes ({uploadedResumes.length})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {uploadedResumes.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-bg/30 rounded-lg border border-border-custom"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-text-muted" />
                      <span className="font-grotesk text-sm text-text truncate">
                        {file.name}
                      </span>
                    </div>
                    <button
                      onClick={() => removeResume(index)}
                      className="text-red-400 hover:text-red-300 transition-colors duration-200"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Section */}
      <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-grotesk font-semibold text-text mb-2">
              Ready to Analyze
            </h3>
            <p className="text-text-muted text-sm">
              {isFormValid
                ? `Analyze ${uploadedResumes.length} resume${
                    uploadedResumes.length !== 1 ? "s" : ""
                  } against the job description`
                : "Complete the job description and upload resumes to start analysis"}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-text-muted text-sm">Credits available</p>
              <p className="font-grotesk font-semibold text-primary">
                {jobCreditsRemaining}
              </p>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={
                !isFormValid ||
                !canUseService ||
                isAnalyzing ||
                isConfirmationLoading
              }
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 py-3 transition-all duration-200 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  Start Analysis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
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
    </div>
  );
};

export default NewAnalysis;
