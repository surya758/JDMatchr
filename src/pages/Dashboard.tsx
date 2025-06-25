import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardOverview from "../components/dashboard/DashboardOverview";
import NewAnalysis from "../components/dashboard/NewAnalysis";
import MyReports from "../components/dashboard/MyReports";
import Settings from "../components/dashboard/Settings";

const Dashboard = () => {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const renderContent = () => {
    const path = location.pathname;

    if (path.includes("/new")) {
      return <NewAnalysis />;
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
      {/* Fixed width container that contains everything */}
      <div className="max-w-7xl mx-auto relative border-l border-r border-border-custom flex flex-col min-h-screen">
        {/* Vertical line decorations */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-text-subtle to-transparent opacity-50 z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-text-subtle to-transparent opacity-50 z-10"></div>

        {/* Fixed Navbar */}
        <Navbar />

        {/* Dashboard Layout */}
        <div className="flex flex-1 min-h-0 pt-16">
          {/* Sidebar */}
          <div className="flex-shrink-0">
            <DashboardSidebar
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={toggleSidebar}
            />
          </div>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto">
            <div className="px-6 py-8">
              <div className="max-w-6xl mx-auto">{renderContent()}</div>
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
