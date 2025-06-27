import React, { useRef } from "react";
import { Users, Upload, FileText, X } from "lucide-react";

interface ResumeUploadProps {
  uploadedResumes: File[];
  onFileUpload: (files: File[]) => void;
  onRemoveResume: (index: number) => void;
  isDragging: boolean;
  onDragStateChange: (isDragging: boolean) => void;
  isDisabled?: boolean;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({
  uploadedResumes,
  onFileUpload,
  onRemoveResume,
  isDragging,
  onDragStateChange,
  isDisabled = false,
}) => {
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDisabled) {
      onDragStateChange(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDisabled) {
      onDragStateChange(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDisabled) {
      onDragStateChange(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      const newResumes = [...uploadedResumes, ...droppedFiles].slice(0, 20);
      onFileUpload(newResumes);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isDisabled) {
      const files = Array.from(event.target.files || []);
      const newResumes = [...uploadedResumes, ...files].slice(0, 20);
      onFileUpload(newResumes);
    }
  };

  return (
    <div
      className={`bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 shadow-xl ${
        isDisabled ? "opacity-50" : ""
      }`}
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
            {isDisabled
              ? "Please wait for job description processing..."
              : "Upload candidate resumes to analyze"}
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ${
          isDisabled
            ? "border-border-custom bg-bg/20 cursor-not-allowed"
            : isDragging
            ? "border-primary bg-primary/5"
            : "border-border-custom hover:border-primary/50 cursor-pointer"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={resumeInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp,.heic,.heif"
          onChange={handleFileSelect}
          className="hidden"
          id="resume-upload"
          disabled={isDisabled}
        />
        <label
          htmlFor="resume-upload"
          className={isDisabled ? "cursor-not-allowed" : "cursor-pointer"}
        >
          <Upload
            className={`w-12 h-12 mx-auto mb-4 ${
              isDisabled ? "text-text-subtle" : "text-text-muted"
            }`}
          />
          <h3 className="font-grotesk font-semibold text-text mb-2">
            Upload Resume Files
          </h3>
          <p className="text-text-muted text-sm mb-4">
            {isDisabled
              ? "Disabled while processing job description"
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
                <button
                  onClick={() => onRemoveResume(index)}
                  disabled={isDisabled}
                  className={`transition-colors duration-200 ${
                    isDisabled
                      ? "text-text-subtle cursor-not-allowed"
                      : "text-red-400 hover:text-red-300"
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;
