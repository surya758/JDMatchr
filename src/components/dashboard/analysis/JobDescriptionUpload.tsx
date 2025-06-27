import React, { useEffect, useRef, useState } from "react";
import { FileText, File } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LoaderOverlay } from "@/components/ui/loader";

interface JobDescriptionUploadProps {
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
  contentSource: "manual" | "file" | null;
  isDragging: boolean;
  onDragStateChange: (isDragging: boolean) => void;
  isDisabled?: boolean;
}

const JobDescriptionUpload: React.FC<JobDescriptionUploadProps> = ({
  jobDescription,
  onJobDescriptionChange,
  onFileUpload,
  isProcessing,
  contentSource,
  isDragging,
  onDragStateChange,
  isDisabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [interfaceMode, setInterfaceMode] = useState<"initial" | "typing">(
    "initial"
  );

  useEffect(() => {
    if (jobDescription.trim()) {
      setInterfaceMode("typing");
    }
  }, [jobDescription]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    onDragStateChange(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    onDragStateChange(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDragStateChange(false);
    if (!isDisabled) {
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onFileUpload(files[0]);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isDisabled && e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    onJobDescriptionChange(value);

    // Update interface mode based on content
    if (value.trim()) {
      setInterfaceMode("typing");
    }
  };

  const handleTextareaFocus = () => {
    setInterfaceMode("typing");
  };

  const handleTextareaBlur = () => {
    // Only revert to initial if there's no content
    if (!jobDescription.trim()) {
      setInterfaceMode("initial");
    }
  };

  const handleShowUpload = () => {
    if (!isDisabled) {
      setInterfaceMode("initial");
      // Clear any existing content if user wants to upload instead
      onJobDescriptionChange("");

      // Reset file input for clean state
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div
      className={`bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 shadow-xl relative ${
        isDisabled ? "opacity-50" : ""
      }`}
    >
      <LoaderOverlay
        isLoading={isProcessing}
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
            Paste or upload the job requirements
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
            className={`border-2 border-dashed rounded-xl p-4 text-center transition-all duration-300 ${
              isDragging
                ? "border-primary bg-primary/5 scale-[1.01] cursor-pointer"
                : isDisabled
                ? "border-border-light cursor-not-allowed"
                : "border-border-light hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
            }`}
            onDragOver={!isDisabled ? handleDragOver : undefined}
            onDragLeave={!isDisabled ? handleDragLeave : undefined}
            onDrop={!isDisabled ? handleDrop : undefined}
            onClick={
              !isDisabled ? () => fileInputRef.current?.click() : undefined
            }
          >
            <File className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <p className="font-grotesk text-sm text-text-muted mb-1">
              Drop file or click to upload
            </p>
            <p className="font-grotesk text-xs text-text-subtle">
              TXT, DOCX, PDF, JPG, PNG, WEBP
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.docx,.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isProcessing || isDisabled}
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

        {/* Textarea with dynamic expansion */}
        <div className="relative">
          <Textarea
            value={jobDescription}
            onChange={handleTextareaChange}
            onFocus={handleTextareaFocus}
            onBlur={handleTextareaBlur}
            placeholder="Looking for a Frontend Developer with 3+ years of experience in React, TypeScript..."
            className={`bg-bg-light/30 backdrop-blur-sm border-border-custom text-text placeholder:text-text-subtle font-grotesk resize-none focus:border-primary/50 focus:ring-0 focus:outline-none text-sm rounded-xl ${
              interfaceMode === "initial"
                ? "min-h-20 sm:min-h-24"
                : "min-h-40 sm:min-h-48"
            }`}
            disabled={isProcessing || isDisabled}
          />
        </div>

        {/* "or upload" Button - Show when typing */}
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
              onClick={handleShowUpload}
              disabled={isDisabled}
              className={`text-text-muted hover:text-text hover:bg-bg-light transition-colors duration-200 ${
                isDisabled ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              <File className="w-4 h-4 mr-2" />
              or upload file
            </Button>
          </div>
        </div>

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
  );
};

export default JobDescriptionUpload;
