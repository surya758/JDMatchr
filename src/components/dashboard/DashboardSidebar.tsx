import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Plus,
  FolderOpen,
  Settings,
  User,
  CreditCard,
  LogOut,
  ChevronDown,
  Menu,
  LayoutDashboard,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "../../hooks/useAuth";
import { useUserProfile } from "../../hooks/useUserProfile";
import { useSubscription } from "../../hooks/useSubscription";
import { useConfirmation } from "../../hooks/useConfirmation";
import ConfirmationModal from "../ui/confirmation-modal";

interface DashboardSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
}) => {
  const location = useLocation();
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(
    location.pathname.startsWith("/dashboard/settings")
  );
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const { subscriptionStatus } = useSubscription();
  const { setTheme } = useTheme();
  const {
    isOpen: isConfirmationOpen,
    isLoading: isConfirmationLoading,
    config: confirmationConfig,
    showConfirmation,
    hideConfirmation,
    confirmAction,
  } = useConfirmation();
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserDropdownOpen(false);
      }
    };

    if (isUserDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserDropdownOpen]);

  // Update settings expansion when route changes
  useEffect(() => {
    setIsSettingsExpanded(location.pathname.startsWith("/dashboard/settings"));
  }, [location.pathname]);

  const navigationItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      icon: Plus,
      label: "New Analysis",
      href: "/dashboard/new",
    },
    {
      icon: FolderOpen,
      label: "My Reports",
      href: "/dashboard/reports",
    },
  ];

  const settingsItems = [
    {
      icon: User,
      label: "Account",
      href: "/dashboard/settings/account",
    },
    {
      icon: Settings,
      label: "Preferences",
      href: "/dashboard/settings/preferences",
    },
    {
      icon: CreditCard,
      label: "Billing",
      href: "/dashboard/settings/billing",
    },
  ];

  const isActiveRoute = (href: string) => {
    // Special case for dashboard root - only match exact path
    if (href === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return (
      location.pathname === href || location.pathname.startsWith(href + "/")
    );
  };

  const isSettingsActive = () => {
    return location.pathname.startsWith("/dashboard/settings");
  };

  const handleLogout = async () => {
    showConfirmation(
      {
        title: "Sign Out",
        description: "Are you sure you want to sign out of your account?",
        confirmText: "Sign Out",
        cancelText: "Cancel",
        variant: "warning",
      },
      async () => {
        setTheme("dark");
        await signOut();
        navigate("/");
      }
    );
  };

  return (
    <div
      className={`
        bg-bg/50 backdrop-blur-sm border-r border-border-custom
        transition-all duration-300 ease-in-out h-full
        ${isCollapsed ? "w-16" : "w-64"}
         flex flex-col
      `}
    >
      {/* Header with collapse button */}
      <div className="flex items-center justify-between p-4 border-b border-border-custom">
        <button
          onClick={onToggleCollapse}
          className={`
            p-2 rounded-lg hover:bg-bg-light transition-all duration-200
            ${isCollapsed ? "mx-auto" : ""}
          `}
        >
          {isCollapsed ? (
            <Menu className="w-4 h-4 text-text-muted" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-text-muted" />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`
              group flex items-center rounded-xl transition-all duration-200
              ${isCollapsed ? "px-2 py-2.5 justify-center" : "px-3 py-2.5"}
              ${
                isActiveRoute(item.href)
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-text-muted hover:text-text hover:bg-bg-light"
              }
            `}
            title={isCollapsed ? item.label : ""}
          >
            <item.icon
              className={`
                w-5 h-5 flex-shrink-0 transition-transform duration-200
                ${!isCollapsed ? "mr-3" : ""}
                ${
                  isActiveRoute(item.href)
                    ? "text-primary"
                    : "group-hover:scale-110"
                }
              `}
            />

            {!isCollapsed && (
              <span className="font-grotesk font-medium text-sm">
                {item.label}
              </span>
            )}
          </Link>
        ))}

        {/* Settings Section */}
        <div>
          <button
            onClick={() => {
              if (isCollapsed) {
                // If collapsed, navigate to settings
                navigate("/dashboard/settings/account");
              } else {
                // If expanded, toggle the submenu
                setIsSettingsExpanded(!isSettingsExpanded);
              }
            }}
            className={`
              w-full group flex items-center rounded-xl transition-all duration-200
              ${isCollapsed ? "px-2 py-2.5 justify-center" : "px-3 py-2.5"}
              ${
                isSettingsActive()
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-text-muted hover:text-text hover:bg-bg-light"
              }
            `}
            title={isCollapsed ? "Settings" : ""}
          >
            <Settings
              className={`
                w-5 h-5 flex-shrink-0 transition-transform duration-200
                ${!isCollapsed ? "mr-3" : ""}
                ${isSettingsActive() ? "text-primary" : "group-hover:scale-110"}
              `}
            />

            {!isCollapsed && (
              <div className="flex items-center justify-between w-full">
                <span className="font-grotesk font-medium text-sm">
                  Settings
                </span>
                <ChevronDown
                  className={`
                    w-4 h-4 transition-transform duration-200
                    ${isSettingsExpanded ? "rotate-180" : ""}
                  `}
                />
              </div>
            )}
          </button>

          {/* Settings Submenu */}
          {!isCollapsed && (
            <div
              className={`
                overflow-hidden transition-all duration-300 ease-in-out
                ${
                  isSettingsExpanded
                    ? "max-h-32 opacity-100 mt-2"
                    : "max-h-0 opacity-0"
                }
              `}
            >
              <div className="ml-4 space-y-1">
                {settingsItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`
                      group flex items-center px-3 py-2 rounded-lg transition-all duration-200 text-sm
                      ${
                        isActiveRoute(item.href)
                          ? "bg-primary/5 text-primary"
                          : "text-text-muted hover:text-text hover:bg-bg-light/50"
                      }
                    `}
                  >
                    <item.icon className="w-4 h-4 mr-3 flex-shrink-0" />
                    <span className="font-grotesk">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Account Section with User Dropdown - Fixed at bottom */}
      <div className="mt-auto px-3 py-4">
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className={`
              w-full flex items-center rounded-xl transition-all duration-200
              hover:bg-bg-light
              ${isUserDropdownOpen ? "bg-bg-light" : ""}
              ${isCollapsed ? "px-2 py-2 justify-center" : "px-3 py-2.5"}
            `}
            title={isCollapsed ? "User Menu" : ""}
          >
            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full flex-shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile?.avatar_url}
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <User className="w-4 h-4 text-primary" />
              )}
            </div>

            {!isCollapsed && (
              <div className="flex items-center justify-between w-full ml-3">
                <div className="text-left">
                  <div className="font-grotesk font-medium text-sm text-text">
                    {profile?.full_name || user?.email?.split("@")[0] || "User"}
                  </div>
                  <div className="font-grotesk text-xs text-text-subtle capitalize">
                    {subscriptionStatus} plan
                  </div>
                </div>
                <ChevronDown
                  className={`
                    w-4 h-4 text-text-muted transition-transform duration-200
                    ${isUserDropdownOpen ? "" : "rotate-180"}
                  `}
                />
              </div>
            )}
          </button>

          {/* User Dropdown Menu */}
          <div
            className={`
              absolute bg-bg/95 backdrop-blur-sm border border-border-custom rounded-xl
              shadow-2xl overflow-hidden transition-all duration-200 z-50
              ${
                isCollapsed
                  ? "bottom-0 left-full ml-4 w-48"
                  : "bottom-full left-0 right-0 mb-2"
              }
              ${
                isUserDropdownOpen
                  ? "opacity-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 translate-y-2 pointer-events-none"
              }
            `}
          >
            <button
              onClick={handleLogout}
              className="w-full flex items-center text-left transition-all duration-200 text-text-muted hover:text-red-400 hover:bg-red-500/5 rounded-b-xl m-0 border-0 p-0"
            >
              <div className="w-full flex items-center px-4 py-3">
                <LogOut className="w-4 h-4 mr-3 flex-shrink-0" />
                <span className="font-grotesk font-medium text-sm">Logout</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmationConfig && (
        <ConfirmationModal
          isOpen={isConfirmationOpen}
          onClose={hideConfirmation}
          onConfirm={confirmAction}
          isLoading={isConfirmationLoading}
          {...confirmationConfig}
        />
      )}
    </div>
  );
};

export default DashboardSidebar;
