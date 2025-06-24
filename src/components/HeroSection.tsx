
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Zap, File } from 'lucide-react';
import ResumeUpload from './ResumeUpload';

const HeroSection = () => {
  const [step, setStep] = useState<'jd' | 'upload'>('jd');
  const [jobDescription, setJobDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadResumes = () => {
    if (jobDescription.trim()) {
      setStep('upload');
    }
  };

  const handleBack = () => {
    setStep('jd');
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

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJobDescription(content);
    };
    reader.readAsText(file);
  };

  return (
    <section className="min-h-screen bg-black text-white overflow-hidden pt-20">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center mb-16 animate-fade-in">
          <h1 className="font-aoenik text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Upload resumes. Paste the JD.{' '}
            <span className="text-primary">Get scores.</span>{' '}
            That's it.
          </h1>
          <p className="font-aoenik text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            A minimal AI tool for HRs to instantly rank candidates against any job requirement. 
            No onboarding. No manual scoring. Just results.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="relative">
            {step === 'jd' && (
              <div className="animate-fade-in">
                <div className="bg-black border border-gray-800 rounded-2xl p-8 shadow-2xl">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-gray-900 rounded-lg border border-gray-800">
                      <FileText className="w-5 h-5 text-gray-300" />
                    </div>
                    <h3 className="font-aoenik text-lg font-semibold text-gray-100">Job Description</h3>
                  </div>
                  
                  <div
                    className={`border-2 border-dashed rounded-xl p-6 mb-4 text-center transition-all duration-300 ${
                      isDragging 
                        ? 'border-gray-500 bg-gray-900' 
                        : 'border-gray-700 hover:border-gray-600 bg-gray-950'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <File className={`w-8 h-8 mx-auto mb-3 transition-colors duration-300 ${
                      isDragging ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <p className="font-aoenik text-sm text-gray-300 mb-2">
                      Drop your JD file here or click to browse
                    </p>
                    <p className="font-aoenik text-xs text-gray-500">
                      Supports TXT, PDF, DOC files
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                  
                  <div className="text-center mb-4">
                    <span className="font-aoenik text-sm text-gray-500">or</span>
                  </div>
                  
                  <Textarea
                    placeholder="Paste your job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-32 bg-gray-950 border-gray-800 text-gray-100 placeholder:text-gray-500 font-aoenik resize-none focus:border-gray-600 focus:ring-gray-600/20 transition-colors duration-200"
                  />
                  
                  <div className="mt-6 flex justify-center">
                    <Button
                      onClick={handleUploadResumes}
                      disabled={!jobDescription.trim()}
                      className="font-aoenik bg-gray-800 hover:bg-gray-700 border border-gray-700 px-8 py-3 text-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg text-white"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Upload Resumes
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {step === 'upload' && (
              <div className="animate-slide-in-right">
                <ResumeUpload onBack={handleBack} jobDescription={jobDescription} />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center mt-16 space-x-12 opacity-70">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="font-aoenik text-sm text-gray-500">PDF Support</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
            <span className="font-aoenik text-sm text-gray-500">Image Support</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
            <span className="font-aoenik text-sm text-gray-500">Instant Results</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
