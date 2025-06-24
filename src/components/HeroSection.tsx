
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Zap } from 'lucide-react';
import ResumeUpload from './ResumeUpload';

const HeroSection = () => {
  const [step, setStep] = useState<'jd' | 'upload'>('jd');
  const [jobDescription, setJobDescription] = useState('');

  const handleUploadResumes = () => {
    if (jobDescription.trim()) {
      setStep('upload');
    }
  };

  const handleBack = () => {
    setStep('jd');
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center mb-16 animate-fade-in">
          <h1 className="font-aoenik text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Upload resumes. Paste the JD.{' '}
            <span className="text-primary">Get scores.</span>{' '}
            That's it.
          </h1>
          <p className="font-aoenik text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            A minimal AI tool for HRs to instantly rank candidates against any job requirement. 
            No onboarding. No manual scoring. Just results.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="relative">
            {step === 'jd' && (
              <div className="animate-fade-in">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-2xl">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-aoenik text-lg font-semibold">Job Description</h3>
                  </div>
                  
                  <Textarea
                    placeholder="Paste your job description here or drop a JD file..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-32 bg-white/5 border-white/20 text-white placeholder:text-gray-400 font-aoenik resize-none focus:border-primary/50 transition-colors duration-200"
                  />
                  
                  <div className="mt-6 flex justify-center">
                    <Button
                      onClick={handleUploadResumes}
                      disabled={!jobDescription.trim()}
                      className="font-aoenik bg-primary hover:bg-blue-600 px-8 py-3 text-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
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
            <span className="font-aoenik text-sm text-gray-400">PDF Support</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
            <span className="font-aoenik text-sm text-gray-400">Image Support</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
            <span className="font-aoenik text-sm text-gray-400">Instant Results</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
