import React, { useState } from "react";
import {
  User,
  Bell,
  Shield,
  Palette,
  Edit3,
  X,
  Check,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { useAuth } from "../../hooks/useAuth";
import { useUserProfile } from "../../hooks/useUserProfile";
import {
  useConfirmation,
  confirmationConfigs,
} from "../../hooks/useConfirmation";
import ConfirmationModal from "../ui/confirmation-modal";
import { deleteUserAccount } from "../../lib/account";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/use-toast";
import { useTheme } from "next-themes";

const SettingsPreferences = () => {
  const { user, signOut } = useAuth();
  const { profile, updateProfile, isUpdating } = useUserProfile();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(profile?.full_name || "");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const {
    isOpen: isConfirmationOpen,
    isLoading: isConfirmationLoading,
    config: confirmationConfig,
    showConfirmation,
    hideConfirmation,
    confirmAction,
  } = useConfirmation();

  const [formData, setFormData] = useState({
    fullName: profile?.full_name || "",
    email: user?.email || "",
    notifications: true,
    emailReports: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditName = () => {
    setEditedName(profile?.full_name || "");
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (editedName.trim()) {
      try {
        await updateProfile({
          full_name: editedName.trim(),
        });
        setFormData((prev) => ({ ...prev, fullName: editedName.trim() }));
        setIsEditingName(false);
        toast({
          title: "Name updated successfully",
          description: "Your full name has been updated.",
        });
      } catch (error) {
        toast({
          title: "Failed to update name",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCancelEdit = () => {
    setEditedName(profile?.full_name || "");
    setIsEditingName(false);
  };

  const handleDeleteAccount = () => {
    showConfirmation(
      {
        ...confirmationConfigs.deleteAccount(),
        children: (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <h4 className="font-grotesk font-semibold text-red-400 mb-2">
              This will permanently delete:
            </h4>
            <ul className="text-red-300 text-sm space-y-1 list-disc list-inside">
              <li>Your user profile and account information</li>
              <li>All your analysis reports and history</li>
              <li>Your subscription and billing information</li>
              <li>Any saved preferences and settings</li>
            </ul>
            <p className="text-red-300 text-sm mt-3 font-medium">
              This action cannot be undone. Please be certain.
            </p>
          </div>
        ),
      },
      async () => {
        setIsDeletingAccount(true);

        try {
          // Call the account deletion service
          const result = await deleteUserAccount();

          if (!result.success) {
            throw new Error(result.error || "Failed to delete account");
          }

          // Show success message before redirect
          toast({
            title: "Account deleted successfully",
            description: "Thank you for using jdmatchr.",
          });

          // Account deletion successful - reset theme and sign out
          setTheme("dark");
          await signOut();
          navigate("/", { replace: true });
        } catch (error) {
          console.error("Account deletion error:", error);
          toast({
            title: "Failed to delete account",
            description:
              error instanceof Error
                ? error.message
                : "Please try again or contact support.",
            variant: "destructive",
          });
        } finally {
          setIsDeletingAccount(false);
        }
      }
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text mb-2">Preferences</h1>
        <p className="text-text-muted">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-grotesk font-semibold text-text">
                  Profile Information
                </h2>
                <p className="text-text-muted text-sm">
                  Update your personal details
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="fullName" className="text-text-muted">
                  Full Name
                </Label>
                {!isEditingName && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditName}
                    className="h-8 px-2 text-text-muted hover:text-text hover:bg-bg-light"
                  >
                    <Edit3 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>

              {isEditingName ? (
                <div className="flex items-center space-x-2">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="bg-bg/30 border-border-custom focus:border-primary/50 focus:ring-0 focus:outline-none"
                    placeholder="Enter your full name"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveName}
                    disabled={isUpdating || !editedName.trim()}
                    className="h-10 px-3 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="h-10 px-3 text-text-muted hover:text-text hover:bg-bg-light"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Input
                  id="fullName"
                  name="fullName"
                  disabled
                  value={profile?.full_name || "Not set"}
                  className="bg-bg/30 border-border-custom cursor-default"
                />
              )}
            </div>

            <div>
              <Label htmlFor="email" className="text-text-muted">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                value={profile?.email}
                onChange={handleInputChange}
                disabled
                className="bg-bg/20 border-border-custom opacity-50 cursor-not-allowed"
              />
              <p className="text-text-subtle text-xs mt-1">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="font-grotesk font-semibold text-text">Security</h2>
              <p className="text-text-muted text-sm">
                Manage your account security
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={handleDeleteAccount}
              disabled={isConfirmationLoading || isDeletingAccount}
              className="w-full border-red-500/20 hover:bg-red-500/5 text-red-400 justify-start disabled:opacity-50"
            >
              {isDeletingAccount ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin mr-2" />
                  Deleting Account...
                </div>
              ) : (
                "Delete Account"
              )}
            </Button>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="font-grotesk font-semibold text-text">
                Appearance
              </h2>
              <p className="text-text-muted text-sm">
                Customize your interface
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg-light/50">
                  {theme === "dark" ? (
                    <Moon className="w-4 h-4 text-text-muted" />
                  ) : (
                    <Sun className="w-4 h-4 text-text-muted" />
                  )}
                </div>
                <div>
                  <Label className="text-text font-medium">Theme</Label>
                  <p className="text-text-muted text-sm">
                    Choose between light and dark theme
                  </p>
                </div>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => {
                  const newTheme = checked ? "dark" : "light";
                  setTheme(newTheme);
                  toast({
                    title: "Theme updated",
                    description: `Switched to ${newTheme} theme`,
                  });
                }}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg-light/50">
                  <Palette className="w-4 h-4 text-text-muted" />
                </div>
                <div>
                  <Label className="text-text font-medium">System Theme</Label>
                  <p className="text-text-muted text-sm">
                    Follow your system's theme preference
                  </p>
                </div>
              </div>
              <Switch
                checked={theme === "system"}
                onCheckedChange={(checked) => {
                  const newTheme = checked ? "system" : "dark";
                  setTheme(newTheme);
                  toast({
                    title: "Theme updated",
                    description: checked
                      ? "Following system theme preference"
                      : "Switched to dark theme",
                  });
                }}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            {/* Theme Preview */}
            <div className="pt-4 border-t border-border-custom">
              <Label className="text-text font-medium mb-3 block">
                Theme Preview
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {/* Light Theme Preview */}
                <button
                  onClick={() => {
                    setTheme("light");
                    toast({
                      title: "Theme updated",
                      description: "Switched to light theme",
                    });
                  }}
                  className={`relative p-3 rounded-xl border-2 transition-all duration-200 ${
                    theme === "light"
                      ? "border-primary shadow-lg scale-105"
                      : "border-border-custom hover:border-border-light"
                  }`}
                >
                  <div className="bg-white rounded-lg p-2 space-y-1">
                    <div className="bg-gray-200 h-2 rounded w-full"></div>
                    <div className="bg-gray-300 h-1.5 rounded w-3/4"></div>
                    <div className="bg-blue-500 h-1.5 rounded w-1/2"></div>
                  </div>
                  <span className="text-xs text-text-muted mt-1 block">
                    Light
                  </span>
                  {theme === "light" && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                    </div>
                  )}
                </button>

                {/* Dark Theme Preview */}
                <button
                  onClick={() => {
                    setTheme("dark");
                    toast({
                      title: "Theme updated",
                      description: "Switched to dark theme",
                    });
                  }}
                  className={`relative p-3 rounded-xl border-2 transition-all duration-200 ${
                    theme === "dark"
                      ? "border-primary shadow-lg scale-105"
                      : "border-border-custom hover:border-border-light"
                  }`}
                >
                  <div className="bg-gray-900 rounded-lg p-2 space-y-1">
                    <div className="bg-gray-700 h-2 rounded w-full"></div>
                    <div className="bg-gray-600 h-1.5 rounded w-3/4"></div>
                    <div className="bg-blue-400 h-1.5 rounded w-1/2"></div>
                  </div>
                  <span className="text-xs text-text-muted mt-1 block">
                    Dark
                  </span>
                  {theme === "dark" && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                    </div>
                  )}
                </button>

                {/* System Theme Preview */}
                <button
                  onClick={() => {
                    setTheme("system");
                    toast({
                      title: "Theme updated",
                      description: "Following system theme preference",
                    });
                  }}
                  className={`relative p-3 rounded-xl border-2 transition-all duration-200 ${
                    theme === "system"
                      ? "border-primary shadow-lg scale-105"
                      : "border-border-custom hover:border-border-light"
                  }`}
                >
                  <div className="rounded-lg p-2 space-y-1 bg-gradient-to-r from-gray-900 to-white">
                    <div className="bg-gradient-to-r from-gray-700 to-gray-200 h-2 rounded w-full"></div>
                    <div className="bg-gradient-to-r from-gray-600 to-gray-300 h-1.5 rounded w-3/4"></div>
                    <div className="bg-blue-500 h-1.5 rounded w-1/2"></div>
                  </div>
                  <span className="text-xs text-text-muted mt-1 block">
                    System
                  </span>
                  {theme === "system" && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                    </div>
                  )}
                </button>
              </div>
            </div>
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

export default SettingsPreferences;
