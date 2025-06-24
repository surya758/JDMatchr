import React, { useState } from "react";
import { Search, Filter, Download, Eye, Calendar, Users } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const MyReports = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Mock data - in real app this would come from API
  const reports = [
    {
      id: 1,
      jobTitle: "Senior React Developer",
      date: "2024-01-15",
      candidatesAnalyzed: 12,
      topMatch: "John Smith",
      matchScore: 92,
      status: "completed",
    },
    {
      id: 2,
      jobTitle: "UI/UX Designer",
      date: "2024-01-10",
      candidatesAnalyzed: 8,
      topMatch: "Sarah Johnson",
      matchScore: 88,
      status: "completed",
    },
    {
      id: 3,
      jobTitle: "Backend Engineer",
      date: "2024-01-08",
      candidatesAnalyzed: 15,
      topMatch: "Mike Chen",
      matchScore: 95,
      status: "completed",
    },
  ];

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.topMatch.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || report.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text mb-2">My Reports</h1>
        <p className="text-text-muted">
          View and manage your resume analysis reports and results.
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search reports..."
                className="pl-10 bg-bg/30 border-border-custom focus:border-primary/50 focus:ring-0 focus:outline-none"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-text-muted" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-bg/30 border border-border-custom rounded-lg px-3 py-2 text-text focus:border-primary/50 focus:ring-0 focus:outline-none"
              >
                <option value="all">All Reports</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="text-text-muted text-sm">
            {filteredReports.length} report
            {filteredReports.length !== 1 ? "s" : ""} found
          </div>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-12 shadow-xl text-center">
          <Users className="w-16 h-16 text-text-subtle mx-auto mb-4" />
          <h3 className="font-grotesk font-semibold text-text mb-2">
            {searchTerm || filterStatus !== "all"
              ? "No reports found"
              : "No reports yet"}
          </h3>
          <p className="text-text-muted mb-6">
            {searchTerm || filterStatus !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Start your first analysis to see reports here."}
          </p>
          {!searchTerm && filterStatus === "all" && (
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Start New Analysis
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 shadow-xl hover:bg-bg-light transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <div>
                      <h3 className="font-grotesk font-semibold text-text text-lg">
                        {report.jobTitle}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-text-muted">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(report.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{report.candidatesAnalyzed} candidates</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-text-muted text-sm mb-1">Top Match</p>
                      <p className="font-grotesk font-medium text-text">
                        {report.topMatch}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-muted text-sm mb-1">
                        Match Score
                      </p>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`px-3 py-1 rounded-lg ${getScoreBgColor(
                            report.matchScore
                          )}`}
                        >
                          <span
                            className={`font-grotesk font-semibold ${getScoreColor(
                              report.matchScore
                            )}`}
                          >
                            {report.matchScore}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-6">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border-custom hover:bg-bg-light"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border-custom hover:bg-bg-light"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {filteredReports.length > 0 && (
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
    </div>
  );
};

export default MyReports;
