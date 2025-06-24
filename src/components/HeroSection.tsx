import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoaderOverlay, LoaderInline } from "@/components/ui/loader";
import { Upload, FileText, File } from "lucide-react";
import ResumeUpload from "./ResumeUpload";

const HeroSection = () => {
  const [step, setStep] = useState<"jd" | "upload">("jd");
  const [jobDescription, setJobDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingJD, setIsProcessingJD] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadResumes = async () => {
    if (jobDescription.trim()) {
      setIsProcessingJD(true);

      // Simulate JD processing/validation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setIsProcessingJD(false);
      setStep("upload");
    }
  };

  const handleBack = () => {
    setStep("jd");
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

  const handleFileUpload = async (file: File) => {
    setIsUploadingFile(true);

    // Simulate file processing
    await new Promise((resolve) => setTimeout(resolve, 800));

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJobDescription(content);
      setIsUploadingFile(false);
    };
    reader.readAsText(file);
  };

  return (
    <section className="text-text overflow-hidden flex items-center justify-center min-h-[calc(100vh-6rem)]">
      <div className="px-6 py-0 w-full">
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

                  {/* Loading overlay for file upload */}
                  <LoaderOverlay
                    isLoading={isUploadingFile}
                    text="Processing file..."
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
                    <div
                      className={`group border-2 border-dashed rounded-xl p-4 mb-3 text-center transition-all duration-300 cursor-pointer ${
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
                        PDF, JPG, PNG, GIF, TIFF, BMP, WEBP
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.gif,.tiff,.tif,.jpg,.jpeg,.png,.bmp,.webp,.txt,.doc,.docx"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>

                    <div className="flex items-center my-4">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border-custom to-transparent"></div>
                      <span className="px-3 font-grotesk text-xs text-text-subtle bg-bg rounded-full border border-border-custom">
                        or write
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border-custom to-transparent"></div>
                    </div>

                    <div className="relative">
                      <Textarea
                        placeholder="Looking for a Frontend Developer with 3+ years of experience in React, TypeScript..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        className="min-h-20 sm:min-h-24 bg-bg-light/50 backdrop-blur-sm border-border-custom text-text placeholder:text-text-subtle font-grotesk resize-none focus:border-primary/50 focus:ring-0 focus:outline-none transition-border-colors duration-300 text-sm rounded-xl"
                        disabled={isUploadingFile}
                      />
                      {jobDescription.trim() && (
                        <div className="absolute bottom-2 flex items-center right-2 bg-bg-light rounded-full px-2 py-0.5">
                          <span className="text-xs text-text-muted">
                            {jobDescription.trim().split(" ").length}{" "}
                            {jobDescription.trim().split(" ").length > 1
                              ? "words"
                              : "word"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex justify-center">
                      <Button
                        onClick={handleUploadResumes}
                        disabled={
                          !jobDescription.trim() ||
                          isProcessingJD ||
                          isUploadingFile
                        }
                        className="group font-grotesk bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 shadow-lg w-full sm:w-auto"
                      >
                        {isProcessingJD ? (
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
