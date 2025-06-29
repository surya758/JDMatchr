import React, { useState } from "react";
import { AlertCircle, Zap, ArrowRight, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../hooks/use-toast";
import { useSubscription } from "../../hooks/useSubscription";
import {
  useConfirmation,
  confirmationConfigs,
} from "../../hooks/useConfirmation";
import ConfirmationModal from "../ui/confirmation-modal";
import { useJobDescriptionProcessor } from "../../hooks/useJobDescriptionProcessor";
import { useResumeProcessor } from "../../hooks/useResumeProcessor";
import { uploadResumeFile } from "../../lib/storage";
import {
  createJob,
  createCandidatesFromResumes,
  updateJobApplicationsWithMatchingResults,
  markJobAsCompleted,
} from "../../lib/jobs";
import { matchCandidatesWithAI } from "../../lib/ai-matching";
import { FormattedJD } from "@/hooks/useJobDescriptionProcessor";

// Import the components
import JobDescriptionUpload from "./analysis/JobDescriptionUpload";
import ResumeUpload from "./analysis/ResumeUpload";
import AnalyzingMode from "./analysis/AnalyzingMode";

const NewAnalysis = () => {
  // State management
  const [jobDescription, setJobDescription] = useState("");
  const [uploadedResumes, setUploadedResumes] = useState<File[]>([]);
  const [isJdDragging, setIsJdDragging] = useState(false);
  const [isResumeDragging, setIsResumeDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [contentSource, setContentSource] = useState<"manual" | "file" | null>(
    null
  );
  const [isImageFile, setIsImageFile] = useState<boolean>(false);

  // Hooks
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { jobCreditsRemaining, canUseService, useJobCredit } =
    useSubscription();
  const jobProcessor = useJobDescriptionProcessor();
  const resumeProcessor = useResumeProcessor();

  const {
    isOpen: isConfirmationOpen,
    isLoading: isConfirmationLoading,
    config: confirmationConfig,
    showConfirmation,
    hideConfirmation,
    confirmAction,
  } = useConfirmation();

  // Check if form is ready for analysis
  const isFormReady =
    jobDescription.trim().length > 50 &&
    uploadedResumes.length > 0 &&
    !jobProcessor.isPending;

  const formatJDForDisplay = (formattedJD: FormattedJD): string => {
    return `**${formattedJD.title || "Job Title"}**
${formattedJD.company ? `at ${formattedJD.company}` : ""}
${formattedJD.location ? `📍 ${formattedJD.location}` : ""}
${formattedJD.employmentType ? `💼 ${formattedJD.employmentType}` : ""}
${formattedJD.experienceLevel ? `📊 ${formattedJD.experienceLevel}` : ""}

**Required Skills:**
${
  formattedJD.requiredSkills && formattedJD.requiredSkills.length > 0
    ? formattedJD.requiredSkills.map((req) => `• ${req}`).join("\n")
    : "• No specific requirements listed"
}

**Preferred Skills:**
${
  formattedJD.preferredSkills && formattedJD.preferredSkills.length > 0
    ? formattedJD.preferredSkills.map((skill) => `• ${skill}`).join("\n")
    : "• No preferred skills listed"
}

**Job Summary:**
${formattedJD.summary || "No summary provided"}

${
  formattedJD.benefits && formattedJD.benefits.length > 0
    ? `**Benefits:**
${formattedJD.benefits.map((benefit) => `• ${benefit}`).join("\n")}`
    : ""
}

${
  formattedJD.responsibilities && formattedJD.responsibilities.length > 0
    ? `**Responsibilities:**
${formattedJD.responsibilities.map((resp) => `• ${resp}`).join("\n")}`
    : ""
}`;
  };

  // Event handlers
  const handleJobDescriptionChange = (value: string) => {
    setJobDescription(value);
    setContentSource("manual");
    setIsImageFile(false);
  };

  const handleJobDescriptionFileUpload = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    const allowedTypes = [
      "text/plain",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF, Word document, text file, or image",
        variant: "destructive",
      });
      return;
    }

    jobProcessor.mutate(
      { type: "file", file },
      {
        onSuccess: (data) => {
          let displayContent;
          if (
            data.isImageFile ||
            data.originalContent === "Image processed directly" ||
            data.originalContent === "PDF processed directly"
          ) {
            displayContent = formatJDForDisplay(data.formattedJD);
          } else {
            displayContent = data.originalContent;
          }

          setJobDescription(displayContent);
          setContentSource("file");
          setIsImageFile(data.isImageFile || false);

          toast({
            title: "File Processed",
            description: `Successfully extracted job description from ${file.name}`,
          });
        },
        onError: (error) => {
          console.error("Error processing file:", error);
          toast({
            title: "Failed to process file",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleResumeFileUpload = (files: File[]) => {
    setUploadedResumes(files);
  };

  const handleRemoveResume = (index: number) => {
    const newResumes = uploadedResumes.filter((_, i) => i !== index);
    setUploadedResumes(newResumes);
  };

  const handleStartAnalysis = () => {
    if (!canUseService) {
      toast({
        title: "Insufficient Credits",
        description:
          "You need credits to perform analysis. Please upgrade your plan.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    startAnalysis();
  };

  const handleCancelAnalysis = () => {
    showConfirmation(
      {
        title: "Cancel Analysis",
        description:
          "Are you sure you want to cancel the current analysis? This action cannot be undone.",
        confirmText: "Yes, Cancel",
        cancelText: "Continue Analysis",
        variant: "destructive" as const,
      },
      () => {
        setIsAnalyzing(false);
        setProcessingStatus("");
        setCurrentJobId(null);
        toast({
          title: "Analysis Cancelled",
          description: "The analysis has been cancelled successfully.",
        });
      }
    );
  };

  const startAnalysis = async () => {
    setProcessingStatus("Starting analysis...");

    try {
      // Step 1: Process job description
      let formattedJD;
      if (contentSource === "file") {
        setProcessingStatus("Using processed job description...");
        const jdResult = await jobProcessor.mutateAsync({
          type: "text",
          content: jobDescription,
        });
        formattedJD = jdResult.formattedJD;
      } else {
        setProcessingStatus("Processing job description...");
        const jdResult = await jobProcessor.mutateAsync({
          type: "text",
          content: jobDescription,
        });
        formattedJD = jdResult.formattedJD;
      }

      // Step 2: Create job in database
      setProcessingStatus("Creating job record...");
      const job = await createJob({
        title: formattedJD.title || "New Job Analysis",
        company: formattedJD.company || "",
        location: formattedJD.location || "",
        employment_type: formattedJD.employmentType || "",
        experience_level: formattedJD.experienceLevel || "",
        raw_description: jobDescription,
        formatted_jd: formattedJD as any,
        status: "active",
      });

      if (!job) {
        throw new Error("Failed to create job");
      }

      setCurrentJobId(job.id);

      // Step 3: Process resumes
      setProcessingStatus(
        `Processing ${uploadedResumes.length} resume${
          uploadedResumes.length !== 1 ? "s" : ""
        }...`
      );
      const processedResumes = [];

      for (let i = 0; i < uploadedResumes.length; i++) {
        const file = uploadedResumes[i];
        setProcessingStatus(
          `Processing resume ${i + 1} of ${uploadedResumes.length}: ${
            file.name
          }`
        );

        try {
          const resumeResult = await resumeProcessor.mutateAsync({
            file: file,
          });

          if (resumeResult.success) {
            const uploadResult = await uploadResumeFile({
              file: file,
              userId: job.user_id,
              jobId: job.id,
            });

            if (!uploadResult.success) {
              console.error(
                `Storage upload failed for ${file.name}:`,
                uploadResult.error
              );
              throw new Error(
                `Failed to upload ${file.name} to storage: ${uploadResult.error}`
              );
            }

            processedResumes.push({
              fileName: file.name,
              fileType: file.type,
              fileUrl: uploadResult.fileUrl,
              filePath: uploadResult.filePath,
              fileSize: file.size,
              processedResume: resumeResult.processedResume,
            });
          }
        } catch (error) {
          console.error(`Failed to process ${file.name}:`, error);
        }
      }

      if (processedResumes.length === 0) {
        throw new Error("No resumes could be processed successfully");
      }

      // Step 4: Create candidates and applications in database
      setProcessingStatus("Saving candidates to database...");
      const { candidates, applications } = await createCandidatesFromResumes(
        job.id,
        processedResumes
      );

      // Step 5: Run AI matching
      setProcessingStatus("Running AI candidate matching...");
      const candidateProfiles = processedResumes.map((r) => r.processedResume);
      const rankedCandidates = await matchCandidatesWithAI(
        formattedJD,
        candidateProfiles
      );

      // Step 6: Save AI matching results to database
      setProcessingStatus("Saving matching results...");
      const matchingUpdateSuccess =
        await updateJobApplicationsWithMatchingResults(
          job.id,
          rankedCandidates.map((candidate) => ({
            candidateId: candidate.candidateId,
            candidateName: candidate.candidateName,
            matchingScore: candidate.matchingScore,
            ranking: candidate.ranking,
            summary: candidate.summary,
          }))
        );

      if (!matchingUpdateSuccess) {
        console.warn(
          "Failed to update some matching results, but continuing..."
        );
      }

      // Step 7: Mark job as completed
      setProcessingStatus("Finalizing job status...");
      await markJobAsCompleted(job.id);

      // Step 8: Use credit
      setProcessingStatus("Finalizing analysis...");
      await useJobCredit();

      setProcessingStatus("Analysis completed successfully!");

      // Invalidate and refetch job reports to get the latest data
      await queryClient.invalidateQueries({ queryKey: ["job-reports"] });

      toast({
        title: "Analysis Complete!",
        description: `Successfully analyzed ${processedResumes.length} candidates and saved to database.`,
      });

      // Reset form and navigate immediately to My Reports
      setJobDescription("");
      setUploadedResumes([]);
      setContentSource(null);
      setIsImageFile(false);
      setIsAnalyzing(false);
      setProcessingStatus("");
      setCurrentJobId(null);

      // Navigate to My Reports page immediately
      navigate("/dashboard/reports");

      console.log("Job created:", job.id);
      console.log("Candidates:", candidates.length);
      console.log("Ranked results:", rankedCandidates.length);
    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        title: "Analysis Failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setProcessingStatus("");
    }
  };

  // Render analyzing mode
  if (isAnalyzing) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-text mb-2">New Analysis</h1>
          <p className="text-text-muted">
            Upload resumes and provide a job description to start matching
            candidates.
          </p>
        </div>

        <AnalyzingMode
          processingStatus={processingStatus}
          onCancel={handleCancelAnalysis}
        />

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
  }

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
          <div className="flex items-center justify-between">
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
            <Button
              onClick={() => navigate("/dashboard/settings/billing")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground ml-4"
            >
              <Zap className="w-6 h-6 mr-1" />
              Upgrade Plan
            </Button>
          </div>
        </div>
      )}

      {/* Main Form */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-8 relative ${
          !canUseService ? "opacity-50" : ""
        }`}
      >
        {/* Disabled overlay when no credits */}
        {!canUseService && (
          <div className="absolute inset-0 bg-transparent z-10 cursor-not-allowed" />
        )}

        <JobDescriptionUpload
          jobDescription={jobDescription}
          onJobDescriptionChange={handleJobDescriptionChange}
          onFileUpload={handleJobDescriptionFileUpload}
          isProcessing={jobProcessor.isPending}
          contentSource={contentSource}
          isDragging={isJdDragging}
          onDragStateChange={setIsJdDragging}
        />

        <ResumeUpload
          uploadedResumes={uploadedResumes}
          onFileUpload={handleResumeFileUpload}
          onRemoveResume={handleRemoveResume}
          isDragging={isResumeDragging}
          onDragStateChange={setIsResumeDragging}
          isDisabled={jobProcessor.isPending}
        />
      </div>

      {/* Start Analysis Button - Show when form is ready */}
      {isFormReady && (
        <div className="text-center">
          <div className="max-w-md mx-auto">
            <Button
              onClick={handleStartAnalysis}
              disabled={
                !canUseService ||
                isConfirmationLoading ||
                jobProcessor.isPending
              }
              className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-2xl hover:shadow-primary/20 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Zap className="w-6 h-6 mr-3" />
              Start Analysis
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>

            <div className="mt-4 text-center">
              <p className="text-text-muted text-sm">
                Credits available:{" "}
                <span className="font-semibold text-primary">
                  {jobCreditsRemaining}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

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
