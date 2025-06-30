import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePostHog } from 'posthog-js/react';
import { useAuth } from './useAuth';

export const usePageTracking = () => {
  const location = useLocation();
  const posthog = usePostHog();
  const { user } = useAuth();

  useEffect(() => {
    if (!posthog) return;

    // Get page title from document or generate from pathname
    const getPageTitle = (pathname: string): string => {
      // Try to get actual page title first
      if (document.title && document.title !== 'jdmatchr') {
        return document.title;
      }

      // Generate title from pathname
      const pathMap: Record<string, string> = {
        '/': 'Home',
        '/login': 'Login',
        '/signup': 'Sign Up',
        '/contact': 'Contact',
        '/privacy': 'Privacy Policy',
        '/terms': 'Terms of Service',
        '/reset-password': 'Reset Password',
        '/email-confirmed': 'Email Confirmed',
        '/dashboard': 'Dashboard Overview',
        '/dashboard/new': 'New Analysis',
        '/dashboard/reports': 'My Reports',
        '/dashboard/settings': 'Settings',
      };

      // Check for exact match first
      if (pathMap[pathname]) {
        return pathMap[pathname];
      }

      // Check for dashboard sub-routes
      if (pathname.startsWith('/dashboard/reports/')) {
        return 'Report Detail';
      }
      if (pathname.startsWith('/dashboard/settings/')) {
        return 'Settings';
      }

      // Default fallback
      return pathname.split('/').filter(Boolean).join(' > ') || 'Unknown Page';
    };

    const pageTitle = getPageTitle(location.pathname);

    // Track page view with additional context
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      $pathname: location.pathname,
      $search: location.search,
      $hash: location.hash,
      page_title: pageTitle,
      // Add user context if available
      user_id: user?.id,
      user_email: user?.email,
      // Add timestamp
      timestamp: new Date().toISOString(),
    });

    // Set user properties if user is logged in
    if (user) {
      posthog.identify(user.id, {
        email: user.email,
        full_name: user.user_metadata?.full_name,
        last_seen: new Date().toISOString(),
      });
    }

    console.log(`📊 Page tracked: ${pageTitle} (${location.pathname})`);
  }, [location.pathname, location.search, location.hash, posthog, user]);
}; 