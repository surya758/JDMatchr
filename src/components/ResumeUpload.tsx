
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, Image, ArrowLeft, Zap } from 'lucide-react';

interface ResumeUploadProps {
  onBack: () => void;
  jobDescription: string;
}

const ResumeUpload = ({ onBack, jobDescription }: ResumeUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setFiles(prev => [...prev, ...droppedFiles].slice(0, 10));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles].slice(0, 10));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.includes('image')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const handleRankResumes = () => {
    console.log('Ranking resumes...', { files, jobDescription });
    // This would trigger the AI analysis
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-aoenik text-lg font-semibold">Upload Resumes</h3>
          <span className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs font-medium">
            {files.length}/10
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="text-gray-400 hover:text-white transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>

      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          isDragging 
            ? 'border-primary bg-primary/10' 
            : 'border-white/30 hover:border-white/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors duration-300 ${
          isDragging ? 'text-primary' : 'text-gray-400'
        }`} />
        <p className="font-aoenik text-lg mb-2">
          Drop your resumes here or click to browse
        </p>
        <p className="font-aoenik text-sm text-gray-400">
          Supports PDF, JPG, PNG (Max 10 files)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-3 max-h-60 overflow-y-auto">
          {files.map((file, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                {getFileIcon(file)}
                <div>
                  <p className="font-aoenik text-sm font-medium truncate max-w-48">
                    {file.name}
                  </p>
                  <p className="font-aoenik text-xs text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-red-400 transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Button
            onClick={handleRankResumes}
            className="font-aoenik bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary px-8 py-3 text-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <Zap className="w-5 h-5 mr-2" />
            Rank Them
          </Button>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;
