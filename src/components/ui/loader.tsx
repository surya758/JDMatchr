import React from "react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

const Loader = ({ size = "md", className, text }: LoaderProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div
      className={cn("flex items-center justify-center space-x-2", className)}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-bg-light border-t-primary",
          sizeClasses[size]
        )}
      />
      {text && (
        <span
          className={cn(
            "font-aoenik text-text-muted animate-pulse",
            textSizeClasses[size]
          )}
        >
          {text}
        </span>
      )}
    </div>
  );
};

// Overlay loader for full-screen or container loading
interface LoaderOverlayProps {
  isLoading: boolean;
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const LoaderOverlay = ({
  isLoading,
  text,
  size = "md",
  className,
}: LoaderOverlayProps) => {
  if (!isLoading) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-xl",
        className
      )}
    >
      <Loader size={size} text={text} />
    </div>
  );
};

// Inline loader for buttons and small components
interface LoaderInlineProps {
  isLoading: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const LoaderInline = ({
  isLoading,
  size = "sm",
  className,
}: LoaderInlineProps) => {
  if (!isLoading) return null;

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-white/75 border-t-primary",
        size === "sm" ? "w-4 h-4" : size === "md" ? "w-6 h-6" : "w-8 h-8",
        className
      )}
    />
  );
};

export { Loader, LoaderOverlay, LoaderInline };
