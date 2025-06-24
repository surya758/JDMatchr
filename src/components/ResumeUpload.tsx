import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Upload,
  X,
  FileText,
  Image,
  ArrowLeft,
  Zap,
  User,
  Calendar,
  Award,
} from "lucide-react";

interface ResumeUploadProps {
  onBack: () => void;
  jobDescription: string;
}

const ResumeUpload = ({ onBack, jobDescription }: ResumeUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<{
    [key: string]: string;
  }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setFiles((prev) => [...prev, ...droppedFiles].slice(0, 10));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles].slice(0, 10));
    }
  };

  const removeFile = (index: number) => {
    const fileToRemove = files[index];
    const key = `${fileToRemove.name}-${index}`;

    // Revoke the URL for the removed file
    if (imagePreviewUrls[key]) {
      URL.revokeObjectURL(imagePreviewUrls[key]);
      setImagePreviewUrls((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }

    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getResumeIcon = (file: File) => {
    if (file.type.includes("image")) {
      return <Image className="w-6 h-6 text-primary" />;
    }
    return <FileText className="w-6 h-6 text-primary" />;
  };

  const extractCandidateName = (filename: string) => {
    // Remove file extension and common resume keywords
    const nameWithoutExt = filename.replace(
      /\.(pdf|jpg|jpeg|png|doc|docx)$/i,
      ""
    );
    const cleanName = nameWithoutExt
      .replace(/resume|cv|curriculum/gi, "")
      .replace(/[-_]/g, " ")
      .trim();

    // Capitalize first letters
    return (
      cleanName
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ") || "Unknown Candidate"
    );
  };

  const handleRankResumes = () => {
    console.log("Ranking resumes...", { files, jobDescription });
    // This would trigger the AI analysis
  };

  return (
    <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-bg-light/10 to-transparent pointer-events-none"></div>

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
            {files.length}/10 candidates
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
              {files.length}/10 candidates
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
          className={`group border-2 border-dashed rounded-xl p-4 sm:p-6 text-center transition-all cursor-pointer duration-300 ${
            isDragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border-light hover:border-primary/50 hover:bg-primary/5"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="relative inline-block mb-3">
            <div className="bg-bg-light rounded-full p-3">
              <Upload
                className={`w-8 h-8 transition-colors duration-300 ${
                  isDragging
                    ? "text-primary"
                    : "text-text-muted group-hover:text-primary"
                }`}
              />
            </div>
          </div>
          <p className="font-grotesk text-sm text-text-muted mb-1">
            {isDragging
              ? "Drop resumes here"
              : "Drop resumes or click to browse"}
          </p>
          <p className="font-grotesk text-xs text-text-subtle">
            PDF, JPG, PNG, GIF, TIFF, BMP, WEBP (Max 10 files)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.gif,.tiff,.tif,.jpg,.jpeg,.png,.bmp,.webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {files.length > 0 && (
        <div className="relative z-10 mt-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="bg-bg-light rounded-full p-1">
              <User className="w-3 h-3 text-primary" />
            </div>
            <h4 className="font-grotesk text-sm font-medium text-text">
              Candidate Pool
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto">
            {files.map((file, index) => {
              const previewKey = `${file.name}-${index}`;
              const isImage = file.type.includes("image");
              const previewUrl = imagePreviewUrls[previewKey];

              return (
                <div
                  key={index}
                  className="bg-bg-light/50 backdrop-blur-sm border border-border-custom rounded-xl p-3 hover:bg-bg-light/70 hover:border-primary/30 transition-all duration-200 group relative"
                >
                  {/* Remove button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-text-subtle hover:text-destructive hover:bg-bg/50 p-1 h-auto w-auto z-10 rounded-lg"
                  >
                    <X className="w-3 h-3" />
                  </Button>

                  {/* Resume preview card */}
                  <div className="flex items-start space-x-3">
                    {/* Image preview or icon */}
                    <div className="flex-shrink-0">
                      {isImage && previewUrl ? (
                        <div className="w-12 h-16 rounded-lg border border-border-custom overflow-hidden bg-bg">
                          <img
                            src={previewUrl}
                            alt={`Preview of ${extractCandidateName(
                              file.name
                            )}'s resume`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="p-2 bg-bg-light rounded-lg border border-border-custom">
                          {getResumeIcon(file)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Candidate name */}
                      <h5 className="font-grotesk text-sm font-semibold text-text truncate mr-6">
                        {extractCandidateName(file.name)}
                      </h5>

                      {/* Resume details */}
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-text-subtle" />
                          <span className="font-grotesk text-xs text-text-subtle">
                            Just uploaded
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <FileText className="w-3 h-3 text-text-subtle" />
                          <span className="font-grotesk text-xs text-text-subtle">
                            {file.type.includes("pdf") ? "PDF" : "Image"} •{" "}
                            {(file.size / 1024 / 1024).toFixed(1)} MB
                          </span>
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div className="mt-2 flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                        <span className="font-grotesk text-xs text-primary font-medium">
                          Ready to rank
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="relative z-10 mt-6 flex justify-center">
          <Button
            onClick={handleRankResumes}
            className="group font-grotesk bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 text-sm font-medium transition-all duration-200 shadow-lg"
          >
            <Zap className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
            Rank {files.length} Candidate{files.length !== 1 ? "s" : ""}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;
