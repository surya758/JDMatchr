import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  TrendingUp,
  Download,
  FileText,
  Award,
  Clock,
  AlertCircle,
  Loader2,
  FileDown,
  Crown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { useJobReportDetail } from "@/hooks/useJobReports";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { supabase } from "@/lib/supabase";

const ReportDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { subscriptionStatus } = useSubscription();
  const { preferences } = useUserPreferences();
  const [showJobDescription, setShowJobDescription] = useState(false);
  const [downloadingCandidate, setDownloadingCandidate] = useState<
    string | null
  >(null);
  const [currentPage, setCurrentPage] = useState(1);
  const candidatesPerPage = preferences.results_per_page;
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(
    null
  );
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);

  // Extract reportId from pathname since we're not using route parameters
  const reportId = location.pathname.split("/").pop() || "";

  const {
    data: reportData,
    isLoading,
    error,
    refetch,
  } = useJobReportDetail(reportId || "");

  const isFreePlan = subscriptionStatus === "free";

  // Auto-expand first candidate if preference is enabled
  // This must be before any conditional returns to follow rules of hooks
  useEffect(() => {
    if (
      reportData &&
      preferences.auto_expand_candidates &&
      reportData.candidates?.length > 0 &&
      !hasAutoExpanded
    ) {
      // Get the first candidate on the current page
      const startIndex = (currentPage - 1) * candidatesPerPage;
      const firstCandidateOnPage = reportData.candidates[startIndex];
      if (firstCandidateOnPage) {
        setExpandedCandidate(firstCandidateOnPage.id);
        setHasAutoExpanded(true);
      }
    }
  }, [
    reportData,
    preferences.auto_expand_candidates,
    currentPage,
    candidatesPerPage,
    hasAutoExpanded,
  ]);

  // Check if report is within 30-day download window
  const isWithinDownloadWindow = (reportDate: string) => {
    const createdDate = new Date(reportDate);
    const now = new Date();
    const daysDiff = Math.floor(
      (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff <= 30;
  };

  const handleDownloadResume = async (candidate: any) => {
    if (!candidate.file_path) return;

    try {
      setDownloadingCandidate(candidate.id);

      const { data, error } = await supabase.storage
        .from("resume-files")
        .download(candidate.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = candidate.file_name || "resume.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `${candidate.file_name} is being downloaded.`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to download the resume file.",
        variant: "destructive",
      });
    } finally {
      setDownloadingCandidate(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 75) return "text-blue-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return "bg-green-500/10";
    if (score >= 75) return "bg-blue-500/10";
    if (score >= 60) return "bg-yellow-500/10";
    return "bg-red-500/10";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 60) return "Fair";
    return "Poor";
  };

  const getCandidateName = (candidate: any) => {
    if (!candidate?.processed_resume)
      return (
        candidate?.file_name?.replace(/\.[^/.]+$/, "") || "Unknown Candidate"
      );

    try {
      const resume =
        typeof candidate.processed_resume === "string"
          ? JSON.parse(candidate.processed_resume)
          : candidate.processed_resume;

      return (
        resume?.personalInfo?.name ||
        resume?.name ||
        candidate.file_name?.replace(/\.[^/.]+$/, "") ||
        "Unknown Candidate"
      );
    } catch {
      return (
        candidate.file_name?.replace(/\.[^/.]+$/, "") || "Unknown Candidate"
      );
    }
  };

  const generateCandidateInsights = (
    candidate: any,
    score: number,
    formattedJd: any
  ) => {
    if (!candidate?.processed_resume) {
      return {
        summary: "Limited information available for analysis.",
        keyStrengths: [],
        potentialConcerns: ["Resume data not fully processed"],
        recommendation: "pass" as const,
      };
    }

    try {
      const resume =
        typeof candidate.processed_resume === "string"
          ? JSON.parse(candidate.processed_resume)
          : candidate.processed_resume;

      // Generate summary based on score and experience
      const summary = (() => {
        const name = resume?.personalInfo?.name || "This candidate";
        const experience = resume?.experience?.totalYears || 0;
        const currentRole = resume?.experience?.currentRole || "";

        if (score >= 85) {
          return `${name} is an excellent match with ${experience}+ years of experience${
            currentRole ? ` as ${currentRole}` : ""
          } and strong alignment with job requirements.`;
        } else if (score >= 75) {
          return `${name} shows strong potential with ${experience} years of relevant experience${
            currentRole ? ` in ${currentRole}` : ""
          } and good skill alignment.`;
        } else if (score >= 60) {
          return `${name} has ${experience} years of experience${
            currentRole ? ` as ${currentRole}` : ""
          } with some relevant skills but may need additional training.`;
        } else {
          return `${name} has limited alignment with the role requirements despite ${experience} years of experience.`;
        }
      })();

      // Extract key strengths from resume data
      const keyStrengths = [];

      // Technical skills match
      if (resume?.skills?.technical?.length > 0) {
        const topSkills = resume.skills.technical.slice(0, 3);
        keyStrengths.push(`Strong in ${topSkills.join(", ")}`);
      }

      // Experience highlights
      if (resume?.experience?.totalYears >= 5) {
        keyStrengths.push(
          `${resume.experience.totalYears}+ years of experience`
        );
      }

      // Education
      if (resume?.education?.length > 0) {
        const degree = resume.education[0];
        if (degree?.degree) {
          keyStrengths.push(
            `${degree.degree} from ${
              degree.institution || "recognized institution"
            }`
          );
        }
      }

      // Standout achievements
      if (resume?.notablePoints?.standoutAchievements?.length > 0) {
        keyStrengths.push(resume.notablePoints.standoutAchievements[0]);
      }

      // Career progression
      if (
        resume?.notablePoints?.careerProgression &&
        resume.notablePoints.careerProgression.toLowerCase().includes("strong")
      ) {
        keyStrengths.push("Strong career progression");
      }

      // Generate potential concerns
      const potentialConcerns = [];

      // Experience level mismatch
      if (formattedJd?.experienceLevel && resume?.experience?.totalYears) {
        const requiredExp = formattedJd.experienceLevel.toLowerCase();
        const candidateExp = resume.experience.totalYears;

        if (requiredExp.includes("senior") && candidateExp < 5) {
          potentialConcerns.push("May need more senior-level experience");
        } else if (requiredExp.includes("junior") && candidateExp > 8) {
          potentialConcerns.push("May be overqualified for junior role");
        }
      }

      // Skill gaps
      if (formattedJd?.requiredSkills && resume?.skills?.technical) {
        const candidateSkills = resume.skills.technical.map((s: string) =>
          s.toLowerCase()
        );
        const missingSkills = formattedJd.requiredSkills.filter(
          (skill: string) =>
            !candidateSkills.some(
              (cs: string) =>
                cs.includes(skill.toLowerCase()) ||
                skill.toLowerCase().includes(cs)
            )
        );

        if (missingSkills.length > 0 && missingSkills.length <= 2) {
          potentialConcerns.push(
            `Limited experience in ${missingSkills.slice(0, 2).join(", ")}`
          );
        } else if (missingSkills.length > 2) {
          potentialConcerns.push("Several required skills not demonstrated");
        }
      }

      // Red flags from resume analysis
      if (resume?.notablePoints?.potentialRedFlags?.length > 0) {
        potentialConcerns.push(
          ...resume.notablePoints.potentialRedFlags.slice(0, 2)
        );
      }

      // Generate recommendation
      const recommendation = (() => {
        if (score >= 85 && potentialConcerns.length === 0) return "strong_hire";
        if (score >= 75 && potentialConcerns.length <= 1) return "hire";
        if (score >= 60) return "maybe";
        return "pass";
      })();

      return {
        summary,
        keyStrengths: keyStrengths.slice(0, 4), // Limit to 4 strengths
        potentialConcerns: potentialConcerns.slice(0, 3), // Limit to 3 concerns
        recommendation,
      };
    } catch (error) {
      console.error("Error generating insights:", error);
      return {
        summary: "Unable to analyze candidate data.",
        keyStrengths: [],
        potentialConcerns: ["Data analysis error"],
        recommendation: "pass" as const,
      };
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "strong_hire":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "hire":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "maybe":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "pass":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-text-subtle/10 text-text-subtle border-text-subtle/20";
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case "strong_hire":
        return "🌟";
      case "hire":
        return "✅";
      case "maybe":
        return "🤔";
      case "pass":
        return "❌";
      default:
        return "❓";
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case "strong_hire":
        return "Strong Hire";
      case "hire":
        return "Hire";
      case "maybe":
        return "Maybe";
      case "pass":
        return "Pass";
      default:
        return "Unknown";
    }
  };

  const formatJobDescription = (formattedJd: any) => {
    if (!formattedJd) return null;

    try {
      const jd =
        typeof formattedJd === "string" ? JSON.parse(formattedJd) : formattedJd;
      return jd;
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard/reports")}
            className="p-2 hover:bg-bg-light"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="h-8 w-64 bg-bg-light/50 rounded animate-pulse" />
        </div>

        <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-12 shadow-xl text-center">
          <Loader2 className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
          <h3 className="font-grotesk font-semibold text-text mb-2">
            Loading Report
          </h3>
          <p className="text-text-muted">Fetching report details...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard/reports")}
            className="p-2 hover:bg-bg-light"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-text">Report Not Found</h1>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="font-grotesk font-semibold text-red-400 mb-2">
            Report Not Found
          </h3>
          <p className="text-red-300 mb-6">
            The report you're looking for doesn't exist or you don't have access
            to it.
          </p>
          <Button
            onClick={() => navigate("/dashboard/reports")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Back to Reports
          </Button>
        </div>
      </div>
    );
  }

  const { job, candidates, summary } = reportData;
  const formattedJd = formatJobDescription(job.formatted_jd);
  const isWithinWindow = isWithinDownloadWindow(job.created_at);

  // Pagination calculations
  const totalPages = Math.ceil(candidates.length / candidatesPerPage);
  const startIndex = (currentPage - 1) * candidatesPerPage;
  const endIndex = startIndex + candidatesPerPage;
  const currentCandidates = candidates.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedCandidate(null); // Reset expansion when changing pages
    setHasAutoExpanded(false); // Reset auto-expand flag to allow auto-expansion on new page

    // Scroll to candidates section
    const candidatesSection = document.getElementById("candidates-section");
    if (candidatesSection) {
      candidatesSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const toggleCandidateExpansion = (candidateId: string) => {
    setExpandedCandidate(
      expandedCandidate === candidateId ? null : candidateId
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard/reports")}
            className="p-2 hover:bg-bg-light"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-text">{job.title}</h1>
            {job.company && (
              <p className="text-text-muted text-lg">{job.company}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isFreePlan ? (
            <Button
              onClick={() => navigate("/dashboard/settings/billing")}
              className="border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/30"
              variant="outline"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade for Export
            </Button>
          ) : isWithinWindow ? (
            <Button
              variant="outline"
              className="border-border-custom hover:bg-bg-light"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled
              className="border-border-custom opacity-50 cursor-not-allowed"
              title="Download window expired (30 days)"
            >
              <Download className="w-4 h-4 mr-2" />
              Expired
            </Button>
          )}
        </div>
      </div>

      {/* Job Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-bg/50 backdrop-blur-sm border-border-custom shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Job Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-text-muted" />
                  <div>
                    <p className="text-text-muted text-sm">Posted</p>
                    <p className="font-medium">
                      {new Date(job.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {job.location && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-text-muted" />
                    <div>
                      <p className="text-text-muted text-sm">Location</p>
                      <p className="font-medium">{job.location}</p>
                    </div>
                  </div>
                )}

                {job.employment_type && (
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-text-muted" />
                    <div>
                      <p className="text-text-muted text-sm">Type</p>
                      <p className="font-medium capitalize">
                        {job.employment_type.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                )}

                {job.experience_level && (
                  <div className="flex items-center space-x-3">
                    <Award className="w-4 h-4 text-text-muted" />
                    <div>
                      <p className="text-text-muted text-sm">Experience</p>
                      <p className="font-medium capitalize">
                        {job.experience_level.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Job Description Toggle */}
              <div className="pt-4 border-t border-border-custom/50">
                <div
                  className="cursor-pointer transition-colors duration-200 p-3 -m-3 rounded-lg"
                  onClick={() => setShowJobDescription(!showJobDescription)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Job Description</span>
                    <div className="flex items-center space-x-2">
                      {showJobDescription ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expandable Job Description */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    showJobDescription
                      ? "max-h-[800px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="mt-4 space-y-4 border-t border-border-custom/30 pt-4">
                    {formattedJd ? (
                      <>
                        {formattedJd.summary && (
                          <div>
                            <h4 className="font-medium text-text mb-2">
                              Summary
                            </h4>
                            <p className="text-text-muted text-sm leading-relaxed">
                              {formattedJd.summary}
                            </p>
                          </div>
                        )}

                        {formattedJd.responsibilities &&
                          formattedJd.responsibilities.length > 0 && (
                            <div>
                              <h4 className="font-medium text-text mb-2">
                                Responsibilities
                              </h4>
                              <ul className="list-disc list-inside space-y-1 text-text-muted text-sm">
                                {formattedJd.responsibilities.map(
                                  (resp: string, index: number) => (
                                    <li key={index}>{resp}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                        {formattedJd.requiredSkills &&
                          formattedJd.requiredSkills.length > 0 && (
                            <div>
                              <h4 className="font-medium text-text mb-2">
                                Required Skills
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {formattedJd.requiredSkills.map(
                                  (skill: string, index: number) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="bg-primary/10 text-primary"
                                    >
                                      {skill}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        {formattedJd.preferredSkills &&
                          formattedJd.preferredSkills.length > 0 && (
                            <div>
                              <h4 className="font-medium text-text mb-2">
                                Preferred Skills
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {formattedJd.preferredSkills.map(
                                  (skill: string, index: number) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="border-border-custom"
                                    >
                                      {skill}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </>
                    ) : (
                      <div className="bg-bg-light/30 rounded-lg p-4">
                        <p className="text-text-muted text-sm whitespace-pre-wrap">
                          {job.raw_description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Statistics */}
        <div className="space-y-6">
          <Card className="bg-bg/50 backdrop-blur-sm border-border-custom shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Analysis Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary mb-1">
                  {summary.totalCandidates}
                </p>
                <p className="text-text-muted text-sm">Candidates Analyzed</p>
              </div>

              <Separator className="bg-border-custom/50" />

              <div className="text-center">
                <p className="text-3xl font-bold text-primary mb-1">
                  {summary.averageScore}%
                </p>
                <p className="text-text-muted text-sm">Average Match Score</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Candidates List */}
      <Card
        id="candidates-section"
        className="bg-bg/50 backdrop-blur-sm border-border-custom shadow-xl"
      >
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Candidates ({candidates.length})</span>
            </div>
            {totalPages > 1 && (
              <div className="text-sm text-text-muted">
                Page {currentPage} of {totalPages}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {candidates.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-text-subtle mx-auto mb-4" />
              <p className="text-text-muted">
                No candidates found for this job.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {currentCandidates.map((candidate, index) => {
                const candidateName = getCandidateName(candidate.candidates);
                const score = candidate.matching_score || 0;
                const isDownloading =
                  downloadingCandidate === candidate.candidates?.id;
                const globalIndex = startIndex + index;
                const isTopCandidate = globalIndex === 0;
                const insights = generateCandidateInsights(
                  candidate.candidates,
                  score,
                  formattedJd
                );
                const isExpanded = expandedCandidate === candidate.id;

                return (
                  <div
                    key={candidate.id}
                    className={`rounded-xl border relative transition-all duration-300 ${
                      isTopCandidate
                        ? "bg-gradient-to-br from-primary/5 via-bg-light/30 to-bg-light/20 border-primary/30 shadow-lg"
                        : "bg-bg-light/30 border-border-custom/50"
                    } ${
                      isExpanded ? "shadow-xl" : "shadow-sm hover:shadow-lg"
                    }`}
                  >
                    {/* Top Candidate Badge */}
                    {isTopCandidate && (
                      <div className="absolute -top-3 left-6">
                        <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                          <Crown className="w-3 h-3" />
                          <span>Top Match</span>
                        </div>
                      </div>
                    )}

                    {/* Candidate Header - Always Visible */}
                    <div
                      className="p-4 cursor-pointer hover:bg-bg-light/20 transition-colors duration-200"
                      onClick={() => toggleCandidateExpansion(candidate.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm ${
                              isTopCandidate
                                ? "bg-primary text-primary-foreground"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {globalIndex + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-text text-lg">
                              {candidateName}
                            </h4>
                            <div className="flex items-center space-x-3 mt-1">
                              {score > 0 && (
                                <div
                                  className={`px-3 py-1 rounded-lg ${getScoreBgColor(
                                    score
                                  )}`}
                                >
                                  <span
                                    className={`font-semibold text-sm ${getScoreColor(
                                      score
                                    )}`}
                                  >
                                    {score}% Match
                                  </span>
                                </div>
                              )}
                              <Badge
                                variant="outline"
                                className={`text-xs ${getRecommendationColor(
                                  insights.recommendation
                                )}`}
                              >
                                {getRecommendationIcon(insights.recommendation)}{" "}
                                {getRecommendationText(insights.recommendation)}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {candidate.candidates?.file_path &&
                            isWithinWindow && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadResume(candidate.candidates);
                                }}
                                disabled={isDownloading}
                                className="h-8 w-8 p-0 hover:bg-primary/10 text-primary hover:text-primary"
                                title={`Download ${candidateName}'s resume`}
                              >
                                {isDownloading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <FileDown className="w-4 h-4" />
                                )}
                              </Button>
                            )}

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-bg-light/50 text-text-muted"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isExpanded
                          ? "max-h-96 opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="px-4 pb-4 space-y-4 border-t border-border-custom/30">
                        <div className="pt-4">
                          <p className="text-text-muted text-sm leading-relaxed">
                            {insights.summary}
                          </p>
                        </div>

                        {/* Key Strengths */}
                        {insights.keyStrengths.length > 0 && (
                          <div>
                            <h5 className="font-medium text-text mb-2 text-sm">
                              Key Strengths
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {insights.keyStrengths.map((strength, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="bg-green-500/10 text-green-400 border-green-500/20 text-xs"
                                >
                                  {strength}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Potential Concerns */}
                        {insights.potentialConcerns.length > 0 && (
                          <div>
                            <h5 className="font-medium text-text mb-2 text-sm">
                              Potential Concerns
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {insights.potentialConcerns.map(
                                (concern, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs"
                                  >
                                    {concern}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 pt-6 border-t border-border-custom/50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-text-muted">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, candidates.length)} of {candidates.length}{" "}
                  candidates
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0 border-border-custom hover:bg-bg-light disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className={`h-8 w-8 p-0 ${
                            currentPage === page
                              ? "bg-primary text-primary-foreground"
                              : "border-border-custom hover:bg-bg-light"
                          }`}
                        >
                          {page}
                        </Button>
                      )
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0 border-border-custom hover:bg-bg-light disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportDetail;
