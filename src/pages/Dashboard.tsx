import React from "react";
import { useLocation } from "react-router-dom";
import { useThemeInit } from "../hooks/useThemeInit";
import { useUserPreferences } from "../hooks/useUserPreferences";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardOverview from "../components/dashboard/DashboardOverview";
import NewAnalysis from "../components/dashboard/NewAnalysis";
import MyReports from "../components/dashboard/MyReports";
import ReportDetail from "../components/dashboard/ReportDetail";
import Settings from "../components/dashboard/Settings";

const Dashboard = () => {
  const location = useLocation();
  const { preferences, updatePreference, isUpdating, isLoading } =
    useUserPreferences();

  // Initialize theme from user preferences
  useThemeInit();

  const toggleSidebar = async () => {
    // Optimistic update - the UI will change immediately
    // while the database update happens in the background
    try {
      await updatePreference({
        key: "dashboard_sidebar_collapsed",
        value: !preferences.dashboard_sidebar_collapsed,
      });
    } catch (error) {
      console.error("Failed to update sidebar preference:", error);
      // The UI will revert automatically due to React Query's error handling
    }
  };

  const renderContent = () => {
    const path = location.pathname;

    if (path.includes("/new")) {
      return <NewAnalysis />;
    } else if (path.match(/\/reports\/[^/]+$/)) {
      // Specific report detail page (e.g., /dashboard/reports/123)
      return <ReportDetail />;
    } else if (path.includes("/reports")) {
      return <MyReports />;
    } else if (path.includes("/settings")) {
      return <Settings />;
    } else {
      // Default to dashboard overview
      return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-text font-grotesk">
      {/* Expanded width container that contains everything */}
      <div className="max-w-[1600px] mx-auto relative border-l border-r border-border-custom flex flex-col min-h-screen">
        {/* Vertical line decorations */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-text-subtle to-transparent opacity-50 z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-text-subtle to-transparent opacity-50 z-10"></div>

        {/* Fixed Navbar */}
        <Navbar className="max-w-[1600px]" />

        {/* Dashboard Layout */}
        <div className="flex flex-1 min-h-0 pt-16">
          {/* Sidebar */}
          <div className="flex-shrink-0">
            <DashboardSidebar
              isCollapsed={
                isLoading ? false : preferences.dashboard_sidebar_collapsed
              }
              onToggleCollapse={toggleSidebar}
            />
          </div>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto">
            <div className="px-8 py-8">
              <div className="max-w-[1400px] mx-auto">{renderContent()}</div>
            </div>
          </main>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Dashboard;
