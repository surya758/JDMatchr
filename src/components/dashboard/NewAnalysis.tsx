import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Users,
  ArrowRight,
  AlertCircle,
  X,
  File,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { createJob, createCandidatesFromResumes } from "../../lib/jobs";
import { matchCandidatesWithAI } from "../../lib/ai-matching";
import { LoaderOverlay } from "@/components/ui/loader";
import { useAuth } from "@/hooks/useAuth";
import { LoaderInline } from "@/components/ui/loader";
import { FormattedJD } from "@/hooks/useJobDescriptionProcessor";

const NewAnalysis = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [uploadedResumes, setUploadedResumes] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isJdDragging, setIsJdDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [interfaceMode, setInterfaceMode] = useState<
    "initial" | "typing" | "uploaded"
  >("initial");
  const [contentSource, setContentSource] = useState<"manual" | "file" | null>(
    null
  );
  const [isImageFile, setIsImageFile] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Job Description drag & drop handlers
  const handleJdDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsJdDragging(true);
  };

  const handleJdDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsJdDragging(false);
  };

  const handleJdDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsJdDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleJdFileUpload(files[0]);
    }
  };

  const handleJdFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleJdFileUpload(e.target.files[0]);
    }
  };

  const handleJdFileUpload = (file: File) => {
    // Check if file type is supported
    const textTypes = [
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const textExtensions = [".txt", ".docx"];
    const imageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ];

    const isTextFile =
      textTypes.includes(file.type) ||
      textExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    const isImageFile = imageTypes.includes(file.type.toLowerCase());
    const isPDFFile =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isTextFile && !isImageFile && !isPDFFile) {
      toast({
        title: "Unsupported File Type",
        description: "Please upload TXT, DOCX, PDF, or image files.",
        variant: "destructive",
      });
      return;
    }

    jobProcessor.mutate(
      { type: "file", file },
      {
        onSuccess: (data) => {
          // For image and PDF files, format the structured JD data nicely
          let displayContent;
          if (
            data.isImageFile ||
            data.originalContent === "Image processed directly" ||
            data.originalContent === "PDF processed directly"
          ) {
            // Format the structured job description for display
            displayContent = formatJDForDisplay(data.formattedJD);
          } else {
            // For text files, use the original content
            displayContent = data.originalContent;
          }

          setJobDescription(displayContent);
          setContentSource("file");
          setInterfaceMode("uploaded");
          setIsImageFile(data.isImageFile || false);

          // Reset file input so the same file can be uploaded again
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }

          toast({
            title: "File Processed",
            description: `Successfully extracted job description from ${file.name}`,
          });
        },
        onError: (error) => {
          console.error("Error processing file:", error);

          // Reset file input on error as well
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          toast({
            title: "Failed to process file",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setJobDescription(value);

    // Update interface mode based on content
    if (value.trim()) {
      setInterfaceMode("typing");
      setContentSource("manual");
      setIsImageFile(false); // Reset image flag when manually typing
    } else {
      setInterfaceMode("initial");
      setContentSource(null);
      setIsImageFile(false);
    }
  };

  const handleShowUpload = () => {
    setInterfaceMode("initial");
    // Clear any existing content if user wants to upload instead
    setJobDescription("");
    setContentSource(null);
    setIsImageFile(false);

    // Reset file input for clean state
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadAgain = () => {
    setInterfaceMode("initial");
    setJobDescription("");
    setContentSource(null);
    setIsImageFile(false);

    // Reset file input for clean state
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Resume upload handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedResumes((prev) => [...prev, ...files].slice(0, 20)); // Limit to 20 files
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setUploadedResumes((prev) => [...prev, ...droppedFiles].slice(0, 20));
  };

  const removeResume = (index: number) => {
    setUploadedResumes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = () => {
    if (!canUseService) {
      toast({
        title: "Insufficient Credits",
        description:
          "You need credits to perform analysis. Please upgrade your plan.",
        variant: "destructive",
      });
      return;
    }

    showConfirmation(
      confirmationConfigs.startAnalysis(uploadedResumes.length),
      async () => {
        await startAnalysis();
      }
    );
  };

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setProcessingStatus("Starting analysis...");

    try {
      // Step 1: Process job description (if not already processed)
      let formattedJD;
      if (contentSource === "file") {
        // Job description already processed from file
        setProcessingStatus("Using processed job description...");
        const jdResult = await jobProcessor.mutateAsync({
          type: "text",
          content: jobDescription,
        });
        formattedJD = jdResult.formattedJD;
      } else {
        // Process manually entered job description
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
          // Process resume content
          const resumeResult = await resumeProcessor.mutateAsync({
            file: file,
          });

          if (resumeResult.success) {
            // Upload file to storage
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
          // Continue with other files
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

      // Step 6: Update matching scores in database
      setProcessingStatus("Updating matching scores...");
      // TODO: Update job_applications with matching scores

      // Step 7: Use credit only after everything is successful
      setProcessingStatus("Finalizing analysis...");
      await useJobCredit();

      setProcessingStatus("Analysis completed successfully!");

      toast({
        title: "Analysis Complete!",
        description: `Successfully analyzed ${processedResumes.length} candidates and saved to database.`,
      });

      // TODO: Navigate to job results page
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

  const isFormValid =
    jobDescription.trim().length > 50 && uploadedResumes.length > 0;

  // Helper function to format FormattedJD into readable text
  const formatJDForDisplay = (formattedJD: FormattedJD): string => {
    const sections = [];

    // Job Title and Company
    if (formattedJD.title) {
      sections.push(`Job Title: ${formattedJD.title}`);
    }
    if (formattedJD.company) {
      sections.push(`Company: ${formattedJD.company}`);
    }
    if (formattedJD.location) {
      sections.push(`Location: ${formattedJD.location}`);
    }
    if (formattedJD.employmentType) {
      sections.push(`Employment Type: ${formattedJD.employmentType}`);
    }
    if (formattedJD.experienceLevel) {
      sections.push(`Experience Level: ${formattedJD.experienceLevel}`);
    }

    // Summary
    if (formattedJD.summary) {
      sections.push(`\nSummary:\n${formattedJD.summary}`);
    }

    // Responsibilities
    if (
      formattedJD.responsibilities &&
      formattedJD.responsibilities.length > 0
    ) {
      sections.push(
        `\nResponsibilities:\n${formattedJD.responsibilities
          .map((item) => `• ${item}`)
          .join("\n")}`
      );
    }

    // Required Skills
    if (formattedJD.requiredSkills && formattedJD.requiredSkills.length > 0) {
      sections.push(
        `\nRequired Skills:\n${formattedJD.requiredSkills
          .map((skill) => `• ${skill}`)
          .join("\n")}`
      );
    }

    // Preferred Skills
    if (formattedJD.preferredSkills && formattedJD.preferredSkills.length > 0) {
      sections.push(
        `\nPreferred Skills:\n${formattedJD.preferredSkills
          .map((skill) => `• ${skill}`)
          .join("\n")}`
      );
    }

    // Qualifications
    if (formattedJD.qualifications && formattedJD.qualifications.length > 0) {
      sections.push(
        `\nQualifications:\n${formattedJD.qualifications
          .map((qual) => `• ${qual}`)
          .join("\n")}`
      );
    }

    // Benefits
    if (formattedJD.benefits && formattedJD.benefits.length > 0) {
      sections.push(
        `\nBenefits:\n${formattedJD.benefits
          .map((benefit) => `• ${benefit}`)
          .join("\n")}`
      );
    }

    return sections.join("\n");
  };

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

      {/* Processing Status */}
      {isAnalyzing && processingStatus && (
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
            <div>
              <h3 className="font-grotesk font-semibold text-primary mb-1">
                Processing Analysis
              </h3>
              <p className="text-primary/80 text-sm">{processingStatus}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Job Description Section */}
        <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 shadow-xl relative">
          {/* Loading overlay for file processing */}
          <LoaderOverlay
            isLoading={jobProcessor.isPending}
            text="Processing job description file..."
            size="md"
          />

          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-grotesk font-semibold text-text">
                Job Description
              </h2>
              <p className="text-text-muted text-sm">
                Paste or upload the job requirements and description
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* File Upload Area - Show only in initial mode */}
            <div
              className={`transition-all duration-500 ease-in-out ${
                interfaceMode === "initial"
                  ? "opacity-100 max-h-40 mb-3"
                  : "opacity-0 max-h-0 mb-0 overflow-hidden"
              }`}
            >
              <div
                className={`border-2 border-dashed rounded-xl p-4 text-center transition-all duration-300 cursor-pointer ${
                  isJdDragging
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-border-light hover:border-primary/50 hover:bg-primary/5"
                }`}
                onDragOver={handleJdDragOver}
                onDragLeave={handleJdDragLeave}
                onDrop={handleJdDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="relative inline-block mb-2">
                  <div className="bg-bg-light rounded-full p-2">
                    <File
                      className={`w-4 h-4 transition-colors duration-300 ${
                        isJdDragging
                          ? "text-primary"
                          : "text-text-muted hover:text-primary"
                      }`}
                    />
                  </div>
                </div>
                <p className="font-grotesk text-sm text-text-muted mb-1">
                  {isJdDragging
                    ? "Drop job description file here"
                    : "Drop file or click to upload job description"}
                </p>
                <p className="font-grotesk text-xs text-text-subtle">
                  TXT, DOCX, PDF, JPG, PNG, WEBP files supported
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.docx,.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif"
                  onChange={handleJdFileSelect}
                  className="hidden"
                  disabled={isAnalyzing || jobProcessor.isPending}
                />
              </div>
            </div>

            {/* Divider - Show only in initial mode */}
            <div
              className={`transition-all duration-500 ease-in-out ${
                interfaceMode === "initial"
                  ? "opacity-100 max-h-8 my-4"
                  : "opacity-0 max-h-0 my-0 overflow-hidden"
              }`}
            >
              <div className="flex items-center">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border-custom to-transparent"></div>
                <span className="px-3 font-grotesk text-xs text-text-subtle bg-bg rounded-full border border-border-custom">
                  or type
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border-custom to-transparent"></div>
              </div>
            </div>

            {/* Textarea */}
            <Textarea
              value={jobDescription}
              onChange={handleTextareaChange}
              placeholder="Looking for a Frontend Developer with 3+ years of experience in React, TypeScript..."
              className={`bg-bg/30 border-border-custom focus:border-primary/50 focus:ring-0 focus:outline-none resize-none ${
                interfaceMode === "initial" ? "min-h-[200px]" : "min-h-[300px]"
              }`}
              disabled={isAnalyzing || jobProcessor.isPending}
            />

            {/* Alternative Action Buttons - Show when typing or uploaded */}
            <div
              className={`transition-all duration-500 ease-in-out ${
                interfaceMode !== "initial"
                  ? "opacity-100 max-h-12 mt-3"
                  : "opacity-0 max-h-0 mt-0 overflow-hidden"
              }`}
            >
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={
                    interfaceMode === "uploaded"
                      ? handleUploadAgain
                      : handleShowUpload
                  }
                  className="text-text-muted hover:text-text hover:bg-bg-light/50 border border-border-custom transition-all duration-200 rounded-xl text-xs"
                >
                  <File className="w-3 h-3 mr-1" />
                  {interfaceMode === "uploaded"
                    ? "Upload different file"
                    : "or upload a file"}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-text-muted">
                  {jobDescription.length} characters
                </span>
              </div>
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
        <div
          className={`bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 shadow-xl relative ${
            jobProcessor.isPending ? "opacity-50 cursor-not-allowed" : ""
          }`}
          aria-disabled={jobProcessor.isPending}
        >
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
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ${
              jobProcessor.isPending
                ? "border-border-custom/50 bg-bg/20 cursor-not-allowed"
                : isDragging
                ? "border-primary bg-primary/5"
                : "border-border-custom hover:border-primary/50"
            }`}
            onDragOver={jobProcessor.isPending ? undefined : handleDragOver}
            onDragLeave={jobProcessor.isPending ? undefined : handleDragLeave}
            onDrop={jobProcessor.isPending ? undefined : handleDrop}
            aria-disabled={jobProcessor.isPending}
          >
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp,.heic,.heif"
              onChange={handleFileUpload}
              className="hidden"
              id="resume-upload"
              disabled={isAnalyzing || jobProcessor.isPending}
            />
            <label
              htmlFor="resume-upload"
              className={`${
                isAnalyzing || jobProcessor.isPending
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
            >
              <Upload className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="font-grotesk font-semibold text-text mb-2">
                Upload Resume Files
              </h3>
              <p className="text-text-muted text-sm mb-4">
                {jobProcessor.isPending
                  ? "Complete job description processing first"
                  : "Drag and drop files here, or click to browse"}
              </p>
              <p className="text-text-subtle text-xs">
                Supports PDF, DOCX, TXT, JPG, PNG, WEBP files (max 20 files)
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
                      <span className="text-text-subtle text-xs">
                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    {!isAnalyzing && !jobProcessor.isPending && (
                      <button
                        onClick={() => removeResume(index)}
                        className="text-red-400 hover:text-red-300 transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
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
                isConfirmationLoading ||
                jobProcessor.isPending
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
