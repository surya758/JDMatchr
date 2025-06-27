export interface UserPreferences {
  // Appearance
  theme: 'light' | 'dark' | 'system';
  
  // Dashboard Layout
  dashboard_sidebar_collapsed: boolean;
  
  // Notifications
  notifications_enabled: boolean;
  email_notifications: boolean;
  
  // Analysis & Reports
  default_analysis_view: 'list' | 'grid';
  results_per_page: 5 | 10 | 20 | 50;
  auto_expand_candidates: boolean;
  
  // Localization
  language: 'en' | 'es' | 'fr' | 'de';
  timezone: string;
}

export type UserPreferenceKey = keyof UserPreferences;

export type UserPreferenceValue<K extends UserPreferenceKey> = UserPreferences[K];

// Default preferences - should match the SQL function
export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  dashboard_sidebar_collapsed: false,
  notifications_enabled: true,
  email_notifications: true,
  default_analysis_view: 'list',
  results_per_page: 5,
  auto_expand_candidates: false,
  language: 'en',
  timezone: 'UTC',
};

// Preference categories for UI organization
export const PREFERENCE_CATEGORIES = {
  appearance: ['theme'] as const,
  dashboard: ['dashboard_sidebar_collapsed', 'default_analysis_view', 'results_per_page'] as const,
  notifications: ['notifications_enabled', 'email_notifications'] as const,
  behavior: ['auto_expand_candidates'] as const,
  localization: ['language', 'timezone'] as const,
} as const;

export type PreferenceCategory = keyof typeof PREFERENCE_CATEGORIES; 