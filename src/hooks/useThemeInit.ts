import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useUserPreferences } from './useUserPreferences';

/**
 * Hook that initializes the theme from user preferences on app load
 * This only runs once and doesn't create any ongoing synchronization
 */
export const useThemeInit = () => {
  const { setTheme } = useTheme();
  const { theme: userTheme, isLoading } = useUserPreferences();

  useEffect(() => {
    // Only set theme once when user preferences are loaded
    if (!isLoading && userTheme) {
      setTheme(userTheme);
    }
  }, [isLoading]); // Only depend on isLoading, not userTheme to avoid re-runs

  return { isLoading };
}; 