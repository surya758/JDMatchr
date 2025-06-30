import { usePostHog } from 'posthog-js/react';
import { useAuth } from './useAuth';

// Event names enum for consistency
export const ANALYTICS_EVENTS = {
  // Page tracking events
  PAGE_VIEWED: 'page_viewed',
  
  // Authentication events
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  
  // Analysis events
  ANALYSIS_STARTED: 'analysis_started',
  ANALYSIS_COMPLETED: 'analysis_completed',
  ANALYSIS_CANCELLED: 'analysis_cancelled',
  ANALYSIS_FAILED: 'analysis_failed',
  
  // File upload events
  RESUME_UPLOADED: 'resume_uploaded',
  JOB_DESCRIPTION_UPLOADED: 'job_description_uploaded',
  
  // Dashboard events
  REPORT_VIEWED: 'report_viewed',
  REPORT_DOWNLOADED: 'report_downloaded',
  SETTINGS_UPDATED: 'settings_updated',
  
  // Subscription events
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  SUBSCRIPTION_REACTIVATED: 'subscription_reactivated',
  
  // Contact events
  CONTACT_FORM_SUBMITTED: 'contact_form_submitted',
} as const;

export type AnalyticsEvent = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];

export const useAnalytics = () => {
  const posthog = usePostHog();
  const { user } = useAuth();

  const track = (event: AnalyticsEvent, properties?: Record<string, any>) => {
    if (!posthog) return;

    const eventProperties = {
      // Add user context
      user_id: user?.id,
      user_email: user?.email,
      // Add timestamp
      timestamp: new Date().toISOString(),
      // Add any custom properties
      ...properties,
    };

    posthog.capture(event, eventProperties);
    console.log(`📊 Event tracked: ${event}`, eventProperties);
  };

  const trackPageView = (pageName: string, additionalProperties?: Record<string, any>) => {
    track(ANALYTICS_EVENTS.PAGE_VIEWED, {
      page_name: pageName,
      ...additionalProperties,
    });
  };

  const trackAnalysisEvent = (
    eventType: 'started' | 'completed' | 'cancelled' | 'failed',
    properties?: {
      resumeCount?: number;
      jobTitle?: string;
      processingTime?: number;
      errorMessage?: string;
    }
  ) => {
    const eventMap = {
      started: ANALYTICS_EVENTS.ANALYSIS_STARTED,
      completed: ANALYTICS_EVENTS.ANALYSIS_COMPLETED,
      cancelled: ANALYTICS_EVENTS.ANALYSIS_CANCELLED,
      failed: ANALYTICS_EVENTS.ANALYSIS_FAILED,
    };

    track(eventMap[eventType], properties);
  };

  const trackFileUpload = (
    fileType: 'resume' | 'job_description',
    properties?: {
      fileName?: string;
      fileSize?: number;
      fileFormat?: string;
    }
  ) => {
    const event = fileType === 'resume' 
      ? ANALYTICS_EVENTS.RESUME_UPLOADED 
      : ANALYTICS_EVENTS.JOB_DESCRIPTION_UPLOADED;
    
    track(event, properties);
  };

  const trackAuthEvent = (
    eventType: 'signup' | 'login' | 'logout',
    properties?: {
      method?: string;
      provider?: string;
    }
  ) => {
    const eventMap = {
      signup: ANALYTICS_EVENTS.USER_SIGNED_UP,
      login: ANALYTICS_EVENTS.USER_LOGGED_IN,
      logout: ANALYTICS_EVENTS.USER_LOGGED_OUT,
    };

    track(eventMap[eventType], properties);
  };

  const trackSubscriptionEvent = (
    eventType: 'upgraded' | 'cancelled' | 'reactivated',
    properties?: {
      planName?: string;
      amount?: number;
    }
  ) => {
    const eventMap = {
      upgraded: ANALYTICS_EVENTS.SUBSCRIPTION_UPGRADED,
      cancelled: ANALYTICS_EVENTS.SUBSCRIPTION_CANCELLED,
      reactivated: ANALYTICS_EVENTS.SUBSCRIPTION_REACTIVATED,
    };

    track(eventMap[eventType], properties);
  };

  return {
    track,
    trackPageView,
    trackAnalysisEvent,
    trackFileUpload,
    trackAuthEvent,
    trackSubscriptionEvent,
    EVENTS: ANALYTICS_EVENTS,
  };
}; 