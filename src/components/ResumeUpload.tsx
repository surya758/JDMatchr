import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Upload,
  X,
  FileText,
  Image,
  ArrowLeft,
  Zap,
  Lightbulb,
  RotateCcw,
} from "lucide-react";

import { FormattedJD } from "@/hooks/useJobDescriptionProcessor";
import {
  useResumeProcessor,
  ProcessResumeResponse,
} from "@/hooks/useResumeProcessor";
import { useToast } from "@/hooks/use-toast";
import { AnonymousResult } from "@/components/AnonymousResult";
import { ProcessedResume } from "@/types/resume";
import { matchCandidatesWithAI, RankedCandidate } from "@/lib/ai-matching";

interface ResumeUploadProps {
  onBack: () => void;
  jobDescription: string;
  formattedJD?: FormattedJD | null;
  isAnonymous?: boolean;
  onShowingResults?: (showing: boolean) => void;
  onAnalyzing?: (isAnalyzing: boolean) => void;
}

const ResumeUpload = ({
  onBack,
  jobDescription,
  formattedJD,
  isAnonymous = false,
  onShowingResults,
  onAnalyzing,
}: ResumeUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<{
    [key: string]: string;
  }>({});
  const [processedResumes, setProcessedResumes] = useState<
    ProcessResumeResponse[]
  >([]);
  const [rankedCandidates, setRankedCandidates] = useState<RankedCandidate[]>(
    []
  );
  const [processingFiles, setProcessingFiles] = useState<Set<string>>(
    new Set()
  );
  const [isCancelling, setIsCancelling] = useState(false);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [showAnonymousResult, setShowAnonymousResult] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelProcessingRef = useRef(false);

  // Hooks
  const resumeProcessor = useResumeProcessor();
  const { toast } = useToast();

  // HR Facts and Jokes
  const hrFacts = [
    "📄 Recruiters skim a resume in just 7 seconds. Blink and it's over!",
    "🧠 75% of resumes are filtered by bots. Write for humans *and* machines!",
    "😂 Why did the resume get rejected? It couldn't stay *objective*.",
    "🎯 First impressions count. Typos are the silent killers.",
    "🤖 AI scans 1,000 resumes before your coffee gets cold.",
    "📈 Diverse teams = 35% better performance. Stats don't lie.",
    "🎵 What's a recruiter's jam? Match-making beats!",
    "😆 Why did HR bring a ladder? To reach the *top talent*.",
    "📱 89% of recruiters are on LinkedIn. Are you visible?",
    "🚫 25-page resumes exist. Please, don't be *that* person.",
    "🍕 Someone sent a resume on a pizza box. Got the job too!",
    "🎨 Purple pops on resumes—but don't go full rainbow.",
    "🤔 Resume means 'summary' in French. Keep it short, oui?",
    "📊 Google gets 3M+ job apps a year. Make yours stand out.",
    "😄 What do you call no experience? Untapped potential!",
  ];

  // Cycle through facts every 8 seconds when processing OR analyzing
  useEffect(() => {
    if (processingFiles.size > 0 || isAnalyzing) {
      const interval = setInterval(() => {
        setCurrentFactIndex((prev) => (prev + 1) % hrFacts.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [processingFiles.size, isAnalyzing, hrFacts.length]);

  // Function to parse text and make content between * bold
  const parseFactText = (text: string) => {
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("*") && part.endsWith("*")) {
        // Remove the asterisks and make bold
        const boldText = part.slice(1, -1);
        return (
          <span key={index} className="font-semibold text-text">
            {boldText}
          </span>
        );
      }
      return part;
    });
  };

  // Create image preview URLs when files are added
  useEffect(() => {
    const newPreviewUrls: { [key: string]: string } = {};

    files.forEach((file, index) => {
      if (file.type.includes("image")) {
        const key = `${file.name}-${index}`;
        if (!imagePreviewUrls[key]) {
          newPreviewUrls[key] = URL.createObjectURL(file);
        }
      }
    });

    if (Object.keys(newPreviewUrls).length > 0) {
      setImagePreviewUrls((prev) => ({ ...prev, ...newPreviewUrls }));
    }

    // Cleanup function to revoke URLs when component unmounts or files change
    return () => {
      Object.values(newPreviewUrls).forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [files]);

  // Cleanup URLs when component unmounts
  useEffect(() => {
    return () => {
      Object.values(imagePreviewUrls).forEach((url) => {
        URL.revokeObjectURL(url);
      });
      // Reset cancel flag on unmount
      cancelProcessingRef.current = false;
    };
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles].slice(0, 25));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles].slice(0, 25));
    }
  };

  const processResumeFile = async (file: File) => {
    // Check if processing was cancelled
    if (cancelProcessingRef.current) {
      throw new Error("Processing cancelled");
    }

    const fileName = file.name;

    // Check supported file types (TXT, DOCX, PDF, Images)
    const textTypes = [
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const textExtensions = [".txt", ".docx"];
    const pdfTypes = ["application/pdf"];
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
    const isPDFFile = pdfTypes.includes(file.type);
    const isImageFile = imageTypes.includes(file.type.toLowerCase());
    const isSupportedFile = isTextFile || isPDFFile || isImageFile;

    if (!isSupportedFile) {
      toast({
        title: "File type not supported",
        description: `${fileName}: Please upload TXT, DOCX, PDF, or image files.`,
        variant: "destructive",
      });
      return null;
    }

    setProcessingFiles((prev) => new Set(prev).add(fileName));

    try {
      // Check again before making the API call
      if (cancelProcessingRef.current) {
        throw new Error("Processing cancelled");
      }

      const result = await resumeProcessor.mutateAsync({ file });

      // Check one more time before returning success
      if (cancelProcessingRef.current) {
        throw new Error("Processing cancelled");
      }

      return result;
    } catch (error) {
      // Don't show error toast if it was cancelled
      if (cancelProcessingRef.current) {
        throw error;
      }

      console.error(`Failed to process ${fileName}:`, error);

      toast({
        title: "Processing failed",
        description: `Failed to process ${fileName}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        variant: "destructive",
      });

      return null;
    } finally {
      setProcessingFiles((prev) => {
        const updated = new Set(prev);
        updated.delete(fileName);
        return updated;
      });
    }
  };

  const handleRankResumes = async () => {
    if (files.length === 0) {
      toast({
        title: "No files to process",
        description: "Please upload at least one resume file.",
        variant: "destructive",
      });
      return;
    }

    // Reset cancel flag
    cancelProcessingRef.current = false;
    setIsCancelling(false);

    // For anonymous users, show analyzing state
    if (isAnonymous) {
      setIsAnalyzing(true);
      onAnalyzing?.(true);
    }

    console.log("Processing resumes...", { files, jobDescription });

    // Process all files with cancellation support
    const results = await Promise.allSettled(
      files.map(async (file) => {
        // Check if cancelled before processing each file
        if (cancelProcessingRef.current) {
          throw new Error("Processing cancelled");
        }
        return await processResumeFile(file);
      })
    );

    // If cancelled, don't update results
    if (cancelProcessingRef.current) {
      toast({
        title: "Processing cancelled",
        description: "Resume processing was cancelled by user.",
        variant: "destructive",
      });
      return;
    }

    // Filter successful results
    const successful = results
      .filter(
        (
          result
        ): result is PromiseFulfilledResult<ProcessResumeResponse | null> =>
          result.status === "fulfilled" && result.value !== null
      )
      .map((result) => result.value as ProcessResumeResponse);

    setProcessedResumes(successful);

    if (successful.length > 0) {
      // Check if cancelled before AI matching
      if (cancelProcessingRef.current) {
        return;
      }

      // Call AI matching after resume processing
      if (formattedJD) {
        try {
          console.log("Starting AI candidate matching...");
          const candidateProfiles = successful.map((r) => r.processedResume);
          const ranked = await matchCandidatesWithAI(
            formattedJD,
            candidateProfiles
          );

          // Check if cancelled after AI matching
          if (cancelProcessingRef.current) {
            return;
          }

          setRankedCandidates(ranked);
          console.log("AI matching completed:", ranked);

          toast({
            title: "Analysis completed",
            description: `Successfully analyzed ${successful.length} candidate${
              successful.length !== 1 ? "s" : ""
            } and ranked them by fit.`,
          });
        } catch (error) {
          console.error("AI matching failed:", error);

          toast({
            title: "Analysis failed",
            variant: "destructive",
            description: `Something went wrong while analyzing the candidates.`,
          });
        }
      } else {
        console.warn("No formatted job description available for AI matching");

        toast({
          title: "Analysis failed",
          variant: "destructive",
          description: `Something went wrong while analyzing the candidates.`,
        });
      }

      // For anonymous users, show the result immediately
      if (isAnonymous && !hasAnalyzed) {
        setIsAnalyzing(false);
        onAnalyzing?.(false);
        setShowAnonymousResult(true);
        setHasAnalyzed(true);
        onShowingResults?.(true);
      }

      // Log processed data for testing
      console.log("Processed resumes:", successful);
    }
  };

  const handleCancelProcessing = () => {
    setIsCancelling(true);
    cancelProcessingRef.current = true;

    // Clear all processing files immediately
    setProcessingFiles(new Set());

    toast({
      title: "Cancelling processing",
      description: "Stopping resume processing...",
    });
  };

  return (
    <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-bg-light/10 to-transparent pointer-events-none"></div>

      {/* AI Analyzing State - Show only this during analysis */}
      {isAnalyzing && (
        <div className="space-y-6">
          <div className="flex items-center justify-center min-h-[30vh]">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-text font-grotesk">
                  🤖 AI is analyzing candidates...
                </h3>
                <p className="text-text-muted max-w-md">
                  Our AI is carefully evaluating each candidate against your job
                  requirements. This may take a few moments.
                </p>
              </div>
            </div>
          </div>

          {/* HR Facts & Entertainment - Show during analysis */}
          <div className="relative z-10">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 backdrop-blur-sm border border-primary/20 rounded-xl p-4 transition-all duration-500 ease-in-out">
              <div className="flex items-start space-x-3">
                <div className="bg-primary/20 rounded-full p-2 animate-pulse">
                  <Lightbulb className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-grotesk text-sm font-semibold text-text">
                      While you wait...
                    </h4>
                  </div>
                  <div className="relative overflow-hidden h-6">
                    <p
                      className="font-grotesk text-sm text-text-muted absolute inset-0 transition-all duration-700 ease-in-out transform"
                      key={currentFactIndex}
                      style={{
                        animation: "slideInUp 0.7s ease-out",
                      }}
                    >
                      {parseFactText(hrFacts[currentFactIndex])}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress dots */}
              <div className="flex justify-center mt-3 space-x-1">
                {hrFacts.slice(0, 5).map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      index === currentFactIndex % 5
                        ? "bg-primary scale-125"
                        : "bg-primary/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Interface - Hide during analysis AND when showing results */}
      {!isAnalyzing && !showAnonymousResult && (
        <>
          <div className="relative z-10 mb-4 sm:mb-6">
            {/* Mobile layout */}
            <div className="flex items-center justify-between mb-3 sm:hidden">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-bg-light rounded-lg border border-border-custom">
                  <Upload className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-grotesk text-sm font-semibold text-text">
                  Upload Resumes
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-text-muted hover:text-text hover:bg-bg-light/50 border border-border-custom transition-all duration-200 rounded-xl px-3 py-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>

            {/* Mobile candidate counter */}
            <div className="flex justify-center mb-3 sm:hidden">
              <span className="bg-bg-light/50 backdrop-blur-sm text-primary px-3 py-1.5 rounded-full text-xs font-medium border border-border-custom">
                {files.length}/25 candidates
              </span>
            </div>

            {/* Desktop layout */}
            <div className="hidden sm:flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-bg-light rounded-lg border border-border-custom">
                  <Upload className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-grotesk text-base font-semibold text-text">
                  Upload Resumes
                </h3>
                <span className="bg-bg-light/50 backdrop-blur-sm text-primary px-3 py-1 rounded-full text-xs font-medium border border-border-custom">
                  {files.length}/25 candidates
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-text-muted hover:text-text hover:bg-bg-light/50 border border-border-custom transition-all duration-200 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </div>
          </div>

          <div className="relative z-10">
            <div
              className={`group border-2 border-dashed rounded-xl p-4 sm:p-6 text-center transition-all duration-300 ${
                processingFiles.size > 0
                  ? "border-border-light bg-bg-light/20 cursor-not-allowed opacity-60"
                  : isDragging
                  ? "border-primary bg-primary/5 scale-[1.01] cursor-pointer"
                  : "border-border-light hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
              }`}
              onDragOver={processingFiles.size > 0 ? undefined : handleDragOver}
              onDragLeave={
                processingFiles.size > 0 ? undefined : handleDragLeave
              }
              onDrop={processingFiles.size > 0 ? undefined : handleDrop}
              onClick={
                processingFiles.size > 0
                  ? undefined
                  : () => fileInputRef.current?.click()
              }
            >
              <div className="relative inline-block mb-3">
                <div className="bg-bg-light rounded-full p-3">
                  <Upload
                    className={`w-8 h-8 transition-colors duration-300 ${
                      processingFiles.size > 0
                        ? "text-text-subtle"
                        : isDragging
                        ? "text-primary"
                        : "text-text-muted group-hover:text-primary"
                    }`}
                  />
                </div>
              </div>
              <p className="font-grotesk text-sm text-text-muted mb-1">
                {processingFiles.size > 0
                  ? "Processing resumes..."
                  : isDragging
                  ? "Drop resumes here"
                  : "Drop resumes or click to browse"}
              </p>
              <p className="font-grotesk text-xs text-text-subtle">
                {processingFiles.size > 0
                  ? "Upload disabled while processing"
                  : "PDF, TXT, DOCX, JPG, PNG, GIF, TIFF, BMP, WEBP (Max 25 files)"}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.docx,.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif"
                onChange={handleFileSelect}
                disabled={processingFiles.size > 0}
                className="hidden"
              />
            </div>
          </div>

          {files.length > 0 && (
            <div className="relative z-10 mt-6">
              {/* Uploaded Files Summary */}
              <div className="bg-bg-light/30 backdrop-blur-sm border border-border-custom rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-bg-light rounded-full p-1.5">
                      <Upload className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-grotesk text-sm font-semibold text-text">
                        Uploaded Files
                      </h4>
                      <p className="font-grotesk text-xs text-text-muted">
                        {files.length} out of 25 resumes uploaded
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* File type breakdown */}
                    <div className="flex items-center space-x-2 text-xs">
                      {files.filter((f) =>
                        f.name.toLowerCase().endsWith(".txt")
                      ).length > 0 && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                          {
                            files.filter((f) =>
                              f.name.toLowerCase().endsWith(".txt")
                            ).length
                          }{" "}
                          TXT
                        </span>
                      )}
                      {files.filter((f) =>
                        f.name.toLowerCase().endsWith(".docx")
                      ).length > 0 && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                          {
                            files.filter((f) =>
                              f.name.toLowerCase().endsWith(".docx")
                            ).length
                          }{" "}
                          DOCX
                        </span>
                      )}
                      {files.filter((f) => f.type.includes("pdf")).length >
                        0 && (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                          {files.filter((f) => f.type.includes("pdf")).length}{" "}
                          PDF
                        </span>
                      )}
                      {files.filter((f) => f.type.includes("image")).length >
                        0 && (
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                          {files.filter((f) => f.type.includes("image")).length}{" "}
                          IMG
                        </span>
                      )}
                    </div>

                    {/* Clear all button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={processingFiles.size > 0}
                      onClick={() => {
                        // Cleanup image URLs
                        Object.values(imagePreviewUrls).forEach((url) =>
                          URL.revokeObjectURL(url)
                        );
                        setImagePreviewUrls({});
                        setFiles([]);
                        setProcessedResumes([]);
                        setRankedCandidates([]);
                        setShowAnonymousResult(false);
                        setHasAnalyzed(false);
                        setIsAnalyzing(false);
                        onAnalyzing?.(false);
                        onShowingResults?.(false);
                      }}
                      className="text-text-subtle hover:text-destructive hover:bg-bg/50 p-2 h-auto w-auto rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HR Facts & Entertainment - Show while processing */}
          {processingFiles.size > 0 && (
            <div className="relative z-10 mt-4">
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 backdrop-blur-sm border border-primary/20 rounded-xl p-4 transition-all duration-500 ease-in-out">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/20 rounded-full p-2 animate-pulse">
                    <Lightbulb className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-grotesk text-sm font-semibold text-text">
                        While you wait...
                      </h4>
                    </div>
                    <div className="relative overflow-hidden h-6">
                      <p
                        className="font-grotesk text-sm text-text-muted absolute inset-0 transition-all duration-700 ease-in-out transform"
                        key={currentFactIndex}
                        style={{
                          animation: "slideInUp 0.7s ease-out",
                        }}
                      >
                        {parseFactText(hrFacts[currentFactIndex])}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress dots */}
                <div className="flex justify-center mt-3 space-x-1">
                  {hrFacts.slice(0, 5).map((_, index) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        index === currentFactIndex % 5
                          ? "bg-primary scale-125"
                          : "bg-primary/30"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div className="relative z-10 mt-6 flex justify-center">
              <Button
                onClick={
                  processingFiles.size > 0
                    ? handleCancelProcessing
                    : handleRankResumes
                }
                className={`group font-grotesk px-6 py-2.5 text-sm font-medium transition-all duration-200 shadow-lg disabled:opacity-50 ${
                  processingFiles.size > 0
                    ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground border-destructive"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                }`}
              >
                {processingFiles.size > 0 ? (
                  <>
                    <X className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                    {isCancelling ? "Cancelling..." : "Cancel Processing"}
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                    {`Process ${files.length} Candidate${
                      files.length !== 1 ? "s" : ""
                    }`}
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Anonymous Result Display - Outside upload interface */}
      {isAnonymous &&
        showAnonymousResult &&
        formattedJD &&
        (rankedCandidates.length > 0 || processedResumes.length > 0) && (
          <div className="relative z-10 mt-8 space-y-6">
            <AnonymousResult
              job={formattedJD}
              candidates={
                rankedCandidates.length > 0
                  ? rankedCandidates.map((r) => r.processedResume)
                  : processedResumes.map((r) => r.processedResume)
              }
              totalCandidates={
                rankedCandidates.length > 0
                  ? rankedCandidates.length
                  : processedResumes.length
              }
              rankedCandidates={
                rankedCandidates.length > 0 ? rankedCandidates : undefined
              }
            />

            {/* Do Again Button */}
            <div className="text-center">
              <Button
                onClick={() => {
                  // Cleanup image URLs
                  Object.values(imagePreviewUrls).forEach((url) =>
                    URL.revokeObjectURL(url)
                  );
                  setImagePreviewUrls({});
                  setFiles([]);
                  setProcessedResumes([]);
                  setRankedCandidates([]);
                  setShowAnonymousResult(false);
                  setHasAnalyzed(false);
                  setIsAnalyzing(false);
                  onAnalyzing?.(false);
                  onShowingResults?.(false);
                }}
                variant="outline"
                size="lg"
                className="group font-grotesk px-8 py-3 text-base font-medium shadow-md border-border-custom hover:bg-bg-light/50"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Screen More Candidates
              </Button>
              <p className="text-text-subtle text-xs mt-2">
                Free anonymous screening available
              </p>
            </div>
          </div>
        )}
    </div>
  );
};

export default ResumeUpload;
