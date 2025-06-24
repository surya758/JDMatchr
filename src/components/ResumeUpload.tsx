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
    <div className="bg-bg border border-border-custom rounded-2xl p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-bg-light rounded-lg border border-border-custom">
            <Upload className="w-5 h-5 text-text-muted" />
          </div>
          <h3 className="font-aoenik text-lg font-semibold text-text">
            Upload Resumes
          </h3>
          <span className="bg-bg-light text-primary px-3 py-1 rounded-full text-xs font-medium border border-border-custom">
            {files.length}/10 candidates
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-text-muted hover:text-text hover:bg-bg-light border border-border-custom transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>

      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer duration-300 ${
          isDragging
            ? "border-primary bg-bg-light"
            : "border-border-light hover:border-text-subtle bg-bg-light"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload
          className={`w-12 h-12 mx-auto mb-4 transition-colors duration-300 ${
            isDragging ? "text-primary" : "text-text-muted"
          }`}
        />
        <p className="font-aoenik text-sm mb-2 text-text">
          Drop your resumes here or click to browse
        </p>
        <p className="font-aoenik text-xs text-text-subtle">
          Supports PDF, JPG, PNG, GIF, TIFF, BMP, WEBP (Max 10 files)
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

      {files.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center space-x-2 mb-4">
            <User className="w-4 h-4 text-text-muted" />
            <h4 className="font-aoenik text-sm font-medium text-text-muted">
              Candidate Pool
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
            {files.map((file, index) => {
              const previewKey = `${file.name}-${index}`;
              const isImage = file.type.includes("image");
              const previewUrl = imagePreviewUrls[previewKey];

              return (
                <div
                  key={index}
                  className="bg-bg-light border border-border-custom rounded-xl p-4 hover:bg-border-custom transition-all duration-200 group relative"
                >
                  {/* Remove button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-text-subtle hover:text-destructive hover:bg-bg-dark p-1 h-auto w-auto z-10"
                  >
                    <X className="w-3 h-3" />
                  </Button>

                  {/* Resume preview card */}
                  <div className="flex items-start space-x-3">
                    {/* Image preview or icon */}
                    <div className="flex-shrink-0">
                      {isImage && previewUrl ? (
                        <div className="w-16 h-20 rounded-lg border border-border-custom overflow-hidden bg-bg">
                          <img
                            src={previewUrl}
                            alt={`Preview of ${extractCandidateName(
                              file.name
                            )}'s resume`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="p-2 bg-bg rounded-lg border border-border-custom">
                          {getResumeIcon(file)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Candidate name */}
                      <h5 className="font-aoenik text-sm font-semibold text-text truncate">
                        {extractCandidateName(file.name)}
                      </h5>

                      {/* Resume details */}
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-text-subtle" />
                          <span className="font-aoenik text-xs text-text-subtle">
                            Uploaded now
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <FileText className="w-3 h-3 text-text-subtle" />
                          <span className="font-aoenik text-xs text-text-subtle">
                            {file.type.includes("pdf")
                              ? "PDF Resume"
                              : "Image Resume"}{" "}
                            • {(file.size / 1024 / 1024).toFixed(1)} MB
                          </span>
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div className="mt-3 flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <span className="font-aoenik text-xs text-primary font-medium">
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
        <div className="mt-8 flex justify-center">
          <Button
            onClick={handleRankResumes}
            className="font-aoenik bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <Zap className="w-5 h-5 mr-2" />
            Rank {files.length} Candidate{files.length !== 1 ? "s" : ""}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;
