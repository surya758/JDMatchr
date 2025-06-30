import React, { useState, useRef } from "react";
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
  updateJob,
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
  const [isCancelled, setIsCancelled] = useState(false);
  const cancelRef = useRef(false);

  // Hooks
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { jobCreditsRemaining, canUseService, useJobCredit, hasPaymentIssue } =
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
      async () => {
        // Set cancellation flags
        setIsCancelled(true);
        cancelRef.current = true;

        // If we have a current job, mark it as cancelled
        if (currentJobId) {
          try {
            await updateJob(currentJobId, {
              status: "cancelled",
              updated_at: new Date().toISOString(),
            });
          } catch (error) {
            console.error("Failed to update job status:", error);
          }
        }

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
    // Reset cancellation flags
    setIsCancelled(false);
    cancelRef.current = false;
    setProcessingStatus("Starting analysis...");

    try {
      // Check for cancellation before each major step
      if (cancelRef.current) {
        console.log("Analysis cancelled before job description processing");
        return;
      }

      // Step 1: Process job description and create job record in parallel
      setProcessingStatus("Processing job description and initializing...");
      const [formattedJD, job] = await Promise.all([
        // Process job description
        (async () => {
          const jdResult = await jobProcessor.mutateAsync({
            type: "text",
            content: jobDescription,
          });
          return jdResult.formattedJD;
        })(),
        // Create job record
        (async () => {
          const jobData = {
            title: "New Job Analysis", // Will be updated after JD processing
            status: "active",
            raw_description: jobDescription,
          };
          const newJob = await createJob(jobData);
          if (!newJob) throw new Error("Failed to create job");
          setCurrentJobId(newJob.id);
          return newJob;
        })(),
      ]);

      if (cancelRef.current) {
        if (job) {
          await updateJob(job.id, {
            status: "cancelled",
            updated_at: new Date().toISOString(),
          });
        }
        console.log("Analysis cancelled after initialization");
        return;
      }

      // Update job with formatted JD details
      await updateJob(job.id, {
        title: formattedJD.title || "New Job Analysis",
        company: formattedJD.company || "",
        location: formattedJD.location || "",
        employment_type: formattedJD.employmentType || "",
        experience_level: formattedJD.experienceLevel || "",
        formatted_jd: formattedJD as any,
      });

      // Step 2: Process resumes in parallel batches
      setProcessingStatus(
        `Processing ${uploadedResumes.length} resume${
          uploadedResumes.length !== 1 ? "s" : ""
        }...`
      );

      // Process resumes in parallel with a batch size limit
      const BATCH_SIZE = 10; // Process 10 resumes at a time to avoid overwhelming the system
      const processedResumes = [];

      for (let i = 0; i < uploadedResumes.length; i += BATCH_SIZE) {
        if (cancelRef.current) {
          console.log("Analysis cancelled during resume processing");
          await updateJob(job.id, {
            status: "cancelled",
            updated_at: new Date().toISOString(),
          });
          return;
        }

        const batch = uploadedResumes.slice(i, i + BATCH_SIZE);
        setProcessingStatus(`Processing batch...`);

        const batchResults = await Promise.allSettled(
          batch.map(async (file) => {
            try {
              // Process and upload in parallel
              const [resumeResult, uploadResult] = await Promise.all([
                resumeProcessor.mutateAsync({ file }),
                uploadResumeFile({
                  file,
                  userId: job.user_id,
                  jobId: job.id,
                }),
              ]);

              if (!resumeResult.success || !uploadResult.success) {
                throw new Error(`Failed to process or upload ${file.name}`);
              }

              return {
                fileName: file.name,
                fileType: file.type,
                fileUrl: uploadResult.fileUrl,
                filePath: uploadResult.filePath,
                fileSize: file.size,
                processedResume: resumeResult.processedResume,
              };
            } catch (error) {
              console.error(`Failed to process ${file.name}:`, error);
              return null;
            }
          })
        );

        // Filter successful results from this batch
        const successfulBatchResults = batchResults
          .filter(
            (result): result is PromiseFulfilledResult<any> =>
              result.status === "fulfilled" && result.value !== null
          )
          .map((result) => result.value);

        processedResumes.push(...successfulBatchResults);
      }

      if (processedResumes.length === 0) {
        throw new Error("No resumes could be processed successfully");
      }

      if (cancelRef.current) {
        await updateJob(job.id, {
          status: "cancelled",
          updated_at: new Date().toISOString(),
        });
        console.log("Analysis cancelled after resume processing");
        return;
      }

      // Step 3: Create candidates and applications in database (batch operation)
      setProcessingStatus("Saving candidates to database...");
      const { candidates, applications } = await createCandidatesFromResumes(
        job.id,
        processedResumes
      );

      if (cancelRef.current) {
        await updateJob(job.id, {
          status: "cancelled",
          updated_at: new Date().toISOString(),
        });
        console.log("Analysis cancelled after candidate creation");
        return;
      }

      // Step 4: Run AI matching (already processes in batch)
      setProcessingStatus("Running AI candidate matching...");
      const candidateProfiles = processedResumes.map((r) => r.processedResume);
      const rankedCandidates = await matchCandidatesWithAI(
        formattedJD,
        candidateProfiles
      );

      if (cancelRef.current) {
        await updateJob(job.id, {
          status: "cancelled",
          updated_at: new Date().toISOString(),
        });
        console.log("Analysis cancelled after AI matching");
        return;
      }

      // Step 5: Save AI matching results to database (batch operation)
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

      if (cancelRef.current) {
        await updateJob(job.id, {
          status: "cancelled",
          updated_at: new Date().toISOString(),
        });
        console.log("Analysis cancelled after saving matching results");
        return;
      }

      // Step 6: Finalize job
      setProcessingStatus("Finalizing analysis...");
      await Promise.all([markJobAsCompleted(job.id), useJobCredit()]);

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

      // If we have a current job, mark it as failed
      if (currentJobId) {
        try {
          await updateJob(currentJobId, {
            status: "failed",
            updated_at: new Date().toISOString(),
          });
        } catch (updateError) {
          console.error("Failed to update job status:", updateError);
        }
      }

      toast({
        title: "Analysis Failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });

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
      {(!canUseService || hasPaymentIssue) && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <div>
                <h3 className="font-grotesk font-semibold text-red-400 mb-1">
                  {hasPaymentIssue ? "Payment Issue" : "Insufficient Credits"}
                </h3>
                <p className="text-red-300 text-sm">
                  {hasPaymentIssue
                    ? "There is an issue with your payment. Please contact support if needed."
                    : "You need at least 1 credit to perform analysis. Please upgrade your plan."}
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/dashboard/settings/billing")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground ml-4"
            >
              <Zap className="w-6 h-6 mr-1" />
              {hasPaymentIssue ? "Go to Billing" : "Upgrade Plan"}
            </Button>
          </div>
        </div>
      )}

      {/* Main Form */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-8 relative ${
          !canUseService || hasPaymentIssue ? "opacity-50" : ""
        }`}
      >
        {/* Disabled overlay when no credits */}
        {(!canUseService || hasPaymentIssue) && (
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
