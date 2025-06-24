import { useState, useCallback } from 'react';
import { ConfirmationModalProps } from '../components/ui/confirmation-modal';

type ConfirmationConfig = Omit<ConfirmationModalProps, 'isOpen' | 'onClose' | 'onConfirm' | 'isLoading'>;

interface UseConfirmationReturn {
  isOpen: boolean;
  isLoading: boolean;
  config: ConfirmationConfig | null;
  showConfirmation: (config: ConfirmationConfig, onConfirm: () => void | Promise<void>) => void;
  hideConfirmation: () => void;
  confirmAction: () => Promise<void>;
}

export const useConfirmation = (): UseConfirmationReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<ConfirmationConfig | null>(null);
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void | Promise<void>) | null>(null);

  const showConfirmation = useCallback((
    confirmationConfig: ConfirmationConfig,
    onConfirm: () => void | Promise<void>
  ) => {
    setConfig(confirmationConfig);
    setOnConfirmCallback(() => onConfirm);
    setIsOpen(true);
  }, []);

  const hideConfirmation = useCallback(() => {
    setIsOpen(false);
    setIsLoading(false);
    setConfig(null);
    setOnConfirmCallback(null);
  }, []);

  const confirmAction = useCallback(async () => {
    if (!onConfirmCallback) return;

    setIsLoading(true);
    try {
      await onConfirmCallback();
      hideConfirmation();
    } catch (error) {
      setIsLoading(false);
      throw error; // Re-throw to let parent handle the error
    }
  }, [onConfirmCallback, hideConfirmation]);

  return {
    isOpen,
    isLoading,
    config,
    showConfirmation,
    hideConfirmation,
    confirmAction,
  };
};

// Predefined confirmation configs for common actions
export const confirmationConfigs = {
  upgradeSubscription: (planName: string): ConfirmationConfig => ({
    title: `Upgrade to ${planName}`,
    description: `Are you sure you want to upgrade to the ${planName} plan? Your billing will be updated immediately.`,
    confirmText: `Upgrade to ${planName}`,
    cancelText: "Cancel",
    variant: "info" as const,
  }),

  cancelSubscription: (): ConfirmationConfig => ({
    title: "Cancel Subscription",
    description: "Are you sure you want to cancel your subscription? You'll keep access until your current billing period ends, then be downgraded to the Free plan.",
    confirmText: "Cancel Subscription",
    cancelText: "Keep Subscription",
    variant: "destructive" as const,
  }),

  reactivateSubscription: (): ConfirmationConfig => ({
    title: "Reactivate Subscription",
    description: "Are you sure you want to reactivate your subscription? Your billing will resume at the next period.",
    confirmText: "Reactivate",
    cancelText: "Cancel",
    variant: "success" as const,
  }),

  deleteAccount: (): ConfirmationConfig => ({
    title: "Delete Account",
    description: "This action cannot be undone. All your data, including reports and billing history, will be permanently deleted.",
    confirmText: "Delete Account",
    cancelText: "Cancel",
    variant: "destructive" as const,
  }),

  deleteReport: (): ConfirmationConfig => ({
    title: "Delete Report",
    description: "Are you sure you want to delete this report? This action cannot be undone.",
    confirmText: "Delete Report",
    cancelText: "Cancel",
    variant: "destructive" as const,
  }),

  startAnalysis: (resumeCount: number): ConfirmationConfig => ({
    title: "Start Analysis",
    description: `This will analyze ${resumeCount} resume${resumeCount !== 1 ? 's' : ''} and use 1 credit. Do you want to continue?`,
    confirmText: "Start Analysis",
    cancelText: "Cancel",
    variant: "info" as const,
  }),
}; 