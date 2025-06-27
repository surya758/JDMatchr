import React from "react";
import { FormattedJD } from "@/hooks/useJobDescriptionProcessor";
import { ProcessedResume } from "@/types/resume";
import { getTopCandidateWithAI, RankedCandidate } from "@/lib/ai-matching";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Crown, Users, ArrowRight, Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AnonymousResultProps {
  job: FormattedJD;
  candidates: ProcessedResume[];
  totalCandidates: number;
  rankedCandidates?: RankedCandidate[];
}

export function AnonymousResult({
  job,
  candidates,
  totalCandidates,
  rankedCandidates,
}: AnonymousResultProps) {
  const navigate = useNavigate();
  const [topCandidate, setTopCandidate] =
    React.useState<RankedCandidate | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const getTopCandidate = async () => {
      try {
        setIsLoading(true);

        // If we already have ranked candidates, use the top one
        if (rankedCandidates && rankedCandidates.length > 0) {
          setTopCandidate(rankedCandidates[0]);
          return;
        }

        // Otherwise, call AI matching
        const result = await getTopCandidateWithAI(job, candidates);
        setTopCandidate(result);
      } catch (error) {
        console.error("Error getting top candidate:", error);
        // Fallback to basic display if AI fails
        if (candidates.length > 0) {
          setTopCandidate({
            candidateId: candidates[0]?.fileName || "candidate_0",
            candidateName: candidates[0]?.personalInfo.name || "Top Candidate",
            matchingScore: 75,
            summary: "This candidate has relevant experience for the role.",
            keyStrengths: candidates[0]?.skills.technical.slice(0, 3) || [
              "Experience",
            ],
            potentialConcerns: [],
            fitAnalysis: {
              technicalFit: 75,
              experienceFit: 75,
              culturalFit: 70,
              growthPotential: 80,
            },
            recommendation: "maybe",
            ranking: 1,
            processedResume: candidates[0],
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (
      candidates.length > 0 ||
      (rankedCandidates && rankedCandidates.length > 0)
    ) {
      getTopCandidate();
    } else {
      setIsLoading(false);
    }
  }, [job, candidates, rankedCandidates]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-text font-grotesk">
              🤖 AI is analyzing candidates...
            </h3>
            <p className="text-text-muted text-sm">
              Evaluating candidates against job requirements
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!topCandidate) {
    return (
      <div className="text-center py-8">
        <Target className="w-12 h-12 text-text-muted mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-text mb-2">
          No candidates to analyze
        </h3>
        <p className="text-text-muted text-sm">
          Upload some resumes to see matching results.
        </p>
      </div>
    );
  }

  const handleSignUp = () => {
    navigate("/signup");
  };

  return (
    <div className="space-y-6">
      {/* Analysis Complete Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-text font-grotesk">
          🎯 Analysis Complete!
        </h2>
        <p className="text-text-muted text-sm">
          Analyzed {totalCandidates} candidate{totalCandidates !== 1 ? "s" : ""}{" "}
          for {job.title}
        </p>
      </div>

      {/* Compact Top Candidate Card */}
      <Card className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-xl shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
        <CardHeader className="relative z-10 pb-3">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-grotesk">Top Match</CardTitle>
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary border-primary/20 text-xs"
            >
              #{topCandidate.ranking}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 space-y-4">
          {/* Candidate Info */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-text font-grotesk">
                {topCandidate.candidateName}
              </h3>
              <p className="text-text-muted text-xs">
                {topCandidate.processedResume.overallProfile.seniorityLevel} •{" "}
                {topCandidate.processedResume.experience.totalYears}y exp
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary font-grotesk">
                {topCandidate.matchingScore}%
              </div>
              <p className="text-text-muted text-xs">match</p>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text font-grotesk">
              AI Recommendation:
            </span>
            <Badge
              variant="outline"
              className={`text-xs px-2 py-1 ${
                topCandidate.recommendation === "strong_hire"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : topCandidate.recommendation === "hire"
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : topCandidate.recommendation === "maybe"
                  ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {topCandidate.recommendation === "strong_hire" &&
                "🌟 Strong Hire"}
              {topCandidate.recommendation === "hire" && "✅ Hire"}
              {topCandidate.recommendation === "maybe" && "🤔 Maybe"}
              {topCandidate.recommendation === "pass" && "❌ Pass"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Compact Upgrade Prompt */}
      <Card className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-xl shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
        <CardContent className="relative z-10 p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-text font-grotesk">
                Want the Full Analysis?
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-text-muted">
                <Users className="w-4 h-4 text-primary" />
                <span>All {totalCandidates} candidates ranked</span>
              </div>
              <div className="flex items-center gap-2 text-text-muted">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Detailed breakdowns</span>
              </div>
            </div>

            <Button
              onClick={handleSignUp}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 text-sm font-medium rounded-lg shadow-md group"
            >
              Sign Up Free - Get Full Results
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-text-subtle text-xs">No credit card required</p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Candidates Teaser */}
      {totalCandidates > 1 && (
        <div className="text-center p-4 items-center justify-center bg-bg-light/20 rounded-lg border border-border-light">
          <p className="text-text-muted text-sm">
            <Users className="w-4 h-4 inline mr-1 mb-1" />
            {totalCandidates - 1} more candidate
            {totalCandidates - 1 !== 1 ? "s" : ""} analyzed
            <Button
              onClick={handleSignUp}
              variant="link"
              size="sm"
              className="text-primary p-0 ml-2 text-sm"
            >
              View all →
            </Button>
          </p>
        </div>
      )}
    </div>
  );
}
