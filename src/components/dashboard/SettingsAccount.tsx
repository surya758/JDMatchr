import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Lock,
  Save,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { useAuth } from "../../hooks/useAuth";
import { useUserProfile } from "../../hooks/useUserProfile";
import { useToast } from "../../hooks/use-toast";
import { useConfirmation } from "../../hooks/useConfirmation";
import { LoaderInline } from "../ui/loader";
import ConfirmationModal from "../ui/confirmation-modal";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";

const SettingsAccount = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, updateProfile, isUpdating } = useUserProfile();
  const { toast } = useToast();
  const {
    showConfirmation,
    hideConfirmation,
    confirmAction,
    isOpen: isConfirmationOpen,
    isLoading: isConfirmationLoading,
    config: confirmationConfig,
  } = useConfirmation();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || "",
  });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Sync form state with profile data when it loads
  useEffect(() => {
    if (profile?.full_name) {
      setProfileForm({
        full_name: profile.full_name,
      });
    }
  }, [profile]);

  // Clear password fields on component mount/refresh
  useEffect(() => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false,
    });
  }, []);

  const handleProfileUpdate = async () => {
    try {
      await updateProfile({
        full_name: profileForm.full_name,
      });

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation don't match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (!passwordForm.currentPassword) {
      toast({
        title: "Current Password Required",
        description: "Please enter your current password to continue.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsChangingPassword(true);

      // First, verify the current password by attempting to sign in
      if (!user?.email) {
        throw new Error("User email not found");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordForm.currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      // If current password is correct, proceed with password update
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (updateError) throw updateError;

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });
    } catch (error) {
      toast({
        title: "Password Change Failed",
        description:
          error instanceof Error ? error.message : "Failed to change password.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleDeleteAccount = async () => {
    showConfirmation(
      {
        title: "Delete Account",
        description:
          "This action cannot be undone and will permanently delete your account and all associated data.",
        confirmText: "Delete My Account",
        cancelText: "Keep My Account",
        variant: "destructive",
        children: (
          <div className="bg-bg-light/30 border border-border-light rounded-xl p-4 space-y-2">
            <h4 className="font-grotesk font-medium text-text text-sm mb-3">
              This will permanently delete:
            </h4>
            <ul className="space-y-1.5 text-sm text-text-muted">
              <li className="flex gap-2">
                <span className="text-red-400">•</span>
                <span>Your profile and personal information</span>
              </li>
              <li className="flex gap-2">
                <span className="text-red-400">•</span>
                <span>All your job reports and analysis data</span>
              </li>
              <li className="flex gap-2">
                <span className="text-red-400">•</span>
                <span>Your subscription and billing information</span>
              </li>
              <li className="flex gap-2">
                <span className="text-red-400">•</span>
                <span>Access to all premium features</span>
              </li>
              <li className="flex gap-2">
                <span className="text-red-400">•</span>
                <span>Any remaining credits or subscription time</span>
              </li>
            </ul>
            <div className="mt-3 pt-2 border-t border-border-light">
              <p className="text-xs text-red-400 font-medium">
                ⚠️ This action cannot be reversed or undone
              </p>
            </div>
          </div>
        ),
      },
      async () => {
        try {
          setIsDeletingAccount(true);

          // Call the delete account function
          const { error } = await supabase.functions.invoke(
            "delete-user-account",
            {
              body: { user_id: user?.id },
            }
          );

          if (error) throw error;

          // Sign out and redirect to home
          await signOut();
          navigate("/");

          toast({
            title: "Account Deleted",
            description: "Your account has been permanently deleted.",
          });
        } catch (error) {
          console.error("Account deletion error:", error);
          toast({
            title: "Deletion Failed",
            description:
              error instanceof Error
                ? error.message
                : "Failed to delete account. Please try again or contact support.",
            variant: "destructive",
          });
        } finally {
          setIsDeletingAccount(false);
        }
      }
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text">Account Settings</h1>
          <p className="text-text-muted">
            Manage your account information and security settings.
          </p>
        </div>

        {/* Profile Information */}
        <Card className="bg-bg/50 backdrop-blur-sm border-border-custom shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Profile Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Email Address</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-bg-light/50 cursor-not-allowed opacity-75"
              />
              <p className="text-xs text-text-subtle">
                Email address cannot be changed. Contact support if you need to
                update it.
              </p>
            </div>

            <Separator className="bg-border-custom/50" />

            {/* Full Name (Editable) */}
            <div className="space-y-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                type="text"
                value={profileForm.full_name}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, full_name: e.target.value })
                }
                placeholder="Enter your full name"
                className="bg-bg-light/30 border-border-custom focus:border-primary/50 transition-border-colors duration-300"
              />
            </div>

            {/* Update Profile Button */}
            <div className="pt-4">
              <Button
                onClick={handleProfileUpdate}
                disabled={
                  isUpdating || profileForm.full_name === profile?.full_name
                }
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isUpdating ? (
                  <>
                    <LoaderInline isLoading={isUpdating} />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Profile
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card className="bg-bg/50 backdrop-blur-sm border-border-custom shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="w-5 h-5" />
              <span>Change Password</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  placeholder="Enter current password"
                  className="bg-bg-light/30 border-border-custom focus:border-primary/50 transition-border-colors duration-300 pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("current")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                >
                  {showPasswords.current ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder="Enter new password"
                  className="bg-bg-light/30 border-border-custom focus:border-primary/50 transition-border-colors duration-300 pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                >
                  {showPasswords.new ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Confirm new password"
                  className="bg-bg-light/30 border-border-custom focus:border-primary/50 transition-border-colors duration-300 pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-bg-light/20 rounded-lg p-3 border border-border-custom/50">
              <p className="text-xs text-text-muted mb-2">
                Password requirements:
              </p>
              <ul className="text-xs text-text-subtle space-y-1">
                <li>• At least 6 characters long</li>
                <li>• Mix of letters and numbers recommended</li>
                <li>• Avoid using personal information</li>
              </ul>
            </div>

            {/* Change Password Button */}
            <div className="pt-4">
              <Button
                onClick={handlePasswordChange}
                disabled={
                  isChangingPassword ||
                  !passwordForm.currentPassword ||
                  !passwordForm.newPassword ||
                  !passwordForm.confirmPassword
                }
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isChangingPassword ? (
                  <>
                    <LoaderInline isLoading={isChangingPassword} />
                    Changing Password...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Change Password
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-bg/50 backdrop-blur-sm border border-red-500/20 rounded-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none"></div>
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <CardTitle className="font-grotesk text-text">
                Danger Zone
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative z-10 space-y-4">
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <h3 className="font-grotesk font-medium text-text mb-2">
                Delete Account
              </h3>
              <p className="text-sm text-text-muted mb-4">
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>
              <Button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount || isConfirmationLoading}
                variant="destructive"
                className="bg-red-500 hover:bg-red-600 text-white font-grotesk"
              >
                {isDeletingAccount || isConfirmationLoading ? (
                  <>
                    <LoaderInline isLoading className="mr-2" />
                    Deleting Account...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Modal */}
      {isConfirmationOpen && confirmationConfig && (
        <ConfirmationModal
          isOpen={isConfirmationOpen}
          onClose={hideConfirmation}
          onConfirm={confirmAction}
          isLoading={isConfirmationLoading}
          {...confirmationConfig}
        />
      )}
    </>
  );
};

export default SettingsAccount;
