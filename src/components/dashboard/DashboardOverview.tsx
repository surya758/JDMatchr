import React from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  FileText,
  TrendingUp,
  Clock,
  BarChart3,
  Users,
} from "lucide-react";
import { useSubscription } from "../../hooks/useSubscription";

const DashboardOverview = () => {
  const { jobCreditsRemaining, subscriptionStatus } = useSubscription();

  const stats = [
    {
      title: "Recent Analyses",
      value: "0",
      subtitle: "This month",
      icon: BarChart3,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Total Reports",
      value: "0",
      subtitle: "All time",
      icon: FileText,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Success Rate",
      value: "--",
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
      href: "/dashboard/activity",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      hoverColor: "hover:bg-blue-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text mb-2">Dashboard</h1>
        <p className="text-text-muted text-lg">
          Welcome back! Here's an overview of your resume analysis activity.
        </p>
      </div>

      {/* Stats Grid */}
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

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-text mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.href}
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
      <div>
        <h2 className="text-xl font-semibold text-text mb-6">
          Recent Activity
        </h2>
        <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 shadow-xl">
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
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
