import React, { useState } from "react";
import {
  Save,
  User,
  Bell,
  Shield,
  Palette,
  Edit3,
  X,
  Check,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useAuth } from "../../hooks/useAuth";
import { useUserProfile } from "../../hooks/useUserProfile";
import {
  useConfirmation,
  confirmationConfigs,
} from "../../hooks/useConfirmation";
import ConfirmationModal from "../ui/confirmation-modal";

const SettingsPreferences = () => {
  const { user } = useAuth();
  const { profile, updateProfile, isUpdating } = useUserProfile();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(profile?.full_name || "");

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
    darkMode: true,
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
      } catch (error) {
        alert("Failed to update name. Please try again.");
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
        // TODO: Implement actual account deletion logic
        // This would typically involve:
        // 1. Cancel active subscriptions
        // 2. Delete user data from database
        // 3. Sign out the user
        // 4. Redirect to home page

        alert("Account deletion is not yet implemented. This is a demo.");

        // Example implementation:
        // try {
        //   await deleteUserAccount(user.id);
        //   await signOut();
        //   navigate('/');
        // } catch (error) {
        //   alert('Failed to delete account. Please try again or contact support.');
        // }
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

        {/* Notification Settings */}
        <div className="bg-bg/50 backdrop-blur-sm border border-border-custom rounded-2xl p-6 shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-grotesk font-semibold text-text">
                Notifications
              </h2>
              <p className="text-text-muted text-sm">
                Configure your notification preferences
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-text font-medium">
                  Push Notifications
                </Label>
                <p className="text-text-muted text-sm">
                  Receive notifications about analysis completion
                </p>
              </div>
              <input
                type="checkbox"
                name="notifications"
                checked={formData.notifications}
                onChange={handleInputChange}
                className="w-4 h-4 rounded border-border-custom bg-bg/30 text-primary focus:ring-0"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-text font-medium">Email Reports</Label>
                <p className="text-text-muted text-sm">
                  Receive analysis reports via email
                </p>
              </div>
              <input
                type="checkbox"
                name="emailReports"
                checked={formData.emailReports}
                onChange={handleInputChange}
                className="w-4 h-4 rounded border-border-custom bg-bg/30 text-primary focus:ring-0"
              />
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
              className="w-full border-border-custom hover:bg-bg-light justify-start"
            >
              Change Password
            </Button>

            <Button
              variant="outline"
              className="w-full border-border-custom hover:bg-bg-light justify-start"
            >
              Two-Factor Authentication
            </Button>

            <Button
              variant="outline"
              onClick={handleDeleteAccount}
              disabled={isConfirmationLoading}
              className="w-full border-red-500/20 hover:bg-red-500/5 text-red-400 justify-start disabled:opacity-50"
            >
              Delete Account
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
              <div>
                <Label className="text-text font-medium">Dark Mode</Label>
                <p className="text-text-muted text-sm">
                  Use dark theme (currently enabled)
                </p>
              </div>
              <input
                type="checkbox"
                name="darkMode"
                checked={formData.darkMode}
                onChange={handleInputChange}
                disabled
                className="w-4 h-4 rounded border-border-custom bg-bg/30 text-primary focus:ring-0 opacity-50"
              />
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
