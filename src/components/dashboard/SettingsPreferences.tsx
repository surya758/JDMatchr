import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useUserPreferences } from "../../hooks/useUserPreferences";
import { useTheme } from "next-themes";
import { LoaderInline } from "../ui/loader";
import { useToast } from "../../hooks/use-toast";
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  Bell,
  Mail,
  Layout,
  Globe,
  RefreshCw,
} from "lucide-react";

const SettingsPreferences = () => {
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const {
    preferences,
    isLoading,
    updatePreference,
    resetPreferences,
    isUpdating,
    isResetting,
    updateError,
  } = useUserPreferences();

  const handlePreferenceChange = async (key: string, value: any) => {
    try {
      // Handle theme changes with next-themes directly
      if (key === "theme") {
        setTheme(value);
        // Also save to user preferences for persistence across devices
        await updatePreference({ key: key as any, value });
      } else {
        await updatePreference({ key: key as any, value });
      }

      toast({
        title: "Preference Updated",
        description: "Your preference has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update preference. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResetPreferences = async () => {
    try {
      await resetPreferences();
      toast({
        title: "Preferences Reset",
        description: "All preferences have been reset to defaults.",
      });
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: "Failed to reset preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Settings className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-text">Preferences</h2>
        </div>
        <Card className="bg-bg/50 backdrop-blur-sm border-border-custom shadow-xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <LoaderInline isLoading={true} />
              <span className="ml-2 text-text-muted">
                Loading preferences...
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Settings className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-text">Preferences</h2>
        </div>
        <Button
          variant="outline"
          onClick={handleResetPreferences}
          disabled={isResetting}
          className="border-border-custom hover:bg-bg-light"
        >
          {isResetting ? (
            <LoaderInline isLoading={true} />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Reset to Defaults
        </Button>
      </div>

      {/* Error Display */}
      {updateError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-red-400 text-sm">
            Error updating preferences: {updateError.message}
          </p>
        </div>
      )}

      {/* Appearance Settings */}
      <Card className="bg-bg/50 backdrop-blur-sm border-border-custom shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sun className="w-5 h-5" />
            <span>Appearance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="theme" className="text-sm font-medium">
              Theme
            </Label>
            <Select
              value={preferences.theme}
              onValueChange={(value) => handlePreferenceChange("theme", value)}
              disabled={isUpdating}
            >
              <SelectTrigger className="bg-bg-light/30 border-border-custom">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center space-x-2">
                    <Sun className="w-4 h-4" />
                    <span>Light</span>
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center space-x-2">
                    <Moon className="w-4 h-4" />
                    <span>Dark</span>
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-4 h-4" />
                    <span>System</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Settings */}
      <Card className="bg-bg/50 backdrop-blur-sm border-border-custom shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Layout className="w-5 h-5" />
            <span>Dashboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label
                htmlFor="sidebar-collapsed"
                className="text-sm font-medium"
              >
                Collapse Sidebar by Default
              </Label>
              <p className="text-xs text-text-muted">
                Start with the sidebar collapsed for more screen space
              </p>
            </div>
            <Switch
              id="sidebar-collapsed"
              checked={preferences.dashboard_sidebar_collapsed}
              onCheckedChange={(checked) =>
                handlePreferenceChange("dashboard_sidebar_collapsed", checked)
              }
              disabled={isUpdating}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="analysis-view" className="text-sm font-medium">
              Default Analysis View
            </Label>
            <Select
              value={preferences.default_analysis_view}
              onValueChange={(value) =>
                handlePreferenceChange("default_analysis_view", value)
              }
              disabled={isUpdating}
            >
              <SelectTrigger className="bg-bg-light/30 border-border-custom">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list">List View</SelectItem>
                <SelectItem value="grid">Grid View</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="results-per-page" className="text-sm font-medium">
              Results Per Page
            </Label>
            <Select
              value={preferences.results_per_page.toString()}
              onValueChange={(value) =>
                handlePreferenceChange("results_per_page", parseInt(value))
              }
              disabled={isUpdating}
            >
              <SelectTrigger className="bg-bg-light/30 border-border-custom">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 results</SelectItem>
                <SelectItem value="10">10 results</SelectItem>
                <SelectItem value="20">20 results</SelectItem>
                <SelectItem value="50">50 results</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-expand" className="text-sm font-medium">
                Auto-expand Candidates
              </Label>
              <p className="text-xs text-text-muted">
                Automatically expand the first candidate in reports
              </p>
            </div>
            <Switch
              id="auto-expand"
              checked={preferences.auto_expand_candidates}
              onCheckedChange={(checked) =>
                handlePreferenceChange("auto_expand_candidates", checked)
              }
              disabled={isUpdating}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      {/* <Card className="bg-bg/50 backdrop-blur-sm border-border-custom shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="notifications" className="text-sm font-medium">
                Browser Notifications
              </Label>
              <p className="text-xs text-text-muted">
                Receive notifications when analysis is complete
              </p>
            </div>
            <Switch
              id="notifications"
              checked={preferences.notifications_enabled}
              onCheckedChange={(checked) =>
                handlePreferenceChange("notifications_enabled", checked)
              }
              disabled={isUpdating}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label
                htmlFor="email-notifications"
                className="text-sm font-medium"
              >
                Email Notifications
              </Label>
              <p className="text-xs text-text-muted">
                Receive email updates about your account and reports
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={preferences.email_notifications}
              onCheckedChange={(checked) =>
                handlePreferenceChange("email_notifications", checked)
              }
              disabled={isUpdating}
            />
          </div>
        </CardContent>
      </Card> */}

      {/* Localization Settings */}
      {/* <Card className="bg-bg/50 backdrop-blur-sm border-border-custom shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Localization</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="language" className="text-sm font-medium">
              Language
            </Label>
            <Select
              value={preferences.language}
              onValueChange={(value) =>
                handlePreferenceChange("language", value)
              }
              disabled={isUpdating}
            >
              <SelectTrigger className="bg-bg-light/30 border-border-custom">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="timezone" className="text-sm font-medium">
              Timezone
            </Label>
            <Select
              value={preferences.timezone}
              onValueChange={(value) =>
                handlePreferenceChange("timezone", value)
              }
              disabled={isUpdating}
            >
              <SelectTrigger className="bg-bg-light/30 border-border-custom">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Los_Angeles">
                  Pacific Time
                </SelectItem>
                <SelectItem value="Europe/London">London</SelectItem>
                <SelectItem value="Europe/Paris">Paris</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card> */}

      {/* Current Preferences Summary */}
      <Card className="bg-bg/50 backdrop-blur-sm border-border-custom shadow-xl">
        <CardHeader>
          <CardTitle>Current Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-xs text-text-muted uppercase tracking-wide">
                Theme
              </p>
              <Badge variant="secondary" className="capitalize">
                {preferences.theme}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-text-muted uppercase tracking-wide">
                Results Per Page
              </p>
              <Badge variant="secondary">{preferences.results_per_page}</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-text-muted uppercase tracking-wide">
                Language
              </p>
              <Badge variant="secondary" className="uppercase">
                {preferences.language}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPreferences;
