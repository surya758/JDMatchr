import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { LoaderInline } from "./loader";

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "warning" | "info" | "success";
  isLoading?: boolean;
  children?: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
  isLoading = false,
  children,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "destructive":
        return {
          icon: XCircle,
          iconColor: "text-red-400",
          iconBg: "bg-red-500/10",
          confirmButtonClass: "bg-red-500 hover:bg-red-600 text-white",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          iconColor: "text-yellow-400",
          iconBg: "bg-yellow-500/10",
          confirmButtonClass: "bg-yellow-500 hover:bg-yellow-600 text-black",
        };
      case "success":
        return {
          icon: CheckCircle,
          iconColor: "text-green-400",
          iconBg: "bg-green-500/10",
          confirmButtonClass: "bg-green-500 hover:bg-green-600 text-white",
        };
      case "info":
      default:
        return {
          icon: Info,
          iconColor: "text-blue-400",
          iconBg: "bg-blue-500/10",
          confirmButtonClass:
            "bg-primary hover:bg-primary/90 text-primary-foreground",
        };
    }
  };

  const {
    icon: Icon,
    iconColor,
    iconBg,
    confirmButtonClass,
  } = getVariantStyles();

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Confirmation action failed:", error);
      // Don't close modal on error, let the parent handle it
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-bg/95 backdrop-blur-sm border border-border-custom">
        <AlertDialogHeader>
          <div className="flex items-center space-x-3 mb-2">
            <div
              className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}
            >
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <AlertDialogTitle className="font-grotesk text-text">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="font-grotesk text-text-muted">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {children && <div className="py-4">{children}</div>}

        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel
            onClick={onClose}
            disabled={isLoading}
            className="font-grotesk border-border-custom hover:bg-bg-light text-text"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={`font-grotesk ${confirmButtonClass} disabled:opacity-50`}
          >
            {isLoading ? (
              <>
                <LoaderInline isLoading={isLoading} className="mr-2" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationModal;
