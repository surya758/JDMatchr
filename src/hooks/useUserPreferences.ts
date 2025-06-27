import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { UserPreferences, UserPreferenceKey, DEFAULT_PREFERENCES } from '../types/preferences';

// Query key factory for user preferences
const userPreferencesKeys = {
  all: ['userPreferences'] as const,
  detail: (userId: string) => [...userPreferencesKeys.all, userId] as const,
};

export const useUserPreferences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user preferences with React Query
  const {
    data: preferences,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: userPreferencesKeys.detail(user?.id || ''),
    queryFn: async (): Promise<UserPreferences> => {
      if (!user?.id) return DEFAULT_PREFERENCES;

      try {
        // First try to get existing preferences
        const { data: existingPrefs, error: fetchError } = await supabase
          .from('user_preferences')
          .select('preferences')
          .eq('user_id', user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching preferences:', fetchError);
          return DEFAULT_PREFERENCES;
        }

        if (existingPrefs?.preferences) {
          // Merge with defaults to ensure all keys exist
          const userPrefs = existingPrefs.preferences as any;
          return { ...DEFAULT_PREFERENCES, ...userPrefs };
        }

        // If no preferences exist, create them with defaults
        const { data: newPrefs, error: createError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            preferences: DEFAULT_PREFERENCES as any,
          })
          .select('preferences')
          .single();

        if (createError) {
          console.error('Error creating preferences:', createError);
          return DEFAULT_PREFERENCES;
        }

        return (newPrefs?.preferences as any) || DEFAULT_PREFERENCES;
      } catch (error) {
        console.error('Error in preferences query:', error);
        return DEFAULT_PREFERENCES;
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // Consider data fresh for 10 minutes
    retry: 2,
  });

  // Update single preference mutation
  const updatePreferenceMutation = useMutation({
    mutationFn: async ({ key, value }: { key: UserPreferenceKey; value: any }) => {
      if (!user?.id) throw new Error('No user logged in');

      const currentPrefs = preferences || DEFAULT_PREFERENCES;
      const updatedPrefs = { ...currentPrefs, [key]: value };

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: user.id,
            preferences: updatedPrefs as any,
          },
          { onConflict: 'user_id' }
        )
        .select('preferences')
        .single();

      if (error) throw error;
      return (data?.preferences as any) || updatedPrefs;
    },
    onSuccess: (updatedPrefs) => {
      queryClient.setQueryData(
        userPreferencesKeys.detail(user?.id || ''),
        updatedPrefs
      );
    },
  });

  // Update multiple preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      if (!user?.id) throw new Error('No user logged in');

      const currentPrefs = preferences || DEFAULT_PREFERENCES;
      const updatedPrefs = { ...currentPrefs, ...updates };

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: user.id,
            preferences: updatedPrefs as any,
          },
          { onConflict: 'user_id' }
        )
        .select('preferences')
        .single();

      if (error) throw error;
      return (data?.preferences as any) || updatedPrefs;
    },
    onSuccess: (updatedPrefs) => {
      queryClient.setQueryData(
        userPreferencesKeys.detail(user?.id || ''),
        updatedPrefs
      );
    },
  });

  // Reset preferences to defaults
  const resetPreferencesMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: user.id,
            preferences: DEFAULT_PREFERENCES as any,
          },
          { onConflict: 'user_id' }
        )
        .select('preferences')
        .single();

      if (error) throw error;
      return (data?.preferences as any) || DEFAULT_PREFERENCES;
    },
    onSuccess: (resetPrefs) => {
      queryClient.setQueryData(
        userPreferencesKeys.detail(user?.id || ''),
        resetPrefs
      );
    },
  });

  // Helper function to get a specific preference with type safety
  const getPreference = <K extends UserPreferenceKey>(key: K) => {
    const prefs = preferences || DEFAULT_PREFERENCES;
    return prefs[key] ?? DEFAULT_PREFERENCES[key];
  };

  return {
    // Data
    preferences: preferences || DEFAULT_PREFERENCES,
    isLoading,
    error,

    // Actions
    refetch,
    updatePreference: updatePreferenceMutation.mutateAsync,
    updatePreferences: updatePreferencesMutation.mutateAsync,
    resetPreferences: resetPreferencesMutation.mutateAsync,

    // Mutation states
    isUpdating: updatePreferenceMutation.isPending || updatePreferencesMutation.isPending,
    isResetting: resetPreferencesMutation.isPending,
    updateError: updatePreferenceMutation.error || updatePreferencesMutation.error,

    // Convenience helpers
    getPreference,
    
    // Quick access to common preferences
    theme: getPreference('theme'),
    isDashboardSidebarCollapsed: getPreference('dashboard_sidebar_collapsed'),
    notificationsEnabled: getPreference('notifications_enabled'),
    emailNotificationsEnabled: getPreference('email_notifications'),
    defaultAnalysisView: getPreference('default_analysis_view'),
    resultsPerPage: getPreference('results_per_page'),
    autoExpandCandidates: getPreference('auto_expand_candidates'),
    language: getPreference('language'),
    timezone: getPreference('timezone'),
  };
}; 