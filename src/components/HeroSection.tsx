import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoaderOverlay, LoaderInline } from "@/components/ui/loader";
import { Upload, FileText, File } from "lucide-react";
import ResumeUpload from "./ResumeUpload";
import {
  useJobDescriptionProcessor,
  type FormattedJD,
} from "@/hooks/useJobDescriptionProcessor";

const HeroSection = () => {
  const [step, setStep] = useState<"jd" | "upload">("jd");
  const [jobDescription, setJobDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [interfaceMode, setInterfaceMode] = useState<
    "initial" | "typing" | "uploaded"
  >("initial");
  const [formattedJD, setFormattedJD] = useState<FormattedJD | null>(null);
  const [contentSource, setContentSource] = useState<"manual" | "file" | null>(
    null
  );
  const [isImageFile, setIsImageFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // React Query hook for processing job descriptions
  const jdProcessor = useJobDescriptionProcessor();

  const handleUploadResumes = () => {
    if (jobDescription.trim()) {
      jdProcessor.mutate(
        { type: "text", content: jobDescription },
        {
          onSuccess: (data) => {
            console.log("Formatted JD:", data.formattedJD);
            setFormattedJD(data.formattedJD);
            setStep("upload");
          },
          onError: (error) => {
            console.error("Error formatting job description:", error);
            // For now, continue to upload step even if formatting fails
            // TODO: Add proper error handling and user notification
            setStep("upload");
          },
        }
      );
    }
  };

  const handleBack = () => {
    setStep("jd");

    // For image files, reset to clean initial state since the textarea content isn't meaningful
    if (isImageFile) {
      setInterfaceMode("initial");
      setJobDescription("");
      setFormattedJD(null);
      setContentSource(null);
      setIsImageFile(false);
    } else {
      // Restore the correct interface mode based on content source for text files
      if (contentSource === "file") {
        setInterfaceMode("uploaded");
      } else if (contentSource === "manual" && jobDescription.trim()) {
        setInterfaceMode("typing");
      } else {
        setInterfaceMode("initial");
      }
    }
  };

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
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
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

  const handleFileUpload = (file: File) => {
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
      console.log("Unsupported file type:", file.type);
      return;
    }

    jdProcessor.mutate(
      { type: "file", file },
      {
        onSuccess: (data) => {
          // For image and PDF files, set a descriptive message instead of generic "processed directly"
          let displayContent = data.originalContent;
          if (data.originalContent === "Image processed directly") {
            displayContent = `Image file processed: ${data.fileName}`;
          } else if (data.originalContent === "PDF processed directly") {
            displayContent = `PDF file processed: ${data.fileName}`;
          }

          setJobDescription(displayContent);
          setFormattedJD(data.formattedJD);
          setContentSource("file");
          setIsImageFile(data.isImageFile || false);

          // Reset file input so the same file can be uploaded again
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }

          console.log("Processed file:", data);

          // Automatically proceed to resume upload step for file uploads
          setStep("upload");
        },
        onError: (error) => {
          console.error("Error processing file:", error);

          // Reset file input on error as well
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          // TODO: Add error toast notification
        },
      }
    );
  };

  return (
    <section className="text-text overflow-hidden flex items-center justify-center min-h-[calc(100vh-6rem)]">
      <div className="px-2 md:px-6 py-0 w-full">
        <div className="max-w-4xl mx-auto text-center mb-8 sm:mb-12 lg:mb-16 animate-fade-in">
          <h1 className="font-grotesk text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 mt-8 sm:mt-12 leading-tight px-2">
            Paste the JD. Upload resumes.{" "}
            <span className="text-primary">Get scores.</span> That's it.
          </h1>
          <p className="font-grotesk text-base sm:text-lg md:text-xl text-text-muted max-w-3xl mx-auto leading-relaxed px-4">
            A minimal AI tool for HRs to instantly rank candidates against any
            job requirement. No onboarding. No manual scoring. Just results.
          </p>
        </div>

        <div className="max-w-2xl mx-auto px-4">
          <div className="relative">
            {step === "jd" && (
              <div className="animate-fade-in">
                <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-bg-light/10 to-transparent pointer-events-none"></div>

                  {/* Loading overlay for file processing */}
                  <LoaderOverlay
                    isLoading={jdProcessor.isPending}
                    text={
                      interfaceMode === "initial" || interfaceMode === "typing"
                        ? "Processing job description..."
                        : "Processing..."
                    }
                    size="md"
                  />

                  <div className="relative z-10 flex items-center space-x-3 mb-4">
                    <div className="p-1.5 bg-bg-light rounded-lg border border-border-custom">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="font-grotesk text-base font-semibold text-text">
                      Job Description
                    </h3>
                  </div>

                  <div className="relative z-10">
                    {/* Upload Area - Show only in initial mode */}
                    <div
                      className={`transition-all duration-500 ease-in-out ${
                        interfaceMode === "initial"
                          ? "opacity-100 max-h-40 mb-3"
                          : "opacity-0 max-h-0 mb-0 overflow-hidden"
                      }`}
                    >
                      <div
                        className={`group border-2 border-dashed rounded-xl p-4 text-center transition-all duration-300 cursor-pointer ${
                          isDragging
                            ? "border-primary bg-primary/5 scale-[1.01]"
                            : "border-border-light hover:border-primary/50 hover:bg-primary/5"
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="relative inline-block mb-2">
                          <div className="bg-bg-light rounded-full p-2">
                            <File
                              className={`w-5 h-5 transition-colors duration-300 ${
                                isDragging
                                  ? "text-primary"
                                  : "text-text-muted group-hover:text-primary"
                              }`}
                            />
                          </div>
                        </div>
                        <p className="font-grotesk text-sm text-text-muted mb-1">
                          {isDragging
                            ? "Drop file here"
                            : "Drop file or click to browse"}
                        </p>
                        <p className="font-grotesk text-xs text-text-subtle">
                          TXT, DOCX, JPG, PNG, WEBP, PDF (auto-processed)
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".txt,.docx,.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif"
                          onChange={handleFileSelect}
                          className="hidden"
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
                          or write
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border-custom to-transparent"></div>
                      </div>
                    </div>

                    {/* Textarea */}
                    <div className="relative">
                      <Textarea
                        placeholder="Looking for a Frontend Developer with 3+ years of experience in React, TypeScript..."
                        value={jobDescription}
                        onChange={handleTextareaChange}
                        className={`bg-bg-light/30 backdrop-blur-sm border-border-custom text-text placeholder:text-text-subtle font-grotesk resize-none focus:border-primary/50 focus:ring-0 focus:outline-none transition-all duration-500 ease-in-out text-sm rounded-xl ${
                          interfaceMode === "initial"
                            ? "min-h-20 sm:min-h-24"
                            : "min-h-40 sm:min-h-48"
                        }`}
                        disabled={jdProcessor.isPending}
                      />
                      {jobDescription.trim() && (
                        <div className="absolute bottom-2 flex items-center right-2 bg-bg-light rounded-full px-2 py-0.5">
                          <span className="text-xs text-text-muted">
                            {jobDescription.trim().length}{" "}
                            {jobDescription.trim().length > 1
                              ? "characters"
                              : "character"}
                          </span>
                        </div>
                      )}
                    </div>

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

                    <div className="mt-4 flex justify-center">
                      <Button
                        onClick={handleUploadResumes}
                        disabled={
                          !jobDescription.trim() || jdProcessor.isPending
                        }
                        className="group font-grotesk bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 shadow-lg w-full sm:w-auto"
                      >
                        {jdProcessor.isPending ? (
                          <>
                            <LoaderInline
                              isLoading={true}
                              size="sm"
                              className="mr-2"
                            />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                            Upload Resumes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === "upload" && (
              <div className="animate-slide-in-right">
                <ResumeUpload
                  onBack={handleBack}
                  jobDescription={jobDescription}
                  formattedJD={formattedJD}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center mt-8 sm:mt-12 lg:mt-16 space-y-4 sm:space-y-0 sm:space-x-8 lg:space-x-12 opacity-70 px-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="font-grotesk text-xs sm:text-sm text-text-subtle">
              PDF Support
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-2 h-2 bg-primary rounded-full animate-pulse"
              style={{ animationDelay: "0.5s" }}
            ></div>
            <span className="font-grotesk text-xs sm:text-sm text-text-subtle">
              Image Support
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-2 h-2 bg-primary rounded-full animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
            <span className="font-grotesk text-xs sm:text-sm text-text-subtle">
              Instant Results
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
