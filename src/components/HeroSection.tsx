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
          <h1 className="font-aoenik text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 mt-8 sm:mt-12 leading-tight px-2">
            Upload resumes. Paste the JD.{" "}
            <span className="text-primary">Get scores.</span> That's it.
          </h1>
          <p className="font-aoenik text-base sm:text-lg md:text-xl text-text-muted max-w-3xl mx-auto leading-relaxed px-4">
            A minimal AI tool for HRs to instantly rank candidates against any
            job requirement. No onboarding. No manual scoring. Just results.
          </p>
        </div>

        <div className="max-w-2xl mx-auto px-4">
          <div className="relative">
            {step === "jd" && (
              <div className="animate-fade-in">
                <div className="bg-bg border border-border-custom rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl relative">
                  {/* Loading overlay for file upload */}
                  <LoaderOverlay
                    isLoading={isUploadingFile}
                    text="Processing file..."
                    size="md"
                  />

                  <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                    <div className="p-1.5 sm:p-2 bg-bg-light rounded-lg border border-border-custom">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-text-muted" />
                    </div>
                    <h3 className="font-aoenik text-base sm:text-lg font-semibold text-text">
                      Job Description
                    </h3>
                  </div>

                  <div
                    className={`border-2 border-dashed rounded-xl p-4 sm:p-6 mb-4 text-center transition-all duration-300 ${
                      isDragging
                        ? "border-text-subtle bg-bg-light"
                        : "border-border-light hover:border-text-subtle bg-bg-light"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <File
                      className={`w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 sm:mb-3 transition-colors duration-300 ${
                        isDragging ? "text-text-muted" : "text-text-subtle"
                      }`}
                    />
                    <p className="font-aoenik text-xs sm:text-sm text-text-muted mb-1 sm:mb-2">
                      Drop your JD file here or click to browse
                    </p>
                    <p className="font-aoenik text-xs text-text-subtle">
                      Supports PDF, JPG, PNG, GIF, TIFF, BMP, WEBP
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.gif,.tiff,.tif,.jpg,.jpeg,.png,.bmp,.webp,.txt,.doc,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  <div className="text-center mb-4">
                    <span className="font-aoenik text-sm text-text-subtle">
                      or
                    </span>
                  </div>

                  <Textarea
                    placeholder="Paste your job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-24 sm:min-h-32 bg-bg-light border-border-custom text-text placeholder:text-text-subtle font-aoenik resize-none focus:border-text-muted focus:ring-0 focus:outline-none transition-colors duration-200 text-sm sm:text-base"
                    disabled={isUploadingFile}
                  />

                  <div className="mt-4 sm:mt-6 flex justify-center">
                    <Button
                      onClick={handleUploadResumes}
                      disabled={
                        !jobDescription.trim() ||
                        isProcessingJD ||
                        isUploadingFile
                      }
                      className="font-aoenik bg-bg-light hover:bg-border-custom border border-border-light px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg text-text w-full sm:w-auto"
                    >
                      {isProcessingJD ? (
                        <LoaderInline
                          isLoading={true}
                          size="sm"
                          className="mr-2"
                        />
                      ) : (
                        <Upload className="w-5 h-5 mr-2" />
                      )}
                      {isProcessingJD ? "Processing..." : "Upload Resumes"}
                    </Button>
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
            <span className="font-aoenik text-xs sm:text-sm text-text-subtle">
              PDF Support
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-2 h-2 bg-primary rounded-full animate-pulse"
              style={{ animationDelay: "0.5s" }}
            ></div>
            <span className="font-aoenik text-xs sm:text-sm text-text-subtle">
              Image Support
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-2 h-2 bg-primary rounded-full animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
            <span className="font-aoenik text-xs sm:text-sm text-text-subtle">
              Instant Results
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
