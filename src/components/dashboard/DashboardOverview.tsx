import React from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  FileText,
  TrendingUp,
  Clock,
  BarChart3,
  Users,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useSubscription } from "../../hooks/useSubscription";
import { useDashboardStats } from "../../hooks/useDashboardStats";

const DashboardOverview = () => {
  const { jobCreditsRemaining, subscriptionStatus } = useSubscription();
  const {
    data: dashboardStats,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useDashboardStats();

  const stats = [
    {
      title: "Recent Analyses",
      value: dashboardStats?.recentAnalyses?.toString() || "0",
      subtitle: "This month",
      icon: BarChart3,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Total Reports",
      value: dashboardStats?.totalReports?.toString() || "0",
      subtitle: "All time",
      icon: FileText,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Success Rate",
      value: dashboardStats?.averageMatchScore
        ? `${dashboardStats.averageMatchScore}%`
        : "--",
      subtitle: "Average match",
      icon: TrendingUp,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Credits Left",
      value: jobCreditsRemaining.toString(),
      subtitle: `${
        subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)
      } plan`,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  const quickActions = [
    {
      title: "Start New Analysis",
      description: "Upload resumes and job description",
      icon: Plus,
      href: "/dashboard/new",
      color: "text-primary",
      bgColor: "bg-primary/10",
      hoverColor: "hover:bg-primary/20",
    },
    {
      title: "View Reports",
      description: "Browse your analysis history",
      icon: FileText,
      href: "/dashboard/reports",
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      hoverColor: "hover:bg-green-500/20",
    },
    {
      title: "Recent Activity",
      description: "See your latest analyses",
      icon: Clock,
      href: "#recent-activity",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      hoverColor: "hover:bg-blue-500/20",
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        document.getElementById("recent-activity")?.scrollIntoView({
          behavior: "smooth",
        });
      },
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-text-subtle" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "processing":
        return "Processing";
      case "failed":
        return "Failed";
      default:
        return "Unknown";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text mb-2">Dashboard</h1>
          <p className="text-text-muted text-lg">
            Welcome back! Here's an overview of your resume analysis activity.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="flex items-center gap-2 px-4 py-2 bg-bg/50 hover:bg-bg-light border border-border-custom rounded-xl transition-colors duration-200 disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
          />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 shadow-xl animate-pulse"
            >
              <div className="w-12 h-12 bg-bg-light rounded-xl mb-4"></div>
              <div className="h-4 bg-bg-light rounded mb-2"></div>
              <div className="h-6 bg-bg-light rounded mb-1"></div>
              <div className="h-3 bg-bg-light rounded w-2/3"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <h3 className="font-semibold text-red-400">
              Failed to load dashboard data
            </h3>
          </div>
          <p className="text-red-300 mb-4">
            There was an error loading your dashboard statistics. Please try
            refreshing.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Stats Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 shadow-xl hover:bg-bg-light transition-colors duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}
                >
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div>
                <h3 className="font-grotesk font-semibold text-text mb-1">
                  {stat.title}
                </h3>
                <p className="text-2xl font-bold text-primary mb-1">
                  {stat.value}
                </p>
                <p className="text-text-muted text-sm">{stat.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-text mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.href}
              onClick={action.onClick}
              className={`
                bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 shadow-xl 
                ${action.hoverColor} transition-all duration-200 cursor-pointer group
                hover:scale-[1.02] hover:shadow-2xl
              `}
            >
              <div className="flex items-start space-x-4">
                <div
                  className={`w-12 h-12 ${action.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                >
                  <action.icon className={`w-6 h-6 ${action.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-grotesk font-semibold text-text mb-2">
                    {action.title}
                  </h3>
                  <p className="text-text-muted text-sm">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div id="recent-activity">
        <h2 className="text-xl font-semibold text-text mb-6">
          Recent Activity
        </h2>
        <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 shadow-xl">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 animate-pulse"
                >
                  <div className="w-10 h-10 bg-bg-light rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-bg-light rounded mb-2"></div>
                    <div className="h-3 bg-bg-light rounded w-2/3"></div>
                  </div>
                  <div className="w-16 h-6 bg-bg-light rounded"></div>
                </div>
              ))}
            </div>
          ) : !dashboardStats?.recentActivity?.length ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-text-subtle mx-auto mb-4" />
              <h3 className="font-grotesk font-semibold text-text mb-2">
                No recent activity
              </h3>
              <p className="text-text-muted mb-6">
                Start your first analysis to see your activity here.
              </p>
              <Link
                to="/dashboard/new"
                className="inline-flex items-center px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-colors duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Start New Analysis
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardStats.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 bg-bg/30 rounded-xl hover:bg-bg-light/50 transition-colors duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-text">
                          {activity.title}
                        </h4>
                        {activity.company && (
                          <>
                            <span className="text-text-subtle">•</span>
                            <span className="text-text-muted text-sm">
                              {activity.company}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-text-muted">
                        <span>
                          {activity.candidatesCount}{" "}
                          {activity.candidatesCount === 1
                            ? "candidate"
                            : "candidates"}
                        </span>
                        <span>•</span>
                        <span>{formatDate(activity.date)}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(activity.status)}
                          <span>{getStatusText(activity.status)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {activity.status === "completed" &&
                      activity.topScore > 0 && (
                        <div className="text-right">
                          <div className="text-sm font-medium text-primary">
                            {activity.topScore}%
                          </div>
                          <div className="text-xs text-text-muted">
                            Top match
                          </div>
                        </div>
                      )}
                    <Link
                      to={`/dashboard/reports`}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 hover:bg-bg-light rounded-lg"
                    >
                      <ExternalLink className="w-4 h-4 text-text-muted" />
                    </Link>
                  </div>
                </div>
              ))}
              {dashboardStats.recentActivity.length >= 3 && (
                <div className="text-center pt-4">
                  <Link
                    to="/dashboard/reports"
                    className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors duration-200"
                  >
                    View all reports
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
