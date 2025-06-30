import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  Users,
  ChevronDown,
  X,
  SlidersHorizontal,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileDown,
  Crown,
  Grid,
  List,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import { useJobReports, type JobReport } from "@/hooks/useJobReports";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { supabase } from "@/lib/supabase";
import { LoaderInline } from "../ui/loader";

const MyReports = () => {
  const { preferences, updatePreference } = useUserPreferences();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [scoreRange, setScoreRange] = useState("all");
  const [candidatesRange, setCandidatesRange] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "grid">(
    preferences.default_analysis_view
  );
  const itemsPerPage = preferences.results_per_page;

  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: reports = [], isLoading, error, refetch } = useJobReports();

  // Update viewMode when preferences change
  useEffect(() => {
    setViewMode(preferences.default_analysis_view);
  }, [preferences.default_analysis_view]);

  // Handle view mode change
  const handleViewModeChange = async (mode: "list" | "grid") => {
    setViewMode(mode);
    await updatePreference({ key: "default_analysis_view", value: mode });
  };

  // Handle top candidate resume download
  const handleDownloadResume = async (report: JobReport) => {
    if (!report.topCandidateFilePath) {
      toast({
        title: "Download Failed",
        description: "Resume file not available for download.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use Supabase's download method
      const { data, error } = await supabase.storage
        .from("resume-files")
        .download(report.topCandidateFilePath);

      if (error) {
        console.error("Supabase download error:", error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error("No file data received");
      }

      // Create download link
      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        report.topCandidateFileName || `${report.topMatch}_resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `Downloading ${report.topMatch}'s resume...`,
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
    }
  };

  const filteredReports = reports
    .filter((report) => {
      const matchesSearch =
        report.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.topMatch.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.company.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || report.status === filterStatus;

      const matchesDateRange = (() => {
        if (dateRange === "all") return true;
        const reportDate = new Date(report.date);
        const now = new Date();
        const daysDiff = Math.floor(
          (now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        switch (dateRange) {
          case "today":
            return daysDiff === 0;
          case "week":
            return daysDiff <= 7;
          case "month":
            return daysDiff <= 30;
          case "quarter":
            return daysDiff <= 90;
          default:
            return true;
        }
      })();

      const matchesScoreRange = (() => {
        if (scoreRange === "all") return true;
        const score = report.matchScore;
        switch (scoreRange) {
          case "excellent":
            return score >= 90;
          case "good":
            return score >= 75 && score < 90;
          case "fair":
            return score >= 60 && score < 75;
          case "poor":
            return score < 60;
          default:
            return true;
        }
      })();

      const matchesCandidatesRange = (() => {
        if (candidatesRange === "all") return true;
        const candidates = report.candidatesAnalyzed;
        switch (candidatesRange) {
          case "small":
            return candidates <= 5;
          case "medium":
            return candidates > 5 && candidates <= 15;
          case "large":
            return candidates > 15;
          default:
            return true;
        }
      })();

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDateRange &&
        matchesScoreRange &&
        matchesCandidatesRange
      );
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "date":
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case "score":
          aValue = a.matchScore;
          bValue = b.matchScore;
          break;
        case "candidates":
          aValue = a.candidatesAnalyzed;
          bValue = b.candidatesAnalyzed;
          break;
        case "title":
          aValue = a.jobTitle.toLowerCase();
          bValue = b.jobTitle.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReports = filteredReports.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, dateRange, scoreRange, candidatesRange]);

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

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setDateRange("all");
    setScoreRange("all");
    setCandidatesRange("all");
    setCurrentPage(1);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (filterStatus !== "all") count++;
    if (dateRange !== "all") count++;
    if (scoreRange !== "all") count++;
    if (candidatesRange !== "all") count++;
    return count;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text">My Reports</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleViewModeChange("list")}
            className={
              viewMode === "list" ? "bg-primary text-primary-foreground" : ""
            }
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleViewModeChange("grid")}
            className={
              viewMode === "grid" ? "bg-primary text-primary-foreground" : ""
            }
          >
            <Grid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Stats - Moved to top */}
      {!isLoading && filteredReports.length > 0 && (
        <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 shadow-xl">
          <h3 className="font-grotesk font-semibold text-text mb-4">
            Summary Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary mb-1">
                {filteredReports.reduce(
                  (sum, report) => sum + report.candidatesAnalyzed,
                  0
                )}
              </p>
              <p className="text-text-muted text-sm">
                Total Candidates Analyzed
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary mb-1">
                {Math.round(
                  filteredReports.reduce(
                    (sum, report) => sum + report.matchScore,
                    0
                  ) / filteredReports.length
                )}
                %
              </p>
              <p className="text-text-muted text-sm">Average Match Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary mb-1">
                {filteredReports.length}
              </p>
              <p className="text-text-muted text-sm">Completed Analyses</p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <div className="flex-1">
              <h3 className="font-grotesk font-semibold text-red-400 mb-1">
                Failed to Load Reports
              </h3>
              <p className="text-red-300 text-sm">
                There was an error loading your reports. Please try again.
              </p>
            </div>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="border-red-500/20 text-red-400 hover:bg-red-500/10"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-12 shadow-xl text-center">
          <Loader2 className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
          <h3 className="font-grotesk font-semibold text-text mb-2">
            Loading Reports
          </h3>
          <p className="text-text-muted">Fetching your analysis reports...</p>
        </div>
      )}

      {/* Main Content - Only show when not loading */}
      {!isLoading && (
        <>
          {/* Streamlined Filters */}
          <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-4 shadow-xl">
            {/* Main Search and Controls */}
            <div className="flex items-center gap-4">
              {/* Search Bar - Takes most of the space */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search reports..."
                  className="pl-10 pr-8 bg-bg/30 border-border-custom focus:border-primary/50 focus:ring-0 focus:outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted hover:text-text transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Compact Controls */}
              <div className="flex items-center gap-2">
                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [sort, order] = e.target.value.split("-");
                      setSortBy(sort);
                      setSortOrder(order);
                    }}
                    className="bg-bg/30 border border-border-custom rounded-lg pl-3 pr-10 py-2 text-sm text-text focus:border-primary/50 focus:ring-0 appearance-none cursor-pointer w-full"
                  >
                    <option value="date-desc">Newest</option>
                    <option value="date-asc">Oldest</option>
                    <option value="score-desc">Top Score</option>
                    <option value="score-asc">Low Score</option>
                    <option value="candidates-desc">Most Candidates</option>
                    <option value="candidates-asc">Few Candidates</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                </div>

                {/* Filter Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`border-border-custom hover:bg-bg-light relative ${
                    getActiveFiltersCount() > 0
                      ? "border-primary/50 bg-primary/5"
                      : ""
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {getActiveFiltersCount() > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-xs text-primary-foreground font-medium">
                        {getActiveFiltersCount()}
                      </span>
                    </div>
                  )}
                </Button>

                {/* Clear Filters - Only show when active */}
                {getActiveFiltersCount() > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-text-muted hover:text-red-400 p-2"
                    title="Clear all filters"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Results Summary - Compact single line with pagination info */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-custom/50">
              <div className="text-text-muted text-sm">
                <span className="font-medium text-text">
                  {filteredReports.length === 0 ? 0 : startIndex + 1}
                </span>
                {filteredReports.length > 0 && (
                  <>
                    {" - "}
                    <span className="font-medium text-text">
                      {Math.min(endIndex, filteredReports.length)}
                    </span>
                  </>
                )}{" "}
                of{" "}
                <span className="font-medium text-text">
                  {filteredReports.length}
                </span>{" "}
                {reports.length > 1 ? "reports" : "report"}
                {filteredReports.length !== reports.length && (
                  <span className="text-text-subtle">
                    {" "}
                    (filtered from {reports.length})
                  </span>
                )}
              </div>
              {getActiveFiltersCount() > 0 && (
                <div className="text-text-subtle text-xs">
                  {getActiveFiltersCount()} filter
                  {getActiveFiltersCount() !== 1 ? "s" : ""}
                </div>
              )}
            </div>

            {/* Expandable Filters Panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-border-custom/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label className="text-text-muted text-sm">Status</Label>
                    <div className="relative">
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full bg-bg/30 border border-border-custom rounded-lg pl-3 pr-10 py-2 text-sm text-text focus:border-primary/50 focus:ring-0 appearance-none cursor-pointer"
                      >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="processing">Processing</option>
                        <option value="failed">Failed</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label className="text-text-muted text-sm">
                      Date Range
                    </Label>
                    <div className="relative">
                      <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="w-full bg-bg/30 border border-border-custom rounded-lg pl-3 pr-10 py-2 text-sm text-text focus:border-primary/50 focus:ring-0 appearance-none cursor-pointer"
                      >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="quarter">Last 90 Days</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                    </div>
                  </div>

                  {/* Score Range */}
                  <div className="space-y-2">
                    <Label className="text-text-muted text-sm">
                      Match Score
                    </Label>
                    <div className="relative">
                      <select
                        value={scoreRange}
                        onChange={(e) => setScoreRange(e.target.value)}
                        className="w-full bg-bg/30 border border-border-custom rounded-lg pl-3 pr-10 py-2 text-sm text-text focus:border-primary/50 focus:ring-0 appearance-none cursor-pointer"
                      >
                        <option value="all">All Scores</option>
                        <option value="excellent">90%+ Excellent</option>
                        <option value="good">75-89% Good</option>
                        <option value="fair">60-74% Fair</option>
                        <option value="poor">&lt;60% Poor</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                    </div>
                  </div>

                  {/* Candidates Range */}
                  <div className="space-y-2">
                    <Label className="text-text-muted text-sm">
                      Candidates
                    </Label>
                    <div className="relative">
                      <select
                        value={candidatesRange}
                        onChange={(e) => setCandidatesRange(e.target.value)}
                        className="w-full bg-bg/30 border border-border-custom rounded-lg pl-3 pr-10 py-2 text-sm text-text focus:border-primary/50 focus:ring-0 appearance-none cursor-pointer"
                      >
                        <option value="all">Any Amount</option>
                        <option value="small">1-5 Small</option>
                        <option value="medium">6-15 Medium</option>
                        <option value="large">16+ Large</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reports List/Grid */}
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-4"
            }
          >
            {paginatedReports.map((report) => (
              <div
                key={report.id}
                className={`
                  bg-bg/50 backdrop-blur-sm border border-border-custom rounded-xl p-4
                  transition-all duration-200
                  ${
                    viewMode === "grid"
                      ? "flex flex-col"
                      : "flex items-center justify-between"
                  }
                `}
              >
                {/* Report Content */}
                <div
                  className={`${
                    viewMode === "grid"
                      ? "space-y-4"
                      : "flex items-center gap-6 flex-1"
                  }`}
                >
                  {/* Job Info */}
                  <div
                    className={`flex-1 min-w-0 ${
                      viewMode === "grid" ? "mb-4" : ""
                    }`}
                  >
                    <h3 className="font-semibold text-text truncate">
                      {report.jobTitle}
                    </h3>
                    <p className="text-sm text-text-muted">{report.company}</p>
                  </div>

                  {/* Stats */}
                  <div
                    className={`flex gap-4 ${
                      viewMode === "grid" ? "justify-between" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-text-muted" />
                      <span className="text-sm text-text-muted">
                        {report.candidatesAnalyzed} candidates
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-text-muted" />
                      <span className="text-sm text-text-muted">
                        {new Date(report.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Score and Actions */}
                  <div
                    className={`flex items-center gap-2 ${
                      viewMode === "grid" ? "mt-4 justify-end" : ""
                    }`}
                  >
                    <div
                      className={`
                        px-2 py-1 rounded-lg text-sm font-medium
                        ${getScoreBgColor(report.matchScore)}
                        ${getScoreColor(report.matchScore)}
                      `}
                    >
                      {report.matchScore}% Match
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          navigate(`/dashboard/reports/${report.id}`)
                        }
                        className="hover:bg-bg-light/50"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {report.topCandidateFilePath && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadResume(report)}
                          className="hover:bg-bg-light/50"
                        >
                          <FileDown className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={
                      currentPage === 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
};

export default MyReports;
